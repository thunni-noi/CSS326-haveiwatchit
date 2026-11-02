import pool from "../db/db.js";//(connect to db)

// Load a show's platforms and cast/crew, along with options for editing those links.
export const getShowAssociations = async (req, res) => {
    const showId = req.params.id;
    if (!/^\d+$/.test(showId)) {
        return res.status(400).json({ message: "Invalid show ID." });
    }

    try {
        const [[show]] = await pool.execute(
            "SELECT id FROM shows WHERE id = ?",
            [showId],
        );
        if (!show) {
            return res.status(404).json({ message: "Show not found." });
        }

        const [platforms] = await pool.execute(
            `SELECT p.id, p.name, p.logo_url, p.url
            FROM show_sources source
            JOIN show_platform p ON p.id = source.platform_id
            WHERE source.show_id = ?
            ORDER BY p.name`,
            [showId],
        );
        const [cast] = await pool.execute(
            `SELECT credit.id, credit.role, credit.character_name, credit.character_photo,
                    person.id AS people_id, person.name AS person_name, person.bio AS person_bio,
                    person.photo_url AS person_photo_url
            FROM show_roles credit
            JOIN people person ON person.id = credit.people_id
            WHERE credit.show_id = ?
            ORDER BY person.name`,
            [showId],
        );
        const [platformOptions] = await pool.execute(
            "SELECT id, name FROM show_platform ORDER BY name LIMIT 500",
        );
        const [peopleOptions] = await pool.execute(
            "SELECT id, name FROM people ORDER BY name LIMIT 1000",
        );
        return res.json({ platforms, cast, platformOptions, peopleOptions });
    } catch (error) {
        console.error("Admin show associations failed:", error);
        return res.status(500).json({ message: "Unable to load show details." });
    }
};
