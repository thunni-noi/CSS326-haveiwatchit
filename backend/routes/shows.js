import express from "express";
import * as shows from "../controllers/shows.js"
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/top-rated", shows.getTopShows);
router.get("/by-type", shows.getShowByType);
router.get("/search", shows.searchShows);
router.get("/randoms", shows.getRandomShows);
router.get("/:id/reviews", shows.getShowReviews);
router.post("/:id/reviews", protect, shows.saveShowReview);
router.get("/:id", shows.getShowById);

export default router;
