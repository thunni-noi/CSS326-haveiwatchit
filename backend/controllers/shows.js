import pool from "../db/db.js"

// Use to fetch shows information!
const show_query = `
SELECT  s.id, s.name AS title, s.synopsis, s.status, s.type,
        DATE_FORMAT(s.release_date, '%d-%m-%Y') AS release_date,
        YEAR(s.release_date) AS release_year,
        s.episode_count, s.duration, s.content_rating, s.photo_url, s.cover_url,
        ROUND(r.avg_score, 1) AS avg_score,
        COALESCE(r.review_count, 0) as review_count
FROM    shows s
        LEFT JOIN (
            SELECT show_id, AVG(review_score) AS avg_score, COUNT(*) AS review_count
            FROM reviews
            GROUP BY show_id
        )   r ON r.show_id = s.id
           `

// Map database into json
const showToJson = (row) => ({
    id: Number(row.id),
    title: row.title,
    type: row.type,
    synopsis: row.synopsis,
    status: row.status,
    release_date: row.release_date,
    release_year: row.release_year,
    episode_count: row.episode_count,
    duration: row.duration,
    content_rating: row.content_rating,
    poster_url: row.photo_url || row.cover_url || null,
    backdrop_url: row.cover_url || row.photo_url || null,
    avg_score: row.avg_score === null ? null : Number(row.avg_score),
    review_count: Number(row.review_count)
});

// Wrapper used to handle error for all api calls
const wrapper = (errMsg, controller) => async (req, res) =>
    {try {
        await controller(req, res);
    } catch (error) {
        console.error(`${errMsg}`, error);
        res.status(500).json({message: errMsg});
    }};

// GET /api/shows/:id
export const getShowById = wrapper("Unable to fetch shows/.", async (req, res) => {
    const id = Number(req.params.id)
    if (Number.isNaN(id) || id < 0) return res.status(400).json({message: "Invalid id!"});
    

    const [rows] = await pool.execute(`${show_query} WHERE s.id = ?`, [id]);
    if (rows.length === 0) return res.status(404).json({message: "Show not found!"});

    const [platforms] = await pool.execute(`
        SELECT p.id, p.name, p.logo_url, p.url 
        FROM show_sources ss
        JOIN show_platform p ON p.id = ss.platform_id
        WHERE ss.show_id = ?
        ORDER by p.name
        `, [id]
    );

    const [credits] = await pool.execute(
        `
        SELECT sr.role, sr.character_name, sr.character_photo, pe.id AS person_id, pe.name AS persona_name, pe.photo_url AS person_photo
        FROM show_roles sr
        JOIN people pe ON pe.id = sr.people_id
        WHERE sr.show_id = ?
        ORDER BY sr.id
        `, [id]
    );

    const creditMapper = (credit) => ({
        person_id: Number(credit.person_id),
        name: credit.person_name,
        photo_url: credit.person_photo || credit.character_photo || null,
        role: credit.role,
        character_name: credit.character_name,
        character_photo: credit.character_photo || credit.person_photo || null
    });

    return res.json({
        ...showToJson(rows[0]),
        platforms,
        cast: credits.filter((c) => ['Actor', 'Voice Actor'].includes(c.role)).map(creditMapper),
        crew: credits.filter((c) => !['Actor', 'Voice Actor'].includes(c.role)).map(creditMapper) 
    });
})

// /api/shows/:id/reviews?limit=10&offset=0
// query : {limit: 5 (max50)}
export const getShowReviews = wrapper("Unable to load reviews", async(req, res) => {
    const id = Number(req.params.id)

    let limit = Number(req.query.limit ?? 10);
    let offset = Number(req.query.offset ?? 0);
    if (Number.isNaN(limit) || limit <= 0) return res.status(400).json({message: "Invalid limit!"});
    if (Number.isNaN(offset) || offset < 0) return res.status(400).json({message: "Invalid offset!"});
    limit = Math.min(limit, 20);

    const [shows] = await pool.execute(`SELECT id FROM shows WHERE id = ?`, [id]);
    if (shows.length === 0) return res.status(404).json({message: "Show not found!"});

    const [rows] = await pool.execute(`
        SELECT  u.username, r.review_score AS score, r.review_txt AS text,
                DATE_FORMAT(r.created_at, '%d-%m-%Y') AS created_at
        FROM    reviews r
        JOIN users u ON u.id = r.user_id
        WHERE r.show_id = ?
        ORDER BY r.created_at DESC, r.user_id DESC
        LIMIT ? OFFSET ?
        `, [id, limit + 1, offset]
    )

    const stillMore = rows.length > limit

    return res.json({
        reviews: rows.slice(0, limit),
        still_more: stillMore
    })
})

// Search!
// /api/shows/search?q=name&limit=num
export const searchShows = wrapper("Search failed", async(req, res) => {
    let limit = Number(req.query.limit ?? 5);
    if (Number.isNaN(limit) || limit <= 0) return res.status(400).json({message: "Invalid limit!"});
    limit = Math.min(limit, 20)
    // sql wildcard prevention
    const escapeChar = (text) => text.replace(/[!%_]/g, "!$&");
    const query = typeof req.query.q === "string" ? req.query.q.trim().slice(0,100) : "";
    // empty search
    if (!query) return res.json([]);

    // for ranking
    const matched = `%${escapeChar(query)}%`;
    const startWith = `%${escapeChar(query)}`;

    const [rows] = await pool.execute(`
        ${show_query}
        WHERE s.name LIKE ? ESCAPE '!'
        ORDER BY    (s.name = ?) DESC,
                    (s.name LIKE ? ESCAPE '!') DESC,
                    s.name ASC,
                    s.id ASC
        LIMIT ?
        `, [matched, query, startWith, limit]);

    return res.json(rows.map(showToJson));

});

// Get random shows
// Used for main page
// /api/shows/randoms?count=num&need_backdrop=1/0
export const getRandomShows = wrapper("Unable to fetch random shows!", async(req, res) => {
    let count = Number(req.query.count ?? 5);
    if (Number.isNaN(count) || count <= 0) return res.status(400).json({message: "Invalid count!"});
    count = Math.min(count, 10)

    const need_cover = (req.query.need_cover === "1" ? true : false);

    const [rows] = await pool.execute(`
        ${show_query}
        ${need_cover? `WHERE s.cover_url IS NOT NULL` : ""}
        ORDER BY RAND()
        LIMIT ?
        `, [count]);

    return res.json(rows.map(showToJson));
})

// Get most score
// /api/shows/top-rated?limit=5
// weigh calculation use IMDb's bayesian average
// ( v/(v+m) * R ) + ( m / (v+m) * C ) -- R = avg score, v = count, m = minimum count, c = mean of all shows
export const getTopShows = wrapper("Unable to fetch top rated shows", async(req, res) => {
    let limit = Number(req.query.limit ?? 5);
    if (Number.isNaN(limit) || limit <= 0) return res.status(400).json({message: "Invalid limit!"});
    limit = Math.min(limit, 10)

    // You ain't ready for this monstrosity trust me
    const weighted_query = `
    SELECT  s.id, s.name AS title, s.synopsis, s.status, s.type,
            DATE_FORMAT(s.release_date, '%d-%m-%Y') AS release_date,
            YEAR(s.release_date) AS release_year,
            s.episode_count, s.duration, s.content_rating, s.photo_url, s.cover_url,
            ROUND(r.avg_score, 1) AS avg_score,
            r.review_count as review_count,
            ROUND (
                (r.review_count / (r.review_count + 10)) * r.avg_score
                + (10 / (10 + review_count)) * g.global_avg
            , 2) AS weighted_score

    FROM    shows s
    JOIN (
            SELECT show_id, AVG(review_score) AS avg_score, COUNT(*) AS review_count
            FROM reviews
            GROUP BY show_id
        )   r ON r.show_id = s.id
    CROSS JOIN (
            SELECT AVG(review_score) AS global_avg FROM reviews
    )       g
    `
    const [rows] = await pool.execute(`
        ${weighted_query}
        ORDER BY weighted_score DESC, review_count DESC, s.id ASC
        LIMIT ?
        `, [limit])
    
    return res.json(rows.map((row) => ({
        ...showToJson(row),
        weighted_score: Number(row.weighted_score)
    })));
})

// use for home page "browse by type"
// /api/shows/getByType?type=movie?limit=12?offset=0
export const getShowByType = wrapper("Unable to fetch show by types", async(req, res) => {
    const SHOW_TYPES = ["movies", "series", "tv_shows", "anime"];
    const showType = req.query.type;
    if (!SHOW_TYPES.includes(showType)) return res.status(400).json({message: `${showType} does not exists in database!`})

    let limit = Number(req.query.limit ?? 15);
    let offset = Number(req.query.offset ?? 0);
    if (Number.isNaN(limit) || limit <= 0) return res.status(400).json({message: "Invalid limit!"});
    if (Number.isNaN(offset) || offset < 0) return res.status(400).json({message: "Invalid offset!"});
    limit = Math.min(limit, 20);

    const[rows] = await pool.execute(`
        ${show_query}
        WHERE s.type = ?
        ORDER BY s.release_date DESC, s.id ASC
        LIMIT ? OFFSET ?
        `, [showType, limit + 1, offset]
    )

    const stillMore = rows.length > limit;
    return res.json({
        shows: rows.slice(0, limit).map(showToJson),
        still_more: stillMore
    })
} )