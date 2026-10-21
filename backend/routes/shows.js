import express from "express";
import * as shows from "../controllers/shows.js"

const router = express.Router();

router.get("/top-rated", shows.getTopShows);
router.get("/get-by-type", shows.getShowByType);
router.get("/search", shows.searchShows);
router.get("/randoms", shows.getRandomShows);
router.get("/:id/reviews", shows.getShowReviews);
router.get("/:id", shows.getShowById);

export default router;