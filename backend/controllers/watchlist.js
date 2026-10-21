import pool from "../db/db.js";

const statuses = ["wishlist", "watching", "watched", "rewatching", "on_hold", "dropped"];

const parsePositiveId = (value) => {
    if (!/^\d+$/.test(String(value))) return null;
    const id = Number(value);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
};

export const getWatchlist = async (req, res) => {
    try {
        const [items] = await pool.execute(
            `SELECT item.show_id, item.status, item.updated_at,
                    s.name AS title, s.type, s.synopsis,
                    YEAR(s.release_date) AS release_year,
                    s.duration, s.episode_count, s.content_rating,
                    s.photo_url AS poster_url,
                    ROUND(r.avg_score, 1) AS avg_score,
                    COALESCE(r.review_count, 0) AS review_count
             FROM watchlist_items item
             JOIN shows s ON s.id = item.show_id
             LEFT JOIN (
                 SELECT show_id, AVG(review_score) AS avg_score, COUNT(*) AS review_count
                 FROM reviews
                 GROUP BY show_id
             ) r ON r.show_id = s.id
             WHERE item.user_id = ?
             ORDER BY item.updated_at DESC, s.name`,
            [req.user.id],
        );

        return res.json({ items });
    } catch (error) {
        console.error("Watchlist load failed:", error);
        return res.status(500).json({ message: "Unable to load your watchlist." });
    }
};

export const addWatchlistItem = async (req, res) => {
    const showId = parsePositiveId(req.body?.show_id);
    const status = req.body?.status ?? "wishlist";
    if (!showId) {
        return res.status(400).json({ message: "A valid show ID is required." });
    }
    if (!statuses.includes(status)) {
        return res.status(400).json({ message: "Invalid watchlist status." });
    }

    try {
        const [result] = await pool.execute(
            "INSERT INTO watchlist_items (user_id, show_id, status) VALUES (?, ?, ?)",
            [req.user.id, showId, status],
        );
        if (!result.affectedRows) {
            return res.status(500).json({ message: "Show was not added to your watchlist." });
        }
        return res.status(201).json({ message: "Show added to your watchlist." });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ message: "This show is already on your watchlist." });
        }
        if (error.code === "ER_NO_REFERENCED_ROW_2") {
            return res.status(404).json({ message: "Show not found." });
        }
        console.error("Watchlist add failed:", error);
        return res.status(500).json({ message: "Unable to add this show to your watchlist." });
    }
};

export const updateWatchlistItem = async (req, res) => {
    const showId = parsePositiveId(req.params.showId);
    const status = req.body?.status;
    if (!showId) {
        return res.status(400).json({ message: "A valid show ID is required." });
    }
    if (!statuses.includes(status)) {
        return res.status(400).json({ message: "Invalid watchlist status." });
    }

    try {
        const [result] = await pool.execute(
            "UPDATE watchlist_items SET status = ? WHERE user_id = ? AND show_id = ?",
            [status, req.user.id, showId],
        );
        if (!result.affectedRows) {
            return res.status(404).json({ message: "Watchlist item not found." });
        }
        return res.json({ message: "Watchlist status updated." });
    } catch (error) {
        console.error("Watchlist update failed:", error);
        return res.status(500).json({ message: "Unable to update this watchlist item." });
    }
};

export const deleteWatchlistItem = async (req, res) => {
    const showId = parsePositiveId(req.params.showId);
    if (!showId) {
        return res.status(400).json({ message: "A valid show ID is required." });
    }

    try {
        const [result] = await pool.execute(
            "DELETE FROM watchlist_items WHERE user_id = ? AND show_id = ?",
            [req.user.id, showId],
        );
        if (!result.affectedRows) {
            return res.status(404).json({ message: "Watchlist item not found." });
        }
        return res.json({ message: "Show removed from your watchlist." });
    } catch (error) {
        console.error("Watchlist delete failed:", error);
        return res.status(500).json({ message: "Unable to remove this watchlist item." });
    }
};
