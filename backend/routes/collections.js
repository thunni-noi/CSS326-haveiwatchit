import express from "express";
import * as collections from "../controllers/collections.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Public collections can be viewed without logging in.
router.get("/share/:uuid", collections.getSharedCollection);

// All remaining collection endpoints belong to the signed-in user.
router.use(protect);
router.get("/", collections.listCollections);
router.get("/public", collections.listPublicCollections);
router.get("/followed", collections.listFollowedCollections);
router.get("/search-public", collections.searchPublicCollections);
router.post("/:id/follow", collections.followCollection);
router.delete("/:id/follow", collections.unfollowCollection);
router.post("/", collections.createCollection);
router.get("/:id", collections.getCollectionDetails);
router.post("/:id/items", collections.addCollectionItem);
router.patch("/:id", collections.updateCollection);
router.delete("/:id", collections.deleteCollection);
router.delete("/:id/items/:showId", collections.removeCollectionItem);
router.get("/shows/:showId", collections.listCollectionShows);
router.post("/shows/:showId", collections.updateCollectionShows);

export default router;
