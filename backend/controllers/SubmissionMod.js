import pool from "../db/db.js";

const parsePositiveId = (value) => {
    if (!/^\d+$/.test(String(value))) return null;
    const id = Number(value);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
};

// Return pending show requests for the moderator review queue.
export const listPendingSubmissions = async (req, res) => {
    try {
        const [submissions] = await pool.execute(
            `SELECT submission.id, submission.submitted_by, submission.name, submission.type,
                    submission.synopsis, submission.photo_url, submission.content_rating,
                    submission.other_details, submission.created_at, submitter.username AS submitted_by_username
            FROM show_submission submission
            JOIN users submitter ON submitter.id = submission.submitted_by
            WHERE submission.status = 'pending'
            ORDER BY submission.created_at ASC, submission.id ASC`,
        );
        return res.json({ submissions });
    } catch (error) {
        console.error("Pending submissions load failed:", error);
        return res.status(500).json({ message: "Unable to load pending show submissions." });
    }
};

// Add an approved request to the show catalog and change its status in one transaction.
export const approveShowSubmission = async (req, res) => {
    const submissionId = parsePositiveId(req.params.id);
    const showStatus = req.body?.show_status;
    if (!submissionId) {
        return res.status(400).json({ message: "Invalid submission ID." });
    }
    if (!["airing", "completed", "upcoming"].includes(showStatus)) {
        return res.status(400).json({ message: "Choose a valid show status." });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [[submission]] = await connection.execute(
            `SELECT id, name, type, synopsis, photo_url, content_rating, status
            FROM show_submission
            WHERE id = ?
            FOR UPDATE`,
            [submissionId],
        );
        if (!submission) {
            await connection.rollback();
            return res.status(404).json({ message: "Show submission not found." });
        }
        if (submission.status !== "pending") {
            await connection.rollback();
            return res.status(409).json({ message: "This submission has already been reviewed." });
        }

        const [showResult] = await connection.execute(
            `INSERT INTO shows (name, type, synopsis, photo_url, status, content_rating)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                submission.name,
                submission.type,
                submission.synopsis,
                submission.photo_url,
                showStatus,
                submission.content_rating,
            ],
        );
        await connection.execute(
            "UPDATE show_submission SET status = 'approved' WHERE id = ?",
            [submissionId],
        );
        await connection.commit();
        return res.status(201).json({
            message: "Submission approved and show added to the catalog.",
            show_id: showResult.insertId,
        });
    } catch (error) {
        await connection.rollback();
        console.error("Show submission approval failed:", error);
        return res.status(500).json({ message: "Unable to approve this show submission." });
    } finally {
        connection.release();
    }
};
