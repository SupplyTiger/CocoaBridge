import express from "express";
import { protectRoute, adminOnly } from "../middleware/auth.middleware.js";
import {
  listUsers,
  updateUser,
  getSystemHealth,
  triggerSync,
} from "../controllers/admin.controller.js";

export const router = express.Router();

// User management
router.get("/users", ...protectRoute, adminOnly, listUsers);
router.patch("/users/:id", ...protectRoute, adminOnly, updateUser);

// System health
router.get("/system-health", ...protectRoute, adminOnly, getSystemHealth);

// Manual sync triggers — type: sam-opportunities | usaspending-awards | sam-descriptions | sam-industry-days
router.post("/sync/:type", ...protectRoute, adminOnly, triggerSync);
