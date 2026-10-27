import express from "express";
import * as admin from "../controllers/admin.js";
import { requireRole } from "../middleware/auth.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/ban/:targetId", protect, requireRole("admin", "moderator"), admin.suspendUser);
router.post("/unban/:targetId", protect, requireRole("admin", "moderator"), admin.unsuspendUser);

router.use(protect, requireRole("admin"));
router.get("/shows/:id/associations", admin.getShowAssociations);
router.get("/users/:id/watchlist", admin.getUserWatchlist);
router.post("/users/:id/watchlist", admin.addUserWatchlistItem);
router.put("/users/:id/watchlist/:showId", admin.updateUserWatchlistItem);
router.delete("/users/:id/watchlist/:showId", admin.deleteUserWatchlistItem);
router.put("/users/:id/avatar", admin.receiveUserAvatar, admin.updateUserAvatar);
router.get("/:entity", admin.listRecords);
router.post("/:entity", admin.createRecord);
router.put("/:entity", admin.updateRecord);
router.delete("/:entity", admin.deleteRecord);

export default router;
