import { randomUUID } from "node:crypto";
import pool from "../db/db.js";

const asBoolean = (value) => value === true || value === 1 || value === "1" || value === "true";

const getCollection = async (collectionId, userId) => {
    const [rows] = await pool.execute(
        `SELECT c.id, c.name, c.is_public, c.share_uuid, u.username AS owner
         FROM collections c
         JOIN users u ON u.id = c.user_id
         WHERE c.id = ? AND c.user_id = ?`,
        [collectionId, userId]
    );
    return rows[0] ?? null;
};

const getItems = async (collectionId) => {
    const [items] = await pool.execute(
        `SELECT s.id, s.name, s.type, s.photo_url
         FROM collection_items ci
         JOIN shows s ON s.id = ci.show_id
         WHERE ci.collection_id = ?
         ORDER BY s.name`,
        [collectionId]
    );
    return items;
};

const attachPreviewItems = async (collections) => {
    if (!collections.length) return collections;

    const ids = collections.map((collection) => collection.id);
    const placeholders = ids.map(() => "?").join(", ");
    const [previewRows] = await pool.execute(
        `SELECT previews.collection_id, previews.id, previews.name,
                previews.type, previews.photo_url
         FROM (
             SELECT ci.collection_id, s.id, s.name, s.type, s.photo_url,
                    ROW_NUMBER() OVER (
                        PARTITION BY ci.collection_id
                        ORDER BY ci.show_id DESC
                    ) AS preview_order
             FROM collection_items ci
             JOIN shows s ON s.id = ci.show_id
             WHERE ci.collection_id IN (${placeholders})
         ) AS previews
         WHERE previews.preview_order <= 5
         ORDER BY previews.collection_id, previews.preview_order`,
        ids
    );
    const previewsByCollection = new Map();
    for (const item of previewRows) {
        const key = String(item.collection_id);
        const items = previewsByCollection.get(key) ?? [];
        items.push(item);
        previewsByCollection.set(key, items);
    }
    for (const collection of collections) {
        collection.preview_items = previewsByCollection.get(String(collection.id)) ?? [];
    }
    return collections;
};

export const listCollections = async (req, res) => {
    try {
        const [collections] = await pool.execute(
            `SELECT c.id, c.name, c.is_public, c.share_uuid, u.username AS owner,
                    COUNT(ci.show_id) AS item_count
             FROM collections c
             JOIN users u ON u.id = c.user_id
             LEFT JOIN collection_items ci ON ci.collection_id = c.id
             WHERE c.user_id = ?
             GROUP BY c.id
             ORDER BY c.id DESC`,
            [req.user.id]
        );

        if (collections.length) {
            const [previewRows] = await pool.execute(
                `SELECT previews.collection_id, previews.id, previews.name,
                        previews.type, previews.photo_url
                 FROM (
                     SELECT ci.collection_id, s.id, s.name, s.type, s.photo_url,
                            ROW_NUMBER() OVER (
                                PARTITION BY ci.collection_id
                                ORDER BY ci.show_id DESC
                            ) AS preview_order
                     FROM collection_items ci
                     JOIN collections c ON c.id = ci.collection_id
                     JOIN shows s ON s.id = ci.show_id
                     WHERE c.user_id = ?
                 ) AS previews
                 WHERE previews.preview_order <= 5
                 ORDER BY previews.collection_id, previews.preview_order`,
                [req.user.id]
            );
            const previewsByCollection = new Map();
            for (const item of previewRows) {
                const key = String(item.collection_id);
                const items = previewsByCollection.get(key) ?? [];
                items.push(item);
                previewsByCollection.set(key, items);
            }
            for (const collection of collections) {
                collection.preview_items = previewsByCollection.get(String(collection.id)) ?? [];
            }
        }

        return res.json({ collections });
    } catch (error) {
        console.error("Failed to load collections:", error);
        return res.status(500).json({ message: "Unable to load collections." });
    }
};

export const listPublicCollections = async (req, res) => {
    try {
        const [collections] = await pool.execute(
            `SELECT c.id, c.name, c.is_public, c.share_uuid, u.username AS owner,
                    COUNT(ci.show_id) AS item_count
             FROM collections c
             JOIN users u ON u.id = c.user_id
             LEFT JOIN collection_items ci ON ci.collection_id = c.id
             WHERE c.is_public = TRUE AND c.user_id <> ?
             GROUP BY c.id
             ORDER BY c.id DESC`,
            [req.user.id]
        );

        if (collections.length) {
            const [previewRows] = await pool.execute(
                `SELECT previews.collection_id, previews.id, previews.name,
                        previews.type, previews.photo_url
                 FROM (
                     SELECT ci.collection_id, s.id, s.name, s.type, s.photo_url,
                            ROW_NUMBER() OVER (
                                PARTITION BY ci.collection_id
                                ORDER BY ci.show_id DESC
                            ) AS preview_order
                     FROM collection_items ci
                     JOIN collections c ON c.id = ci.collection_id
                     JOIN shows s ON s.id = ci.show_id
                     WHERE c.is_public = TRUE AND c.user_id <> ?
                 ) AS previews
                 WHERE previews.preview_order <= 5
                 ORDER BY previews.collection_id, previews.preview_order`,
                [req.user.id]
            );
            const previewsByCollection = new Map();
            for (const item of previewRows) {
                const key = String(item.collection_id);
                const items = previewsByCollection.get(key) ?? [];
                items.push(item);
                previewsByCollection.set(key, items);
            }
            for (const collection of collections) {
                collection.preview_items = previewsByCollection.get(String(collection.id)) ?? [];
            }
        }

        return res.json({ collections });
    } catch (error) {
        console.error("Failed to load public collections:", error);
        return res.status(500).json({ message: "Unable to load public collections." });
    }
};

export const listFollowedCollections = async (req, res) => {
    try {
        const [collections] = await pool.execute(
            `SELECT c.id, c.name, c.is_public, c.share_uuid, u.username AS owner,
                    COUNT(ci.show_id) AS item_count
             FROM collection_follows cf
             JOIN collections c ON c.id = cf.collection_id AND c.is_public = TRUE
             JOIN users u ON u.id = c.user_id
             LEFT JOIN collection_items ci ON ci.collection_id = c.id
             WHERE cf.user_id = ?
             GROUP BY c.id, cf.created_at
             ORDER BY cf.created_at DESC`,
            [req.user.id]
        );
        await attachPreviewItems(collections);
        return res.json({ collections });
    } catch (error) {
        console.error("Failed to load followed collections:", error);
        return res.status(500).json({ message: "Unable to load followed collections." });
    }
};

export const searchPublicCollections = async (req, res) => {
    const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
    if (query.length < 2) {
        return res.status(400).json({ message: "Enter at least 2 characters to search." });
    }

    try {
        const uuidMatch = query.match(/\/collections\/share\/([\da-f-]{36})(?:[/?#]|$)/i)
            ?? query.match(/^([\da-f-]{36})$/i);
        const sql = uuidMatch
            ? `SELECT c.id, c.name, c.is_public, c.share_uuid, u.username AS owner,
                      COUNT(ci.show_id) AS item_count,
                      EXISTS(SELECT 1 FROM collection_follows cf WHERE cf.user_id = ? AND cf.collection_id = c.id) AS is_followed
               FROM collections c
               JOIN users u ON u.id = c.user_id
               LEFT JOIN collection_items ci ON ci.collection_id = c.id
               WHERE c.is_public = TRUE AND c.user_id <> ? AND c.share_uuid = ?
               GROUP BY c.id
               ORDER BY c.id DESC`
            : `SELECT c.id, c.name, c.is_public, c.share_uuid, u.username AS owner,
                      COUNT(ci.show_id) AS item_count,
                      EXISTS(SELECT 1 FROM collection_follows cf WHERE cf.user_id = ? AND cf.collection_id = c.id) AS is_followed
               FROM collections c
               JOIN users u ON u.id = c.user_id
               LEFT JOIN collection_items ci ON ci.collection_id = c.id
               WHERE c.is_public = TRUE AND c.user_id <> ? AND u.username LIKE ?
               GROUP BY c.id
               ORDER BY c.id DESC
               LIMIT 30`;
        const params = uuidMatch
            ? [req.user.id, req.user.id, uuidMatch[1]]
            : [req.user.id, req.user.id, `%${query}%`];
        const [collections] = await pool.execute(sql, params);
        await attachPreviewItems(collections);
        return res.json({ collections });
    } catch (error) {
        console.error("Failed to search public collections:", error);
        return res.status(500).json({ message: "Unable to search public collections." });
    }
};

export const followCollection = async (req, res) => {
    try {
        const [collections] = await pool.execute(
            "SELECT id FROM collections WHERE id = ? AND user_id <> ? AND is_public = TRUE",
            [req.params.id, req.user.id]
        );
        if (!collections.length) {
            return res.status(404).json({ message: "Public collection not found." });
        }
        await pool.execute(
            "INSERT IGNORE INTO collection_follows (user_id, collection_id) VALUES (?, ?)",
            [req.user.id, collections[0].id]
        );
        return res.json({ followed: true });
    } catch (error) {
        console.error("Failed to follow collection:", error);
        return res.status(500).json({ message: "Unable to follow collection." });
    }
};

export const unfollowCollection = async (req, res) => {
    try {
        await pool.execute(
            "DELETE FROM collection_follows WHERE user_id = ? AND collection_id = ?",
            [req.user.id, req.params.id]
        );
        return res.json({ followed: false });
    } catch (error) {
        console.error("Failed to unfollow collection:", error);
        return res.status(500).json({ message: "Unable to unfollow collection." });
    }
};

export const createCollection = async (req, res) => {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    if (!name || name.length > 255) {
        return res.status(400).json({ message: "Collection name must be between 1 and 255 characters." });
    }

    try {
        const shareUuid = randomUUID();
        const [result] = await pool.execute(
            "INSERT INTO collections (user_id, name, is_public, share_uuid) VALUES (?, ?, ?, ?)",
            [req.user.id, name, asBoolean(req.body.is_public), shareUuid]
        );
        return res.status(201).json({
            collection: {
                id: result.insertId,
                name,
                owner: req.user.username,
                is_public: asBoolean(req.body.is_public),
                share_uuid: shareUuid,
                item_count: 0,
            },
        });
    } catch (error) {
        console.error("Failed to create collection:", error);
        return res.status(500).json({ message: "Unable to create collection." });
    }
};

export const updateCollection = async (req, res) => {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    if (!name || name.length > 255 || typeof req.body.is_public === "undefined") {
        return res.status(400).json({ message: "A valid name and visibility setting are required." });
    }

    try {
        const [result] = await pool.execute(
            "UPDATE collections SET name = ?, is_public = ? WHERE id = ? AND user_id = ?",
            [name, asBoolean(req.body.is_public), req.params.id, req.user.id]
        );
        if (!result.affectedRows) {
            return res.status(404).json({ message: "Collection not found." });
        }

        const [rows] = await pool.execute(
            `SELECT c.id, c.name, c.is_public, c.share_uuid,
                    (SELECT COUNT(*) FROM collection_items ci WHERE ci.collection_id = c.id) AS item_count
             FROM collections c WHERE c.id = ? AND c.user_id = ?`,
            [req.params.id, req.user.id]
        );
        return res.json({ collection: rows[0] });
    } catch (error) {
        console.error("Failed to update collection:", error);
        return res.status(500).json({ message: "Unable to update collection." });
    }
};

export const deleteCollection = async (req, res) => {
    try {
        const [result] = await pool.execute(
            "DELETE FROM collections WHERE id = ? AND user_id = ?",
            [req.params.id, req.user.id]
        );
        if (!result.affectedRows) {
            return res.status(404).json({ message: "Collection not found." });
        }
        return res.json({ message: "Collection deleted." });
    } catch (error) {
        console.error("Failed to delete collection:", error);
        return res.status(500).json({ message: "Unable to delete collection." });
    }
};

export const getCollectionDetails = async (req, res) => {
    try {
        const collection = await getCollection(req.params.id, req.user.id);
        if (!collection) {
            return res.status(404).json({ message: "Collection not found." });
        }
        collection.items = await getItems(collection.id);
        return res.json({ collection });
    } catch (error) {
        console.error("Failed to load collection:", error);
        return res.status(500).json({ message: "Unable to load collection." });
    }
};

export const getSharedCollection = async (req, res) => {
    try {
        const [rows] = await pool.execute(
            `SELECT c.id, c.name, c.is_public, c.share_uuid, u.username AS owner
             FROM collections c
             JOIN users u ON u.id = c.user_id
             WHERE c.share_uuid = ? AND c.is_public = TRUE`,
            [req.params.uuid]
        );
        const collection = rows[0];
        if (!collection) {
            return res.status(404).json({ message: "Shared collection not found." });
        }
        collection.items = await getItems(collection.id);
        return res.json({ collection });
    } catch (error) {
        console.error("Failed to load shared collection:", error);
        return res.status(500).json({ message: "Unable to load shared collection." });
    }
};

export const addCollectionItem = async (req, res) => {
    const showId = Number(req.body.show_id);
    if (!Number.isInteger(showId) || showId <= 0) {
        return res.status(400).json({ message: "A valid show_id is required." });
    }

    try {
        const collection = await getCollection(req.params.id, req.user.id);
        if (!collection) {
            return res.status(404).json({ message: "Collection not found." });
        }

        const [shows] = await pool.execute(
            "SELECT id, name, type, photo_url FROM shows WHERE id = ?",
            [showId]
        );
        if (!shows.length) {
            return res.status(404).json({ message: "Show not found." });
        }

        const [result] = await pool.execute(
            "INSERT IGNORE INTO collection_items (collection_id, show_id) VALUES (?, ?)",
            [req.params.id, showId]
        );
        if (!result.affectedRows) {
            return res.status(409).json({ message: "This show is already in the collection." });
        }
        return res.status(201).json({ item: shows[0] });
    } catch (error) {
        console.error("Failed to add show to collection:", error);
        return res.status(500).json({ message: "Unable to add show to collection." });
    }
};

export const removeCollectionItem = async (req, res) => {
    try {
        const collection = await getCollection(req.params.id, req.user.id);
        if (!collection) {
            return res.status(404).json({ message: "Collection not found." });
        }
        const [result] = await pool.execute(
            "DELETE FROM collection_items WHERE collection_id = ? AND show_id = ?",
            [req.params.id, req.params.showId]
        );
        if (!result.affectedRows) {
            return res.status(404).json({ message: "Show not found in this collection." });
        }
        return res.json({ message: "Show removed from collection." });
    } catch (error) {
        console.error("Failed to remove collection item:", error);
        return res.status(500).json({ message: "Unable to remove show from collection." });
    }
};
