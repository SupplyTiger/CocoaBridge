import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  handleChat,
  listModels,
  listConversations,
  getConversationMessages,
  deleteConversation,
  updateConversation,
} from "../controllers/chat.controller.js";

export const router = express.Router();

// All chat routes require authentication (any role)
router.post("/", ...protectRoute, handleChat);
router.get("/models", ...protectRoute, listModels);
router.get("/conversations", ...protectRoute, listConversations);
router.get("/conversations/:id/messages", ...protectRoute, getConversationMessages);
router.delete("/conversations/:id", ...protectRoute, deleteConversation);
router.patch("/conversations/:id", ...protectRoute, updateConversation);

// v3 @ai-sdk/react sends GET /{chatId}/stream for reconnection — not supported in stateless mode
router.get("/:chatId/stream", (_req, res) => {
  res.status(204).end();
});
