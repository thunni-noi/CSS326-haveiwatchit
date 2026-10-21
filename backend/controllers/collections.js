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

export const listCollections = async (req, res) => {
    try {
        const [collections] = await pool.execute(
            `SELECT c.id, c.name, c.is_public, c.share_uuid,
                    COUNT(ci.show_id) AS item_count
             FROM collections c
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
