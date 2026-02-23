/**
 * Helpers for generating InboxItem-friendly title/summary text.
 * Keep these deterministic and null-safe (no "undefined..." / "null" strings).
 */

const collapseWhitespace = (value) => {
  if (value == null) return null;
  const text = String(value).replace(/\s+/g, " ").trim();
  return text.length ? text : null;
};

/**
 * Truncates to a max length. If truncated, appends "..." while staying <= maxLen.
 * Returns null for null/empty input.
 */
export const truncateWithEllipsis = (value, maxLen) => {
  const text = collapseWhitespace(value);
  if (!text) return null;

  const limit = Number(maxLen);
  if (!Number.isFinite(limit) || limit <= 0) return null;

  if (text.length <= limit) return text;

  const ellipsis = "...";
  if (limit <= ellipsis.length) return ellipsis.slice(0, limit);

  return `${text.slice(0, limit - ellipsis.length).trimEnd()}${ellipsis}`;
};

export const buildInboxTitle = ({
  entityLabel,
  naicsCodes,
  pscCode,
  text,
  maxLen = 160,
} = {}) => {
  const codeParts = [];
  const naics = Array.isArray(naicsCodes) ? naicsCodes[0] : null;
  if (naics) codeParts.push(String(naics));
  if (pscCode) codeParts.push(String(pscCode));

  const codesPart = codeParts.length ? ` [${codeParts.join(", ")}]` : "";

  const cleanText = collapseWhitespace(text);
  const prefix = `${entityLabel ?? "Item"}${codesPart}`;

  if (!cleanText) return prefix;

  const short = truncateWithEllipsis(cleanText, maxLen);
  return short ? `${prefix}: ${short}` : prefix;
};

export const buildInboxSummary = (text, maxLen = 250) =>
  truncateWithEllipsis(text, maxLen);
