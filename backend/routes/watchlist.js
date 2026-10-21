import express from "express";
import * as watchlist from "../controllers/watchlist.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);
router.get("/", watchlist.getWatchlist);
router.post("/", watchlist.addWatchlistItem);
router.put("/:showId", watchlist.updateWatchlistItem);
router.delete("/:showId", watchlist.deleteWatchlistItem);

export default router;
