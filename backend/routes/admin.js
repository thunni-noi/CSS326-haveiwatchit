import express from "express";
import * as admin from "../controllers/admin.js";
import { requireAdmin } from "../middleware/admin.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect, requireAdmin);
router.get("/shows/:id/associations", admin.getShowAssociations);
router.get("/users/:id/watchlist", admin.getUserWatchlist);
router.post("/users/:id/watchlist", admin.addUserWatchlistItem);
router.put("/users/:id/watchlist/:showId", admin.updateUserWatchlistItem);
router.delete("/users/:id/watchlist/:showId", admin.deleteUserWatchlistItem);
router.get("/:entity", admin.listRecords);
router.post("/:entity", admin.createRecord);
router.put("/:entity", admin.updateRecord);
router.delete("/:entity", admin.deleteRecord);

export default router;
