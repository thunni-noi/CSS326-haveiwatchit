import express from "express";
import { protect, requireRole, requireSelfOrMod } from "../middleware/auth.js";
import * as shows from "../controllers/shows.js"

const router = express.Router();

router.get("/top-rated", shows.getTopShows);
router.get("/by-type", shows.getShowByType);
router.get("/search", shows.searchShows);
router.get("/randoms", shows.getRandomShows);
router.get("/:showId/reviews/:userId", shows.getUserShowReviews);
router.get("/:id/reviews", shows.getShowReviews);
router.get("/:id", shows.getShowById);
router.post("/:id/reviews", protect, shows.saveShowReview);
router.delete("/:showId/reviews/:userId", protect, requireSelfOrMod, shows.removeReview);

export default router;