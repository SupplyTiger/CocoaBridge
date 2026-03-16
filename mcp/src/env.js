import "dotenv/config";
import e from "express";

export const ENV = {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  DATABASE_URL: process.env.DATABASE_URL,
  PORT: process.env.PORT || 3001,
  NODE_ENV: process.env.NODE_ENV || "development",
  CLIENT_URL: process.env.CLIENT_URL || `http://localhost:${process.env.PORT || 3001}`,
  MCP_SECRET: process.env.MCP_SECRET
};

export const REQUIRED_ENV_VARS = ["GEMINI_API_KEY", "DATABASE_URL", "MCP_SECRET", "CLIENT_URL"];

const missing = REQUIRED_ENV_VARS.filter((key) => !ENV[key]);

if (missing.length) {
  throw new Error(
    `Missing required environment variables: ${missing.join(", ")}`,
  );
}
