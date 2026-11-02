import bcrypt from "bcryptjs"; //password security(hash(), compare())
import fs from "fs"; //file system(read, write, create, and delete files/folders)
import path from "path"; //file paths(build correct folder paths across OSes.)
import { randomUUID } from "crypto"; //generate unique IDs(create unique name file)
import pool from "../db/db.js";//(connect to db)

// Build a field definition used by the admin entity schemas.
const field = (name, type, options = {}) => ({ name, type, ...options });

// Describe the database tables and fields that the generic admin API can manage.
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

// Look up an entity schema from an API route parameter.
const getEntity = (name) => entities[name];

// Create a name-to-definition lookup for validating an entity's fields.
const fieldMap = (entity) => new Map(entity.fields.map((item) => [item.name, item]));

// Validate submitted values, enforce field rules, and normalize values for SQL.
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

// Check that a record key contains exactly the entity's required primary-key fields.
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

// Build a parameterized WHERE clause for the entity's primary key.
const whereForKey = (entity, key) => ({
    clause: entity.keys.map((name) => `\`${name}\` = ?`).join(" AND "),
    values: entity.keys.map((name) => key[name]),
});

// Exclude write-only fields, such as passwords, from database responses.
const publicColumns = (entity) => entity.fields.filter((item) => !item.writeOnly);

// Delete a local avatar only if its resolved path is inside the uploads directory.
export const deleteLocalAvatar = (avatarUrl) => {
    if (!avatarUrl || typeof avatarUrl !== "string") return;

    const normalized = avatarUrl.startsWith("/") ? avatarUrl : `/${avatarUrl}`;
    const fullPath = path.join(path.resolve(), normalized.replace(/^\/+/, ""));
    const uploadsRoot = path.join(path.resolve(), "uploads");

    if (fullPath.startsWith(uploadsRoot) && fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
    }
};

// Lock admin account rows while checking rules that protect administrator access.
export const lockAdminUsers = async (connection) => {
    const [admins] = await connection.execute(
        "SELECT id FROM users WHERE role = 'admin' FOR UPDATE",
    );
    return admins.map((admin) => Number(admin.id));
};

// Return a paginated, searchable list of records and its field metadata.
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
    const filters = [];
    const filterValues = [];

    if (entity.table === "show_submission") {
        const submissionStatus = req.query.submission_status ?? "pending";
        if (!["all", "pending", "approved", "rejected"].includes(submissionStatus)) {
            return res.status(400).json({ message: "Invalid submission status filter." });
        }
        if (submissionStatus !== "all") {
            filters.push("`status` = ?");
            filterValues.push(submissionStatus);
        }
    }

    if (query && searchable.length) {
        filters.push(`(${searchable.map((item) => `CAST(\`${item.name}\` AS CHAR) LIKE ?`).join(" OR ")})`);
        filterValues.push(...searchable.map(() => `%${query}%`));
    }
    const whereClause = filters.length ? ` WHERE ${filters.join(" AND ")}` : "";

    try {
        const [rows] = await pool.execute(
            `SELECT ${columns} FROM \`${entity.table}\`${whereClause} ORDER BY ${entity.keys.map((name) => `\`${name}\``).join(", ")} LIMIT ? OFFSET ?`,
            [...filterValues, limit, offset],
        );
        const [countRows] = await pool.execute(
            `SELECT COUNT(*) AS total FROM \`${entity.table}\`${whereClause}`,
            filterValues,
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

// Validate and insert a record, then return its non-sensitive fields.
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

// Validate and update a record transactionally, including user-account safeguards.
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
                "SELECT avatar_url, role, is_suspended FROM users WHERE id = ? FOR UPDATE",
                [keyResult.key.id],
            );
            const currentUser = currentRows[0];
            if (!currentUser) {
                await connection.rollback();
                return res.status(404).json({ message: "Record not found." });
            }

            if (values.is_suspended === true) {
                if (Number(keyResult.key.id) === Number(req.user.id)) {
                    await connection.rollback();
                    return res.status(400).json({ message: "You cannot suspend your own account." });
                }
                if ((currentUser.role === "admin" || values.role === "admin") && req.user.role !== "admin") {
                    await connection.rollback();
                    return res.status(403).json({ message: "Only admins can suspend admin accounts." });
                }
                if (
                    (currentUser.role === "admin" || values.role === "admin")
                    && !currentUser.is_suspended
                ) {
                    await lockAdminUsers(connection);
                    const [[{ activeAdminCount }]] = await connection.execute(
                        "SELECT COUNT(*) AS activeAdminCount FROM users WHERE role = 'admin' AND is_suspended = 0",
                    );
                    if (Number(activeAdminCount) <= 1) {
                        await connection.rollback();
                        return res.status(400).json({ message: "The last active admin account cannot be suspended." });
                    }
                }
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

// Delete a record transactionally while protecting the active and final admin accounts.
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

// Wrap a controller to log unexpected errors and return a consistent server response.
