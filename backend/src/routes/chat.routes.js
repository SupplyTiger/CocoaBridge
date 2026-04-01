import express from "express";
import { protectRoute, readOnlyOrAbove } from "../middleware/auth.middleware.js";
import {
  handleChat,
  listModels,
  listConversations,
  getConversationMessages,
  deleteConversation,
  updateConversation,
} from "../controllers/chat.controller.js";

export const router = express.Router();

// All chat routes require READ_ONLY or ADMIN role
router.post("/", ...protectRoute, readOnlyOrAbove, handleChat);
router.get("/models", ...protectRoute, readOnlyOrAbove, listModels);
router.get("/conversations", ...protectRoute, readOnlyOrAbove, listConversations);
router.get("/conversations/:id/messages", ...protectRoute, readOnlyOrAbove, getConversationMessages);
router.delete("/conversations/:id", ...protectRoute, readOnlyOrAbove, deleteConversation);
router.patch("/conversations/:id", ...protectRoute, readOnlyOrAbove, updateConversation);

// v3 @ai-sdk/react sends GET /{chatId}/stream for reconnection — not supported in stateless mode
router.get("/:chatId/stream", (_req, res) => {
  res.status(204).end();
});
