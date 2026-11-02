import fs from "fs"; //file system(read, write, create, and delete files/folders)
import multer from "multer"; //upload files(handling file uploads from forms = type, size,...)
import path from "path"; //file paths(build correct folder paths across OSes.)
import { randomUUID } from "crypto"; //generate unique IDs(create unique name file)
import pool from "../db/db.js";//(connect to db)
import { deleteLocalAvatar, lockAdminUsers } from "./adminRecords.js";

const watchlistStatuses = ["wishlist", "watching", "watched", "rewatching", "on_hold", "dropped"];

// Store avatars under a shared directory and map accepted MIME types to extensions.
const avatarUploadDirectory = path.join(path.resolve(), "uploads", "avatars");
const avatarExtensions = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
};

// Ensure the destination exists before Multer receives an uploaded file.
fs.mkdirSync(avatarUploadDirectory, { recursive: true });

// Configure avatar file naming, size limits, and allowed image formats.
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

// Run avatar uploads through Multer and convert upload failures into HTTP 400 responses.
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

// Convert a positive integer-like value to a number, or reject it with null.
const parsePositiveId = (value) => {
    if (!/^\d+$/.test(String(value))) return null;
    const id = Number(value);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
};

// Save a user's new avatar, cleaning up uploaded or replaced files as needed.
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

// Load a user's watchlist and the shows available to add.
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

// Add a show to a user's watchlist after validating its ID and status.
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

// Change the status of an existing item in a user's watchlist.
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

// Remove a show from a user's watchlist.
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

// List a user's collections with an item count for each collection.
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

// Load one collection, its items, and shows that are available to add.
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

// Update a collection's name and public/private visibility.
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

// Add a show to a user's collection and distinguish duplicates from missing records.
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

// Remove a show from a collection owned by the specified user.
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

// List collections the user follows and public collections they can follow.
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

// Follow another user's public collection.
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

// Remove a user's follow of a collection.
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

const wrapper = (errMsg, controller) => async (req, res) =>
    {try {
        await controller(req, res);
    } catch (error) {
        console.error(`${errMsg}`, error);
        res.status(500).json({message: errMsg});
    }};

const setUserSuspension = (suspended) => wrapper("Unable to update user suspension", async(req, res) => {
    const userId = Number(req.user.id);
    const targetId = Number(req.params.targetId);

    if (!Number.isSafeInteger(targetId) || targetId <= 0) {
        return res.status(400).json({ message: "Invalid ID." });
    }
    if (targetId === userId && suspended) {
        return res.status(400).json({ message: "You cannot suspend your own account." });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [targetRows] = await connection.execute(
            "SELECT role, is_suspended FROM users WHERE id = ? FOR UPDATE",
            [targetId],
        );
        const target = targetRows[0];
        if (!target) {
            await connection.rollback();
            return res.status(404).json({ message: "Target user not found." });
        }

        const allowedRoles = req.user.role === "admin"
            ? ["user", "moderator", "admin"]
            : ["user"];
        if (!allowedRoles.includes(target.role)) {
            await connection.rollback();
            return res.status(403).json({
                message: target.role === "admin"
                    ? "Only admins can manage admin accounts."
                    : "Moderators can only manage regular user accounts.",
            });
        }

        if (suspended && target.role === "admin" && !target.is_suspended) {
            await lockAdminUsers(connection);
            const [[{ activeAdminCount }]] = await connection.execute(
                "SELECT COUNT(*) AS activeAdminCount FROM users WHERE role = 'admin' AND is_suspended = 0",
            );
            if (Number(activeAdminCount) <= 1) {
                await connection.rollback();
                return res.status(400).json({ message: "The last active admin account cannot be suspended." });
            }
        }

        await connection.execute(
            "UPDATE users SET is_suspended = ? WHERE id = ?",
            [suspended ? 1 : 0, targetId],
        );
        await connection.commit();
        return res.json({ message: suspended ? "User suspended." : "User unsuspended." });
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
});

// Suspend or restore an eligible user account.
export const suspendUser = setUserSuspension(true);
export const unsuspendUser = setUserSuspension(false);
