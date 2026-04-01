import { createRequire } from "module";
import mammoth from "mammoth";
import {
  extractRelevantSections,
  resolveFileExtension,
  SUPPORTED_PARSE_TYPES,
} from "./csv.js";

// pdf-parse v1 is CJS-only
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

// 5MB cap for background job (tighter than the 10MB HTTP route cap)
const MAX_BACKGROUND_PARSE_SIZE = 5 * 1024 * 1024;

/**
 * Downloads and parses an attachment record headlessly (no HTTP response).
 * Used by the Inngest scoring job.
 *
 * @param {object} attachment - OpportunityAttachment record with { id, downloadUrl, size, mimeType, name }
 * @returns {Promise<{ parsedText: string } | { error: string, skip: true }>}
 */
export async function parseAttachmentContent(attachment) {
  const ext = resolveFileExtension(attachment);

  if (!SUPPORTED_PARSE_TYPES.includes(ext)) {
    return { error: `Unsupported format: ${ext || "unknown"}`, skip: true };
  }

  if (attachment.size && attachment.size > MAX_BACKGROUND_PARSE_SIZE) {
    return {
      error: `File too large (${(attachment.size / 1024 / 1024).toFixed(1)}MB). Max: 5MB`,
      skip: true,
    };
  }

  let response;
  try {
    response = await fetch(attachment.downloadUrl, {
      signal: AbortSignal.timeout(30000),
    });
  } catch (err) {
    return { error: `Download failed: ${err.message}`, skip: true };
  }

  if (!response.ok) {
    return { error: `SAM.gov download failed (HTTP ${response.status})`, skip: true };
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  if (buffer.length > MAX_BACKGROUND_PARSE_SIZE) {
    return {
      error: `File too large after download (${(buffer.length / 1024 / 1024).toFixed(1)}MB). Max: 5MB`,
      skip: true,
    };
  }

  let rawText;
  try {
    if (ext === ".pdf") {
      // pdf-parse emits benign "TT: undefined function: N" warnings from the
      // PDF.js TrueType font renderer — suppress them to keep logs clean.
      const _warn = console.warn;
      console.warn = () => {};
      let result;
      try {
        result = await pdfParse(buffer);
      } finally {
        console.warn = _warn;
      }
      rawText = result.text;
    } else {
      const result = await mammoth.extractRawText({ buffer });
      rawText = result.value;
    }
  } catch (err) {
    return { error: `Parse error: ${err.message}`, skip: true };
  }

  if (!rawText || rawText.trim().length === 0) {
    return { error: "No text extracted (may be scanned/image-based)", skip: true };
  }

  const parsedText = extractRelevantSections(rawText);
  return { parsedText };
}
