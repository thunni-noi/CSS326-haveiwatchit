import express from "express";
import * as adminRecords from "../controllers/adminRecords.js";
import * as adminShows from "../controllers/adminShows.js";
import * as adminSubmissions from "../controllers/adminSubmissions.js";
import * as adminUsers from "../controllers/adminUsers.js";
import { requireRole } from "../middleware/auth.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/ban/:targetId", protect, requireRole("admin", "moderator"), adminUsers.suspendUser);
router.post("/unban/:targetId", protect, requireRole("admin", "moderator"), adminUsers.unsuspendUser);

router.use(protect, requireRole("admin"));
router.get("/shows/:id/associations", adminShows.getShowAssociations);
// Supply user IDs and display labels for the submission editor's Submitted By dropdown.
router.get("/users/options", adminSubmissions.listUserOptions);
router.get("/users/:id/watchlist", adminUsers.getUserWatchlist);
router.post("/users/:id/watchlist", adminUsers.addUserWatchlistItem);
router.put("/users/:id/watchlist/:showId", adminUsers.updateUserWatchlistItem);
router.delete("/users/:id/watchlist/:showId", adminUsers.deleteUserWatchlistItem);
router.get("/users/:id/collections", adminUsers.getUserCollections);
router.get("/users/:id/followed-collections", adminUsers.getUserFollowedCollections);
router.post("/users/:id/followed-collections/:collectionId", adminUsers.followUserCollection);
router.delete("/users/:id/followed-collections/:collectionId", adminUsers.unfollowUserCollection);
router.get("/users/:id/collections/:collectionId", adminUsers.getUserCollection);
router.put("/users/:id/collections/:collectionId", adminUsers.updateUserCollection);
router.post("/users/:id/collections/:collectionId/items", adminUsers.addUserCollectionItem);
router.delete("/users/:id/collections/:collectionId/items/:showId", adminUsers.deleteUserCollectionItem);
router.put("/users/:id/avatar", adminUsers.receiveUserAvatar, adminUsers.updateUserAvatar);
router.get("/:entity", adminRecords.listRecords);
router.post("/:entity", adminRecords.createRecord);
router.put("/:entity", adminRecords.updateRecord);
router.delete("/:entity", adminRecords.deleteRecord);

export default router;
