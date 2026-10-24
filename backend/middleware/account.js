import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import pool from "../db/db.js";

const router = express.Router();

const uploadDir = path.join(path.resolve(), "uploads", "avatars");
fs.mkdirSync(uploadDir, { recursive: true });

const EXT = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp" };

const upload = multer({
    storage: multer.diskStorage({
        destination: uploadDir,
        // ตั้งชื่อไฟล์เองด้วย uuid ไม่ใช้ชื่อที่ผู้ใช้ส่งมา
        filename: (req, file, cb) => cb(null, crypto.randomUUID() + EXT[file.mimetype]),
    }),
    limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
    fileFilter: (req, file, cb) => cb(null, Boolean(EXT[file.mimetype])),
});

// ถ้าโปรเจกต์มี middleware เช็คล็อกอินอยู่แล้ว ใช้ตัวเดิมแทนได้เลย
function requireAuth(req, res, next) {
    try {
        const payload = jwt.verify(req.cookies.auth_token, process.env.JWT_SECRET);
        req.userId = payload.id;
        next();
    } catch {
        res.status(401).json({ message: "Not logged in" });
    }
}

router.put("/", requireAuth, upload.single("avatar"), async (req, res) => {
    const username = req.body.username?.trim();

    if (username && (username.length < 3 || username.length > 30)) {
        return res.status(400).json({ message: "Name must be 3-30 characters" });
    }

    const sets = [];
    const values = [];
    if (username) {
        sets.push("username = ?");
        values.push(username);
    }
    if (req.file) {
        sets.push("avatar_url = ?");
        values.push(`/uploads/avatars/${req.file.filename}`);
    }
    if (!sets.length) {
        return res.status(400).json({ message: "Nothing to update" });
    }

    try {
        await pool.query(
            `UPDATE users SET ${sets.join(", ")} WHERE id = ?`,
            [...values, req.userId]
        );
        const [rows] = await pool.query(
            "SELECT id, username, email, role, avatar_url FROM users WHERE id = ?",
            [req.userId]
        );
        res.json({ user: rows[0] });
    } catch (err) {
        if (err.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ message: "That name is already taken" });
        }
        res.status(500).json({ message: "Server error" });
    }
});

// จัดการ error ของ multer (เช่น ไฟล์ใหญ่เกิน)
router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        const text = err.code === "LIMIT_FILE_SIZE" ? "Image must be under 2 MB" : err.message;
        return res.status(400).json({ message: text });
    }
    next(err);
});

export default router;