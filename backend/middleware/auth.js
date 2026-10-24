import jwt from "jsonwebtoken";
import pool from "../db/db.js";

export const protect = async (req, res, next) => {
    try {
        const token = req.cookies.auth_token;

        if (!token) {
            return res.status(401).json({ message: "Not authorized (no token)!"})
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const [users] = await pool.execute("SELECT id, username, email, role, avatar_url, is_verified, is_suspended, reputation, created_at FROM users WHERE id = ?", [decoded.id]);
        if (users.length === 0){
            return res.status(401).json({ message: "Not authorized (user not found)!"});
        }

        req.user = users[0];
        next();

    } catch (err) {
        console.error(err)
        res.status(401).json({ message: "Not authorized!", error: err.message})
    }
}

export const requireAdmin = (req, res, next) => {
    if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "Required admin permission level." });
    }

    next();
};

export const requireModerator = (req, res, next) => {
    if (req.user?.role !== "admin" && req.user?.role !== "moderator"){
        return res.status(403).json({ message: "Required atleast moderator permission level."});
    }

    next();
}

// Used for review delete
export const requireSelfOrMod = (req, res, next) => {
    const isSelf = req.user.id === Number(req.params.userId);
    const isMod = req.user.role === "admin" || req.user.role === "moderator";
    if (!isSelf && !isMod) return res.status(403).json({message: "Do not have required permission"});

    next();
}
