import pool from "../db/db.js";//(connect to db)

// Return user labels and IDs for admin forms that reference a submitting user.
export const listUserOptions = async (req, res) => {
    try {
        const [users] = await pool.execute(
            "SELECT id, username, email FROM users ORDER BY username, email",
        );
        return res.json({ users });
    } catch (error) {
        console.error("Admin user options load failed:", error);
        return res.status(500).json({ message: "Unable to load users for the submission form." });
    }
};
