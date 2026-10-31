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
router.get("/users/:id/collections", admin.getUserCollections);
router.get("/users/:id/followed-collections", admin.getUserFollowedCollections);
router.post("/users/:id/followed-collections/:collectionId", admin.followUserCollection);
router.delete("/users/:id/followed-collections/:collectionId", admin.unfollowUserCollection);
router.get("/users/:id/collections/:collectionId", admin.getUserCollection);
router.put("/users/:id/collections/:collectionId", admin.updateUserCollection);
router.post("/users/:id/collections/:collectionId/items", admin.addUserCollectionItem);
router.delete("/users/:id/collections/:collectionId/items/:showId", admin.deleteUserCollectionItem);
router.put("/users/:id/avatar", admin.receiveUserAvatar, admin.updateUserAvatar);
router.get("/:entity", admin.listRecords);
router.post("/:entity", admin.createRecord);
router.put("/:entity", admin.updateRecord);
router.delete("/:entity", admin.deleteRecord);

export default router;
