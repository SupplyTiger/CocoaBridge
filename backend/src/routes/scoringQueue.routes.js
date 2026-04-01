import express from "express";
import { protectRoute, adminOnly } from "../middleware/auth.middleware.js";
import {
  listScoringQueue,
  approveScoringQueueItem,
  dismissScoringQueueItem,
} from "../controllers/scoringQueue.controller.js";

export const scoringQueueRouter = express.Router();

scoringQueueRouter.get("/", ...protectRoute, adminOnly, listScoringQueue);
scoringQueueRouter.post("/:id/approve", ...protectRoute, adminOnly, approveScoringQueueItem);
scoringQueueRouter.post("/:id/dismiss", ...protectRoute, adminOnly, dismissScoringQueueItem);
