import express from "express";
import * as submissionMod from "../controllers/SubmissionMod.js";
import { protect, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.use(protect, requireRole("admin", "moderator"));
router.get("/", submissionMod.listPendingSubmissions);
router.post("/:id/approve", submissionMod.approveShowSubmission);

export default router;
