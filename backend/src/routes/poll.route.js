import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { sanitizeInput } from "../middleware/sanitize.js";
import { getPolls, createPoll, votePoll, deletePoll } from "../controllers/poll.controller.js";

const router = express.Router();

router.get("/", protectRoute, getPolls);
router.post("/", protectRoute, sanitizeInput(['question', 'options', 'placeName']), createPoll);
router.post("/:pollId/vote", protectRoute, votePoll);
router.delete("/:pollId", protectRoute, deletePoll);

export default router;
