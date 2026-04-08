import express from "express";
import { handleDigestUnsubscribe } from "../controllers/admin.controller.js";

export const router = express.Router();

// Public — no auth required; HMAC token protects the endpoint
router.get("/unsubscribe", handleDigestUnsubscribe);
