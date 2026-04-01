import {
  solicitationTitleKeywords,
  naicsPrefixes,
  classificationPrefixes,
  industryDayTitleKeywords,
} from "./globals.js";
import { ENV } from "../config/env.js";

// All valid AppConfig keys — active lists + word banks
export const VALID_CONFIG_KEYS = [
  "solicitationKeywords",
  "naicsCodes",
  "pscPrefixes",
  "industryDayKeywords",
  "solicitationKeywordsBank",
  "naicsCodesBank",
  "pscPrefixesBank",
  "industryDayKeywordsBank",
  "adminEmailRules",
  "readOnlyEmailRules",
  "chatRetentionDays",
];

// Seeds used on first deploy if AppConfig table is empty
const SEEDS = {
  solicitationKeywords: solicitationTitleKeywords,
  naicsCodes: naicsPrefixes,
  pscPrefixes: classificationPrefixes,
  industryDayKeywords: industryDayTitleKeywords,
  solicitationKeywordsBank: [],
  naicsCodesBank: [],
  pscPrefixesBank: [],
  industryDayKeywordsBank: [],
  adminEmailRules: ENV.ADMIN_EMAILS,
  readOnlyEmailRules: [],
  chatRetentionDays: ["14"],
};

/**
 * Case-insensitive email rule matcher.
 * If rule starts with '@', checks if email ends with that domain suffix.
 * Otherwise, performs an exact match.
 */
function matchesEmailRule(email, rules) {
  const lower = email.toLowerCase();
  return rules.some((rule) => {
    const r = rule.toLowerCase();
    if (r.startsWith("@")) return lower.endsWith(r);
    return lower === r;
  });
}

/**
 * Resolve the role for a given email address by checking adminEmailRules
 * and readOnlyEmailRules from AppConfig.
 *
 * @param {import('@prisma/client').PrismaClient} db
 * @param {string} email
 * @returns {Promise<"ADMIN" | "READ_ONLY" | "USER">}
 */
export async function resolveRoleForEmail(db, email) {
  const [adminRow, readOnlyRow] = await Promise.all([
    db.appConfig.findUnique({ where: { key: "adminEmailRules" } }),
    db.appConfig.findUnique({ where: { key: "readOnlyEmailRules" } }),
  ]);

  const adminRules = adminRow?.values ?? [];
  const readOnlyRules = readOnlyRow?.values ?? [];

  if (matchesEmailRule(email, adminRules)) return "ADMIN";
  if (matchesEmailRule(email, readOnlyRules)) return "READ_ONLY";
  return "USER";
}

/**
 * Load the four active filter arrays from the DB.
 * On first call with an empty AppConfig table, seeds each key from globals.js.
 *
 * @param {import('@prisma/client').PrismaClient} db
 * @returns {Promise<{ solicitationKeywords: string[], naicsCodes: string[], pscPrefixes: string[], industryDayKeywords: string[] }>}
 */
export async function loadFilterConfig(db) {
  // Seed any missing keys from globals.js
  for (const [key, seed] of Object.entries(SEEDS)) {
    const existing = await db.appConfig.findUnique({ where: { key } });
    if (!existing) {
      await db.appConfig.create({ data: { key, values: seed } });
    }
  }

  const [solicitationKeywords, naicsCodes, pscPrefixes, industryDayKeywords] =
    await Promise.all([
      db.appConfig.findUnique({ where: { key: "solicitationKeywords" } }),
      db.appConfig.findUnique({ where: { key: "naicsCodes" } }),
      db.appConfig.findUnique({ where: { key: "pscPrefixes" } }),
      db.appConfig.findUnique({ where: { key: "industryDayKeywords" } }),
    ]);

  return {
    solicitationKeywords: solicitationKeywords?.values ?? [],
    naicsCodes: naicsCodes?.values ?? [],
    pscPrefixes: pscPrefixes?.values ?? [],
    industryDayKeywords: industryDayKeywords?.values ?? [],
  };
}
