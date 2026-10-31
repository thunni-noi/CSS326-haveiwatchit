import bcrypt from "bcryptjs";
import fs from "fs";
import multer from "multer";
import path from "path";
import { randomUUID } from "crypto";
import pool from "../db/db.js";

const field = (name, type, options = {}) => ({ name, type, ...options });
const avatarUploadDirectory = path.join(path.resolve(), "uploads", "avatars");
const avatarExtensions = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
};

fs.mkdirSync(avatarUploadDirectory, { recursive: true });

const avatarUpload = multer({
    storage: multer.diskStorage({
        destination: avatarUploadDirectory,
        filename: (req, file, callback) => callback(null, `${randomUUID()}${avatarExtensions[file.mimetype]}`),
    }),
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (req, file, callback) => {
        if (!avatarExtensions[file.mimetype]) {
            callback(new Error("Choose a JPG, PNG or WebP image."));
            return;
        }
        callback(null, true);
    },
});

export const receiveUserAvatar = (req, res, next) => {
    avatarUpload.single("avatar")(req, res, (error) => {
        if (!error) {
            next();
            return;
        }

        const message = error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE"
            ? "Profile picture must be smaller than 2 MB."
            : error.message;
        res.status(400).json({ message });
    });
};

const entities = {
    users: {
        table: "users",
        keys: ["id"],
        fields: [
            field("id", "integer", { key: true }),
            field("username", "text", { required: true }),
            field("email", "text", { required: true }),
            field("avatar_url", "url", { nullable: true }),
            field("password", "password", { writeOnly: true }),
            field("role", "enum", { required: true, options: ["user", "moderator", "admin"] }),
            field("is_verified", "boolean"),
            field("is_suspended", "boolean"),
            field("reputation", "integer"),
            field("created_at", "datetime", { readOnly: true }),
        ],
    },
    shows: {
        table: "shows",
        keys: ["id"],
        fields: [
            field("id", "integer", { key: true }),
            field("name", "text", { required: true }),
            field("type", "enum", { required: true, options: ["movie", "series", "tv_shows", "anime"] }),
            field("synopsis", "longtext", { nullable: true }),
            field("photo_url", "url", { nullable: true }),
            field("cover_url", "url", { nullable: true }),
            field("status", "enum", { required: true, options: ["airing", "completed", "upcoming"] }),
            field("release_date", "date", { nullable: true }),
            field("episode_count", "integer", { nullable: true }),
            field("duration", "integer", { nullable: true }),
            field("content_rating", "text", { nullable: true }),
            field("created_at", "datetime", { readOnly: true }),
        ],
    },
    show_platform: {
        table: "show_platform",
        keys: ["id"],
        fields: [
            field("id", "integer", { key: true }),
            field("name", "text", { required: true }),
            field("logo_url", "url", { nullable: true }),
            field("url", "url", { nullable: true }),
        ],
    },
    people: {
        table: "people",
        keys: ["id"],
        fields: [
            field("id", "integer", { key: true }),
            field("name", "text", { required: true }),
            field("bio", "longtext", { nullable: true }),
            field("photo_url", "url", { nullable: true }),
        ],
    },
    show_sources: {
        table: "show_sources",
        keys: ["show_id", "platform_id"],
        fields: [
            field("show_id", "integer", { key: true, createKey: true, required: true }),
            field("platform_id", "integer", { key: true, createKey: true, required: true }),
        ],
    },
    show_roles: {
        table: "show_roles",
        keys: ["id"],
        fields: [
            field("id", "integer", { key: true }),
            field("role", "text", { required: true }),
            field("character_name", "text", { nullable: true }),
            field("character_photo", "text", { nullable: true }),
            field("show_id", "integer", { required: true }),
            field("people_id", "integer", { required: true }),
        ],
    },
    show_submission: {
        table: "show_submission",
        keys: ["id"],
        fields: [
            field("id", "integer", { key: true }),
            field("submitted_by", "integer", { required: true }),
            field("name", "text", { required: true }),
            field("type", "enum", { required: true, options: ["movie", "series", "tv_shows", "anime"] }),
            field("synopsis", "longtext", { nullable: true }),
            field("photo_url", "text", { nullable: true }),
            field("content_rating", "text", { nullable: true }),
            field("other_details", "longtext", { nullable: true }),
            field("status", "enum", { required: true, options: ["pending", "approved", "rejected"] }),
            field("created_at", "datetime", { readOnly: true }),
        ],
    },
};

const watchlistStatuses = ["wishlist", "watching", "watched", "rewatching", "on_hold", "dropped"];

const getEntity = (name) => entities[name];

const fieldMap = (entity) => new Map(entity.fields.map((item) => [item.name, item]));

const validateFields = (entity, values, { creating }) => {
    if (!values || typeof values !== "object" || Array.isArray(values)) {
        return { error: "Provide record fields as an object." };
    }

    const definitions = fieldMap(entity);
    const result = {};

    for (const [name, value] of Object.entries(values)) {
        const definition = definitions.get(name);
        if (
            !definition
            || (definition.key && !(creating && definition.createKey))
            || definition.readOnly
            || (definition.generated && !creating)
        ) {
            return { error: `Field "${name}" cannot be changed.` };
        }

        if (definition.type === "password") {
            if (typeof value !== "string" || value.length < 8) {
                return { error: "Passwords must be at least 8 characters long." };
            }
            result[name] = value;
            continue;
        }

        if (value === null || value === "") {
            if (!definition.nullable) {
                return { error: `Field "${name}" is required.` };
            }
            result[name] = null;
            continue;
        }

        if (definition.type === "integer") {
            const number = Number(value);
            if (!Number.isSafeInteger(number)) {
                return { error: `Field "${name}" must be an integer.` };
            }
            result[name] = number;
        } else if (definition.type === "boolean") {
            if (![true, false, 0, 1, "0", "1"].includes(value)) {
                return { error: `Field "${name}" must be true or false.` };
            }
            result[name] = value === true || value === 1 || value === "1";
        } else if (definition.type === "enum") {
            if (!definition.options.includes(value)) {
                return { error: `Invalid value for "${name}".` };
            }
            result[name] = value;
        } else if (definition.type === "date") {
            if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
                return { error: `Field "${name}" must be a date in YYYY-MM-DD format.` };
            }
            result[name] = value;
        } else if (definition.type === "url" && typeof value === "string") {
            if (
                entity.table === "users"
                && name === "avatar_url"
                && /^\/uploads\/avatars\/[0-9a-f-]{36}\.(jpg|png|webp)$/i.test(value)
            ) {
                result[name] = value;
                continue;
            }
            try {
                const parsed = new URL(value);
                if (!["http:", "https:"].includes(parsed.protocol)) {
                    return { error: `Field "${name}" must be an HTTP or HTTPS URL.` };
                }
                result[name] = value;
            } catch {
                return { error: `Field "${name}" must be a valid URL.` };
            }
        } else if (typeof value === "string") {
            result[name] = value;
        } else {
            return { error: `Field "${name}" must be text.` };
        }
    }

    if (creating) {
        for (const definition of entity.fields) {
            if (definition.required && !definition.generated && !(definition.name in result)) {
                return { error: `Field "${definition.name}" is required.` };
            }
        }
        if (entity.table === "users" && !("password" in result)) {
            return { error: "A password is required when creating a user." };
        }
    }

    return { values: result };
};

const validateKey = (entity, key) => {
    if (!key || typeof key !== "object" || Array.isArray(key)) {
        return { error: "Provide the record key." };
    }

    const keys = Object.keys(key);
    if (keys.length !== entity.keys.length || !entity.keys.every((name) => keys.includes(name))) {
        return { error: "The record key is incomplete or invalid." };
    }

    for (const name of entity.keys) {
        const value = key[name];
        if (value === undefined || value === null || value === "" || !/^\d+$/.test(String(value))) {
            return { error: `Invalid key "${name}".` };
        }
    }

    return { key };
};

const whereForKey = (entity, key) => ({
    clause: entity.keys.map((name) => `\`${name}\` = ?`).join(" AND "),
    values: entity.keys.map((name) => key[name]),
});

const publicColumns = (entity) => entity.fields.filter((item) => !item.writeOnly);

const deleteLocalAvatar = (avatarUrl) => {
    if (!avatarUrl || typeof avatarUrl !== "string") return;

    const normalized = avatarUrl.startsWith("/") ? avatarUrl : `/${avatarUrl}`;
    const fullPath = path.join(path.resolve(), normalized.replace(/^\/+/, ""));
    const uploadsRoot = path.join(path.resolve(), "uploads");

    if (fullPath.startsWith(uploadsRoot) && fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
    }
};

const lockAdminUsers = async (connection) => {
    const [admins] = await connection.execute(
        "SELECT id FROM users WHERE role = 'admin' FOR UPDATE",
    );
    return admins.map((admin) => Number(admin.id));
};

export const listRecords = async (req, res) => {
    const entity = getEntity(req.params.entity);
    if (!entity) {
        return res.status(404).json({ message: "Unknown admin data type." });
    }

    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 50, 1), 100);
    const offset = Math.max(Number.parseInt(req.query.offset, 10) || 0, 0);
    const query = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 100) : "";
    const columns = publicColumns(entity).map((item) => `\`${item.name}\``).join(", ");
    const searchable = publicColumns(entity).filter((item) => !["datetime", "boolean"].includes(item.type));
    const searchClause = query && searchable.length
        ? ` WHERE (${searchable.map((item) => `CAST(\`${item.name}\` AS CHAR) LIKE ?`).join(" OR ")})`
        : "";
    const searchValues = query && searchable.length ? searchable.map(() => `%${query}%`) : [];

    try {
        const [rows] = await pool.execute(
            `SELECT ${columns} FROM \`${entity.table}\`${searchClause} ORDER BY ${entity.keys.map((name) => `\`${name}\``).join(", ")} LIMIT ? OFFSET ?`,
            [...searchValues, limit, offset],
        );
        const [countRows] = await pool.execute(
            `SELECT COUNT(*) AS total FROM \`${entity.table}\`${searchClause}`,
            searchValues,
        );
        return res.json({
            rows,
            total: Number(countRows[0].total),
            fields: entity.fields,
            keys: entity.keys,
            limit,
            offset,
        });
    } catch (error) {
        console.error("Admin list failed:", error);
        return res.status(500).json({ message: "Unable to load admin records." });
    }
};

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

const parsePositiveId = (value) => {
    if (!/^\d+$/.test(String(value))) return null;
    const id = Number(value);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
};

export const updateUserAvatar = async (req, res) => {
    const userId = parsePositiveId(req.params.id);
    if (!userId) {
        if (req.file) fs.rmSync(req.file.path, { force: true });
        return res.status(400).json({ message: "Invalid user ID." });
    }
    if (!req.file) {
        return res.status(400).json({ message: "Choose a profile picture to upload." });
    }

    try {
        const [[targetUser]] = await pool.execute(
            "SELECT avatar_url FROM users WHERE id = ?",
            [userId],
        );
        if (!targetUser) {
            fs.rmSync(req.file.path, { force: true });
            return res.status(404).json({ message: "User not found." });
        }

        const avatarUrl = `/uploads/avatars/${req.file.filename}`;
        await pool.execute(
            "UPDATE users SET avatar_url = ? WHERE id = ?",
            [avatarUrl, userId],
        );

        try {
            deleteLocalAvatar(targetUser.avatar_url);
        } catch (error) {
            console.error("Admin old avatar cleanup failed:", error);
        }
        return res.json({ avatar_url: avatarUrl });
    } catch (error) {
        fs.rmSync(req.file.path, { force: true });
        console.error("Admin avatar update failed:", error);
        return res.status(500).json({ message: "Unable to update the user's profile picture." });
    }
};

export const getUserWatchlist = async (req, res) => {
    const userId = parsePositiveId(req.params.id);
    if (!userId) {
        return res.status(400).json({ message: "Invalid user ID." });
    }

    try {
        const [[targetUser]] = await pool.execute(
            "SELECT id, username FROM users WHERE id = ?",
            [userId],
        );
        if (!targetUser) {
            return res.status(404).json({ message: "User not found." });
        }

        const [items] = await pool.execute(
            `SELECT item.show_id, item.status, item.updated_at,
                    s.name, s.type, s.photo_url
            FROM watchlist_items item
            JOIN shows s ON s.id = item.show_id
            WHERE item.user_id = ?
            ORDER BY item.updated_at DESC, s.name`,
            [userId],
        );
        const [availableShows] = await pool.execute(
            `SELECT id, name, type, photo_url
            FROM shows
            WHERE id NOT IN (SELECT show_id FROM watchlist_items WHERE user_id = ?)
            ORDER BY name
            LIMIT 1000`,
            [userId],
        );

        return res.json({
            user: targetUser,
            items,
            availableShows,
            statuses: watchlistStatuses,
        });
    } catch (error) {
        console.error("Admin user watchlist load failed:", error);
        return res.status(500).json({ message: "Unable to load this user's watchlist." });
    }
};

export const addUserWatchlistItem = async (req, res) => {
    const userId = parsePositiveId(req.params.id);
    const showId = parsePositiveId(req.body?.show_id);
    const status = req.body?.status ?? "wishlist";
    if (!userId || !showId) {
        return res.status(400).json({ message: "Valid user and show IDs are required." });
    }
    if (!watchlistStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid watchlist status." });
    }

    try {
        const [result] = await pool.execute(
            "INSERT INTO watchlist_items (user_id, show_id, status) VALUES (?, ?, ?)",
            [userId, showId, status],
        );
        if (!result.affectedRows) {
            return res.status(500).json({ message: "Watchlist item was not added." });
        }
        return res.status(201).json({ message: "Show added to the user's watchlist." });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ message: "This show is already on the user's watchlist." });
        }
        if (error.code === "ER_NO_REFERENCED_ROW_2") {
            return res.status(404).json({ message: "User or show not found." });
        }
        console.error("Admin user watchlist add failed:", error);
        return res.status(500).json({ message: "Unable to add this show to the watchlist." });
    }
};

export const updateUserWatchlistItem = async (req, res) => {
    const userId = parsePositiveId(req.params.id);
    const showId = parsePositiveId(req.params.showId);
    const status = req.body?.status;
    if (!userId || !showId) {
        return res.status(400).json({ message: "Valid user and show IDs are required." });
    }
    if (!watchlistStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid watchlist status." });
    }

    try {
        const [result] = await pool.execute(
            "UPDATE watchlist_items SET status = ? WHERE user_id = ? AND show_id = ?",
            [status, userId, showId],
        );
        if (!result.affectedRows) {
            return res.status(404).json({ message: "Watchlist item not found." });
        }
        return res.json({ message: "Watchlist status updated." });
    } catch (error) {
        console.error("Admin user watchlist update failed:", error);
        return res.status(500).json({ message: "Unable to update this watchlist item." });
    }
};

export const deleteUserWatchlistItem = async (req, res) => {
    const userId = parsePositiveId(req.params.id);
    const showId = parsePositiveId(req.params.showId);
    if (!userId || !showId) {
        return res.status(400).json({ message: "Valid user and show IDs are required." });
    }

    try {
        const [result] = await pool.execute(
            "DELETE FROM watchlist_items WHERE user_id = ? AND show_id = ?",
            [userId, showId],
        );
        if (!result.affectedRows) {
            return res.status(404).json({ message: "Watchlist item not found." });
        }
        return res.json({ message: "Show removed from the user's watchlist." });
    } catch (error) {
        console.error("Admin user watchlist delete failed:", error);
        return res.status(500).json({ message: "Unable to remove this watchlist item." });
    }
};

export const getUserCollections = async (req, res) => {
    const userId = parsePositiveId(req.params.id);
    if (!userId) {
        return res.status(400).json({ message: "Invalid user ID." });
    }

    try {
        const [[targetUser]] = await pool.execute(
            "SELECT id, username FROM users WHERE id = ?",
            [userId],
        );
        if (!targetUser) {
            return res.status(404).json({ message: "User not found." });
        }

        const [collections] = await pool.execute(
            `SELECT c.id, c.name, c.is_public, COUNT(ci.show_id) AS item_count
            FROM collections c
            LEFT JOIN collection_items ci ON ci.collection_id = c.id
            WHERE c.user_id = ?
            GROUP BY c.id
            ORDER BY c.id DESC`,
            [userId],
        );
        return res.json({ user: targetUser, collections });
    } catch (error) {
        console.error("Admin user collections load failed:", error);
        return res.status(500).json({ message: "Unable to load this user's collections." });
    }
};

export const getUserCollection = async (req, res) => {
    const userId = parsePositiveId(req.params.id);
    const collectionId = parsePositiveId(req.params.collectionId);
    if (!userId || !collectionId) {
        return res.status(400).json({ message: "Valid user and collection IDs are required." });
    }

    try {
        const [[collection]] = await pool.execute(
            `SELECT id, name, is_public FROM collections
            WHERE id = ? AND user_id = ?`,
            [collectionId, userId],
        );
        if (!collection) {
            return res.status(404).json({ message: "Collection not found." });
        }

        const [items] = await pool.execute(
            `SELECT s.id, s.name, s.type, s.photo_url
            FROM collection_items ci
            JOIN shows s ON s.id = ci.show_id
            WHERE ci.collection_id = ?
            ORDER BY s.name`,
            [collectionId],
        );
        const [availableShows] = await pool.execute(
            `SELECT s.id, s.name, s.type, s.photo_url
            FROM shows s
            WHERE NOT EXISTS (
                SELECT 1 FROM collection_items ci
                WHERE ci.collection_id = ? AND ci.show_id = s.id
            )
            ORDER BY s.name
            LIMIT 1000`,
            [collectionId],
        );
        return res.json({ collection, items, availableShows });
    } catch (error) {
        console.error("Admin user collection load failed:", error);
        return res.status(500).json({ message: "Unable to load this collection." });
    }
};

export const updateUserCollection = async (req, res) => {
    const userId = parsePositiveId(req.params.id);
    const collectionId = parsePositiveId(req.params.collectionId);
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const visibility = req.body?.is_public;
    if (!userId || !collectionId) {
        return res.status(400).json({ message: "Valid user and collection IDs are required." });
    }
    if (!name || name.length > 255 || (visibility !== true && visibility !== false)) {
        return res.status(400).json({ message: "A valid name and visibility setting are required." });
    }

    try {
        const [result] = await pool.execute(
            "UPDATE collections SET name = ?, is_public = ? WHERE id = ? AND user_id = ?",
            [name, visibility, collectionId, userId],
        );
        if (!result.affectedRows) {
            const [[collection]] = await pool.execute(
                "SELECT id FROM collections WHERE id = ? AND user_id = ?",
                [collectionId, userId],
            );
            if (!collection) {
                return res.status(404).json({ message: "Collection not found." });
            }
        }
        return res.json({ message: "Collection updated.", collection: { id: collectionId, name, is_public: visibility } });
    } catch (error) {
        console.error("Admin user collection update failed:", error);
        return res.status(500).json({ message: "Unable to update this collection." });
    }
};

export const addUserCollectionItem = async (req, res) => {
    const userId = parsePositiveId(req.params.id);
    const collectionId = parsePositiveId(req.params.collectionId);
    const showId = parsePositiveId(req.body?.show_id);
    if (!userId || !collectionId || !showId) {
        return res.status(400).json({ message: "Valid user, collection, and show IDs are required." });
    }

    try {
        const [[collection]] = await pool.execute(
            "SELECT id FROM collections WHERE id = ? AND user_id = ?",
            [collectionId, userId],
        );
        if (!collection) {
            return res.status(404).json({ message: "Collection not found." });
        }
        const [result] = await pool.execute(
            "INSERT IGNORE INTO collection_items (collection_id, show_id) VALUES (?, ?)",
            [collectionId, showId],
        );
        if (!result.affectedRows) {
            const [[show]] = await pool.execute("SELECT id FROM shows WHERE id = ?", [showId]);
            if (!show) {
                return res.status(404).json({ message: "Show not found." });
            }
            return res.status(409).json({ message: "This show is already in the collection." });
        }
        return res.status(201).json({ message: "Show added to the collection." });
    } catch (error) {
        if (error.code === "ER_NO_REFERENCED_ROW_2") {
            return res.status(404).json({ message: "User, collection, or show not found." });
        }
        console.error("Admin user collection item add failed:", error);
        return res.status(500).json({ message: "Unable to add this show to the collection." });
    }
};

export const deleteUserCollectionItem = async (req, res) => {
    const userId = parsePositiveId(req.params.id);
    const collectionId = parsePositiveId(req.params.collectionId);
    const showId = parsePositiveId(req.params.showId);
    if (!userId || !collectionId || !showId) {
        return res.status(400).json({ message: "Valid user, collection, and show IDs are required." });
    }

    try {
        const [result] = await pool.execute(
            `DELETE ci FROM collection_items ci
            JOIN collections c ON c.id = ci.collection_id
            WHERE c.id = ? AND c.user_id = ? AND ci.show_id = ?`,
            [collectionId, userId, showId],
        );
        if (!result.affectedRows) {
            return res.status(404).json({ message: "Show not found in this collection." });
        }
        return res.json({ message: "Show removed from the collection." });
    } catch (error) {
        console.error("Admin user collection item delete failed:", error);
        return res.status(500).json({ message: "Unable to remove this show from the collection." });
    }
};

export const getUserFollowedCollections = async (req, res) => {
    const userId = parsePositiveId(req.params.id);
    if (!userId) {
        return res.status(400).json({ message: "Invalid user ID." });
    }

    try {
        const [[targetUser]] = await pool.execute(
            "SELECT id, username FROM users WHERE id = ?",
            [userId],
        );
        if (!targetUser) {
            return res.status(404).json({ message: "User not found." });
        }

        const [collections] = await pool.execute(
            `SELECT c.id, c.name, c.is_public, u.username AS owner, COUNT(ci.show_id) AS item_count,
                    cf.created_at AS followed_at
            FROM collection_follows cf
            JOIN collections c ON c.id = cf.collection_id
            JOIN users u ON u.id = c.user_id
            LEFT JOIN collection_items ci ON ci.collection_id = c.id
            WHERE cf.user_id = ?
            GROUP BY c.id, cf.created_at, u.username
            ORDER BY cf.created_at DESC`,
            [userId],
        );
        const [availableCollections] = await pool.execute(
            `SELECT c.id, c.name, u.username AS owner
            FROM collections c
            JOIN users u ON u.id = c.user_id
            WHERE c.is_public = TRUE
                AND c.user_id <> ?
                AND NOT EXISTS (
                    SELECT 1 FROM collection_follows cf
                    WHERE cf.user_id = ? AND cf.collection_id = c.id
                )
            ORDER BY u.username, c.name
            LIMIT 1000`,
            [userId, userId],
        );
        return res.json({ user: targetUser, collections, availableCollections });
    } catch (error) {
        console.error("Admin followed collections load failed:", error);
        return res.status(500).json({ message: "Unable to load this user's followed collections." });
    }
};

export const followUserCollection = async (req, res) => {
    const userId = parsePositiveId(req.params.id);
    const collectionId = parsePositiveId(req.params.collectionId);
    if (!userId || !collectionId) {
        return res.status(400).json({ message: "Valid user and collection IDs are required." });
    }

    try {
        const [[targetUser]] = await pool.execute("SELECT id FROM users WHERE id = ?", [userId]);
        if (!targetUser) {
            return res.status(404).json({ message: "User not found." });
        }
        const [[collection]] = await pool.execute(
            "SELECT id FROM collections WHERE id = ? AND user_id <> ? AND is_public = TRUE",
            [collectionId, userId],
        );
        if (!collection) {
            return res.status(404).json({ message: "Public collection not found." });
        }
        await pool.execute(
            "INSERT IGNORE INTO collection_follows (user_id, collection_id) VALUES (?, ?)",
            [userId, collectionId],
        );
        return res.json({ followed: true });
    } catch (error) {
        console.error("Admin follow collection failed:", error);
        return res.status(500).json({ message: "Unable to follow this collection." });
    }
};

export const unfollowUserCollection = async (req, res) => {
    const userId = parsePositiveId(req.params.id);
    const collectionId = parsePositiveId(req.params.collectionId);
    if (!userId || !collectionId) {
        return res.status(400).json({ message: "Valid user and collection IDs are required." });
    }

    try {
        const [result] = await pool.execute(
            "DELETE FROM collection_follows WHERE user_id = ? AND collection_id = ?",
            [userId, collectionId],
        );
        if (!result.affectedRows) {
            return res.status(404).json({ message: "Followed collection not found." });
        }
        return res.json({ followed: false });
    } catch (error) {
        console.error("Admin unfollow collection failed:", error);
        return res.status(500).json({ message: "Unable to unfollow this collection." });
    }
};

export const createRecord = async (req, res) => {
    const entity = getEntity(req.params.entity);
    if (!entity) {
        return res.status(404).json({ message: "Unknown admin data type." });
    }

    const submittedValues = { ...req.body?.values };
    if (entity.table === "collections" && !submittedValues.share_uuid) {
        submittedValues.share_uuid = randomUUID();
    }
    const validated = validateFields(entity, submittedValues, { creating: true });
    if (validated.error) {
        return res.status(400).json({ message: validated.error });
    }

    try {
        const values = validated.values;
        if (entity.table === "users") {
            values.password = await bcrypt.hash(values.password, 12);
        }

        const columns = Object.keys(values);
        const placeholders = columns.map(() => "?").join(", ");
        const [result] = await pool.execute(
            `INSERT INTO \`${entity.table}\` (${columns.map((name) => `\`${name}\``).join(", ")}) VALUES (${placeholders})`,
            columns.map((name) => values[name]),
        );
        const key = Object.fromEntries(entity.keys.map((name) => [
            name,
            name === "id" ? result.insertId : values[name],
        ]));
        const where = whereForKey(entity, key);
        const selectColumns = publicColumns(entity).map((item) => `\`${item.name}\``).join(", ");
        const [rows] = await pool.execute(
            `SELECT ${selectColumns} FROM \`${entity.table}\` WHERE ${where.clause}`,
            where.values,
        );
        return res.status(201).json({ row: rows[0] });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ message: "A record with those unique values already exists." });
        }
        if (error.code === "ER_NO_REFERENCED_ROW_2") {
            return res.status(400).json({ message: "A referenced record does not exist." });
        }
        console.error("Admin create failed:", error);
        return res.status(500).json({ message: "Unable to create the record." });
    }
};

export const updateRecord = async (req, res) => {
    const entity = getEntity(req.params.entity);
    if (!entity) {
        return res.status(404).json({ message: "Unknown admin data type." });
    }

    const keyResult = validateKey(entity, req.body?.key);
    if (keyResult.error) {
        return res.status(400).json({ message: keyResult.error });
    }
    const validated = validateFields(entity, req.body?.values, { creating: false });
    if (validated.error) {
        return res.status(400).json({ message: validated.error });
    }

    const values = validated.values;
    if (!Object.keys(values).length) {
        return res.status(400).json({ message: "Provide at least one field to update." });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        if (entity.table === "users") {
            const [currentRows] = await connection.execute(
                "SELECT avatar_url, role FROM users WHERE id = ? FOR UPDATE",
                [keyResult.key.id],
            );
            const currentUser = currentRows[0];
            if (!currentUser) {
                await connection.rollback();
                return res.status(404).json({ message: "Record not found." });
            }

            if (values.role !== undefined) {
                const userId = Number(keyResult.key.id);
                const adminIds = await lockAdminUsers(connection);
                if (userId === Number(req.user.id) && values.role !== "admin") {
                    await connection.rollback();
                    return res.status(400).json({ message: "You cannot demote your own admin account." });
                }
                if (currentUser.role === "admin" && values.role !== "admin" && adminIds.length <= 1) {
                    await connection.rollback();
                    return res.status(400).json({ message: "The last admin account cannot be demoted." });
                }
            }

            if (values.avatar_url !== undefined && values.avatar_url !== currentUser.avatar_url) {
                deleteLocalAvatar(currentUser.avatar_url);
            }
        }

        if (entity.table === "users" && values.password) {
            values.password = await bcrypt.hash(values.password, 12);
        }

        const where = whereForKey(entity, keyResult.key);
        await connection.execute(
            `UPDATE \`${entity.table}\` SET ${Object.keys(values).map((name) => `\`${name}\` = ?`).join(", ")} WHERE ${where.clause}`,
            [...Object.values(values), ...where.values],
        );
        const columns = publicColumns(entity).map((item) => `\`${item.name}\``).join(", ");
        const [rows] = await connection.execute(
            `SELECT ${columns} FROM \`${entity.table}\` WHERE ${where.clause}`,
            where.values,
        );
        await connection.commit();
        if (!rows.length) {
            return res.status(404).json({ message: "Record not found." });
        }
        return res.json({ row: rows[0] });
    } catch (error) {
        await connection.rollback();
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ message: "A record with those unique values already exists." });
        }
        if (error.code === "ER_NO_REFERENCED_ROW_2") {
            return res.status(400).json({ message: "A referenced record does not exist." });
        }
        console.error("Admin update failed:", error);
        return res.status(500).json({ message: "Unable to update the record." });
    } finally {
        connection.release();
    }
};

export const deleteRecord = async (req, res) => {
    const entity = getEntity(req.params.entity);
    if (!entity) {
        return res.status(404).json({ message: "Unknown admin data type." });
    }

    const keyResult = validateKey(entity, req.body?.key);
    if (keyResult.error) {
        return res.status(400).json({ message: keyResult.error });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        if (entity.table === "users") {
            const adminIds = await lockAdminUsers(connection);
            if (Number(keyResult.key.id) === Number(req.user.id)) {
                await connection.rollback();
                return res.status(400).json({ message: "You cannot delete your own admin account." });
            }
            const [[target]] = await connection.execute(
                "SELECT role, avatar_url FROM users WHERE id = ? FOR UPDATE",
                [keyResult.key.id],
            );
            if (!target) {
                await connection.rollback();
                return res.status(404).json({ message: "Record not found." });
            }
            if (target.role === "admin" && adminIds.length <= 1) {
                await connection.rollback();
                return res.status(400).json({ message: "The last admin account cannot be deleted." });
            }
            deleteLocalAvatar(target.avatar_url);
        }

        const where = whereForKey(entity, keyResult.key);
        const [result] = await connection.execute(
            `DELETE FROM \`${entity.table}\` WHERE ${where.clause}`,
            where.values,
        );
        await connection.commit();
        if (!result.affectedRows) {
            return res.status(404).json({ message: "Record not found." });
        }
        return res.json({ message: "Record deleted." });
    } catch (error) {
        await connection.rollback();
        if (error.code === "ER_ROW_IS_REFERENCED_2") {
            return res.status(409).json({ message: "This record is in use and cannot be deleted." });
        }
        console.error("Admin delete failed:", error);
        return res.status(500).json({ message: "Unable to delete the record." });
    } finally {
        connection.release();
    }
};

const wrapper = (errMsg, controller) => async (req, res) =>
    {try {
        await controller(req, res);
    } catch (error) {
        console.error(`${errMsg}`, error);
        res.status(500).json({message: errMsg});
    }};

export const suspendUser = wrapper("Unable to suspend user", async(req, res) => {
    const userId = req.user.id;
    const targetId = Number(req.params.targetId);

    if (Number.isNaN(targetId) || targetId < 0) return res.status(400).json({message: "Invalid ID"});
    const [r] = await pool.execute(`
        UPDATE users SET is_suspended = 1 WHERE id = ?`, [targetId])
    
    if (r.affectedRows === 0){
        return r.status(404).json({message: "Target ID not found!"})
    }
    return res.json({message: "Suspend user successfully"})
})

export const unsuspendUser = wrapper("Unable to unsuspend user", async(req, res) => {
    const userId = req.user.id;
    const targetId = Number(req.params.targetId);

    if (Number.isNaN(targetId) || targetId < 0) return res.status(400).json({message: "Invalid ID"});
    const [r] = await pool.execute(`
        UPDATE users SET is_suspended = 0 WHERE id = ?`, [targetId])
    
    if (r.affectedRows === 0){
        return r.status(404).json({message: "Target ID not found!"})
    }
    return res.json({message: "User are now unsuspended"});
})