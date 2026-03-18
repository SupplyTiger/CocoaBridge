import { createGoogleGenerativeAI } from "@ai-sdk/google";
import {ENV} from "../config/env.js";

const google = createGoogleGenerativeAI({ apiKey: ENV.GEMINI_API_KEY });
// TODO: add other providers (OpenAI, Anthropic, etc) and update MODEL_REGISTRY accordingly
const MODEL_REGISTRY = [
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "google",
    envKey: ENV.GEMINI_API_KEY,
    factory: () => google("gemini-2.5-flash"),
    isDefault: true,
  },
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    provider: "google",
    envKey: ENV.GEMINI_API_KEY,
    factory: () => google("gemini-2.5-pro"),
  },
  {
    id: "gemini-2.5-flash-lite",
    name: "Gemini 2.5 Flash Lite",
    provider: "google",
    envKey: ENV.GEMINI_API_KEY,
    factory: () => google("gemini-2.5-flash-lite"),
  },
  {
    id: "gemini-3-flash-preview",
    name: "Gemini 3 Flash",
    provider: "google",
    envKey: ENV.GEMINI_API_KEY,
    factory: () => google("gemini-3-flash-preview"),
  },
  {
    id: "gemini-3.1-pro-preview-customtools",
    name: "Gemini 3.1 Pro (Tools)",
    provider: "google",
    envKey: ENV.GEMINI_API_KEY,
    factory: () => google("gemini-3.1-pro-preview-customtools"),
  },
  {
    id: "gemini-3.1-flash-lite-preview",
    name: "Gemini 3.1 Flash Lite",
    provider: "google",
    envKey: ENV.GEMINI_API_KEY,
    factory: () => google("gemini-3.1-flash-lite-preview"),
  },
  // Future: uncomment when API keys are added
  // {
  //   id: "gpt-4o",
  //   name: "GPT-4o",
  //   provider: "openai",
  //   envKey: "OPENAI_API_KEY",
  //   factory: () => openai("gpt-4o"),
  // },
  // {
  //   id: "claude-sonnet",
  //   name: "Claude Sonnet",
  //   provider: "anthropic",
  //   envKey: "ANTHROPIC_API_KEY",
  //   factory: () => anthropic("claude-sonnet-4-20250514"),
  // },
];

export function getAvailableModels() {
  return MODEL_REGISTRY.filter((m) => m.envKey).map(
    ({ id, name, provider, isDefault }) => ({ id, name, provider, isDefault })
  );
}

export function getModel(modelId) {
  const available = MODEL_REGISTRY.filter((m) => m.envKey);
  const selected = modelId
    ? available.find((m) => m.id === modelId)
    : available.find((m) => m.isDefault) || available[0];
  if (!selected) throw new Error("No LLM provider configured");
  return selected.factory();
}
