import prisma from "../config/db.js";
import { loadFilterConfig } from "./filterConfig.js";

function startsWithAny(code, prefixes) {
  if (!code) return false;
  return prefixes.some((prefix) => code.startsWith(prefix));
}

function textMatchesKeywords(text, keywords) {
  if (!text || keywords.length === 0) return { match: false, matched: [] };
  const lower = text.toLowerCase();
  const matched = keywords.filter((kw) => lower.includes(kw.toLowerCase()));
  return { match: matched.length > 0, matched };
}

function getAcquisitionPathFit(type) {
  switch (type) {
    case "SOLICITATION":
    case "PRE_SOLICITATION":
    case "SOURCES_SOUGHT":
      return "GSA";
    case "AWARD_NOTICE":
      return "SUBCONTRACTING";
    default:
      return null;
  }
}

function computeOverallScore(dimensions) {
  let score = 0;
  if (dimensions.naicsMatch) score += 3;
  if (dimensions.pscMatch) score += 2;
  if (dimensions.keywordMatch) score += 2;
  if (dimensions.acquisitionPathFit) score += 1;
  if (dimensions.agencyHasHistory) score += 2;
  if (dimensions.daysUntilDeadline !== null && dimensions.daysUntilDeadline < 7) score -= 1;
  if (dimensions.daysUntilDeadline !== null && dimensions.daysUntilDeadline >= 14) score += 1;

  if (score >= 7) return "HIGH";
  if (score >= 4) return "MEDIUM";
  return "LOW";
}

function buildReasoning(dimensions, overallScore) {
  const parts = [];

  if (dimensions.naicsMatch) parts.push("NAICS codes match");
  else parts.push("NAICS codes do not match");

  if (dimensions.pscMatch) parts.push("PSC code aligns");
  else parts.push("PSC code does not match");

  if (dimensions.keywordMatch) parts.push(`keyword match: ${dimensions.matchedKeywords.join(", ")}`);
  else parts.push("no keyword match");

  if (dimensions.acquisitionPathFit) parts.push(`acquisition path: ${dimensions.acquisitionPathFit}`);
  else parts.push("no acquisition path fit");

  if (dimensions.agencyHasHistory) parts.push("agency has award history");
  else parts.push("no agency award history");

  if (dimensions.daysUntilDeadline === null) parts.push("no deadline");
  else if (dimensions.daysUntilDeadline < 0) parts.push("deadline passed");
  else if (dimensions.daysUntilDeadline < 7) parts.push(`${dimensions.daysUntilDeadline}d until deadline — tight`);
  else parts.push(`${dimensions.daysUntilDeadline}d until deadline`);

  return `${overallScore} fit: ${parts.join("; ")}.`;
}

/**
 * Score an opportunity by ID against the active filter config and agency history.
 * Returns { overallScore, dimensions, reasoning } — same shape as the MCP score_opportunity tool.
 *
 * @param {string} opportunityId
 */
export async function scoreOpportunity(opportunityId) {
  const [opportunity, filterConfig] = await Promise.all([
    prisma.opportunity.findUnique({
      where: { id: opportunityId },
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        naicsCodes: true,
        pscCode: true,
        responseDeadline: true,
        buyingOrganizationId: true,
      },
    }),
    loadFilterConfig(prisma),
  ]);

  if (!opportunity) throw new Error(`Opportunity not found: ${opportunityId}`);

  const naicsMatch =
    opportunity.naicsCodes.length > 0 &&
    opportunity.naicsCodes.some((code) => startsWithAny(code, filterConfig.naicsCodes));

  const pscMatch = startsWithAny(opportunity.pscCode, filterConfig.pscPrefixes);

  const allKeywords = [
    ...filterConfig.solicitationKeywords,
    ...filterConfig.industryDayKeywords,
  ];
  const titleResult = textMatchesKeywords(opportunity.title, allKeywords);
  const descResult = textMatchesKeywords(opportunity.description, allKeywords);
  const matchedKeywords = [...new Set([...titleResult.matched, ...descResult.matched])];
  const keywordMatch = matchedKeywords.length > 0;

  const acquisitionPathFit = getAcquisitionPathFit(opportunity.type);

  let agencyHasHistory = false;
  if (opportunity.buyingOrganizationId) {
    const historyCount = await prisma.award.count({
      where: {
        buyingOrganizationId: opportunity.buyingOrganizationId,
        OR: [
          { naicsCodes: { hasSome: filterConfig.naicsCodes } },
          { pscCode: { in: filterConfig.pscPrefixes } },
        ],
      },
    });
    agencyHasHistory = historyCount > 0;
  }

  let daysUntilDeadline = null;
  if (opportunity.responseDeadline) {
    const now = new Date();
    const deadline = new Date(opportunity.responseDeadline);
    daysUntilDeadline = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
  }

  const dimensions = {
    naicsMatch,
    pscMatch,
    keywordMatch,
    matchedKeywords,
    acquisitionPathFit,
    agencyHasHistory,
    daysUntilDeadline,
  };

  const overallScore = computeOverallScore(dimensions);
  const reasoning = buildReasoning(dimensions, overallScore);

  return { opportunityId: opportunity.id, overallScore, dimensions, reasoning };
}
