import { AcquisitionPath } from "@prisma/client";
import prisma from "../config/db.js";
import { parseAttachmentContent } from "./parseAttachmentContent.js";
import { loadFilterConfig } from "./filterConfig.js";
import { buildInboxTitle } from "./inboxText.js";

export const SUPPLY_TIGER_PSC = ['8925', '8950', '8970'];

// NSN format: 4-digit FSC + 2-digit country code + 3-digit item number + 4-digit variant
const NSN_REGEX = /\b\d{4}-\d{2}-\d{3}-\d{4}\b/g;

/**
 * Score an opportunity against its attachments and metadata using FLIS-based signal matching.
 * Returns { score, matchedSignals, parsedTexts }.
 */
async function scoreOpportunityForInbox(opportunity, flisItems, filterConfig) {
  const matchedSignals = [];
  let score = 0;

  const flisItemNames = flisItems.map(f => f.itemName?.toLowerCase()).filter(Boolean);
  const flisCommonNames = flisItems.map(f => f.commonName?.toLowerCase()).filter(Boolean);
  const flisNsnSet = new Set(flisItems.map(f => f.nsn));

  const metaText = [opportunity.title ?? "", opportunity.description ?? ""].join(" ");

  // NAICS match
  if (
    opportunity.naicsCodes?.length > 0 &&
    opportunity.naicsCodes.some(code =>
      filterConfig.naicsCodes.some(prefix => code.startsWith(prefix))
    )
  ) {
    score += 2;
    matchedSignals.push({ type: "NAICS_MATCH", value: opportunity.naicsCodes[0], source: "opportunity" });
  }

  // Agency award history
  if (opportunity.buyingOrganizationId) {
    const historyCount = await prisma.award.count({
      where: {
        buyingOrganizationId: opportunity.buyingOrganizationId,
        OR: [
          { naicsCodes: { hasSome: filterConfig.naicsCodes } },
          { pscCode: { in: SUPPLY_TIGER_PSC } },
        ],
      },
    });
    if (historyCount > 0) {
      score += 1;
      matchedSignals.push({ type: "AGENCY_HISTORY", value: opportunity.buyingOrganizationId, source: "awards" });
    }
  }

  // Deadline signals
  if (opportunity.responseDeadline) {
    const daysUntil = Math.ceil((new Date(opportunity.responseDeadline) - new Date()) / (1000 * 60 * 60 * 24));
    if (daysUntil < 7) {
      score -= 1;
    } else if (daysUntil >= 14) {
      score += 1;
      matchedSignals.push({ type: "DEADLINE_FAVORABLE", value: `${daysUntil}d`, source: "opportunity" });
    }
  }

  // Keyword signals on title/description
  const metaLower = metaText.toLowerCase();
  const kwMatches = filterConfig.solicitationKeywords.filter(kw => metaLower.includes(kw.toLowerCase()));
  for (const kw of kwMatches) {
    score += 2;
    matchedSignals.push({ type: "KEYWORD", value: kw, source: "title" });
  }

  // Parse attachments
  const parsedTexts = [];
  if (opportunity.attachments?.length > 0) {
    for (const attachment of opportunity.attachments) {
      const result = await parseAttachmentContent(attachment);
      if (result.skip) continue;
      parsedTexts.push({ attachmentId: attachment.id, text: result.parsedText });
    }
  }

  const textsToScore = parsedTexts.length > 0
    ? parsedTexts.map(p => ({ source: "attachment", text: p.text }))
    : [{ source: "metadata", text: metaText }];

  let bestAttachmentScore = 0;
  let bestAttachmentSignals = [];

  for (const { source, text } of textsToScore) {
    const textLower = text.toLowerCase();
    let attachScore = 0;
    const attachSignals = [];

    const nsnMatches = [...new Set(text.match(NSN_REGEX) ?? [])];
    for (const nsn of nsnMatches) {
      const plain = nsn.replace(/-/g, "");
      if (flisNsnSet.has(nsn) || flisNsnSet.has(plain)) {
        attachScore += 5;
        attachSignals.push({ type: "NSN_MATCH", value: nsn, source });
      }
    }

    for (const name of flisItemNames) {
      if (textLower.includes(name)) {
        attachScore += 3;
        attachSignals.push({ type: "ITEM_NAME", value: name, source: "flis" });
        break;
      }
    }

    for (const name of flisCommonNames) {
      if (textLower.includes(name)) {
        attachScore += 2;
        attachSignals.push({ type: "COMMON_NAME", value: name, source: "flis" });
        break;
      }
    }

    if (SUPPLY_TIGER_PSC.some(psc => text.includes(psc))) {
      attachScore += 1;
      attachSignals.push({ type: "PSC_IN_TEXT", value: opportunity.pscCode, source });
    }

    for (const kw of filterConfig.solicitationKeywords) {
      if (textLower.includes(kw.toLowerCase()) && !metaLower.includes(kw.toLowerCase())) {
        attachScore += 2;
        attachSignals.push({ type: "KEYWORD", value: kw, source });
      }
    }

    if (attachScore > bestAttachmentScore) {
      bestAttachmentScore = attachScore;
      bestAttachmentSignals = attachSignals;
    }
  }

  score += bestAttachmentScore;
  matchedSignals.push(...bestAttachmentSignals);

  return { score, matchedSignals, parsedTexts };
}

export async function runScoreNewOpportunityAttachments() {
  const [flisItems, filterConfig] = await Promise.all([
    prisma.federalLogisticsInformationSystem.findMany({
      where: { pscCode: { in: SUPPLY_TIGER_PSC } },
      select: { nsn: true, itemName: true, commonName: true },
    }),
    loadFilterConfig(prisma),
  ]);

  const opportunities = await prisma.opportunity.findMany({
    where: {
      active: true,
      pscCode: { in: SUPPLY_TIGER_PSC },
      inboxItems: { none: {} },
      scoringQueue: null,
    },
    include: { attachments: true },
  });

  const results = { scored: 0, autoAdmitted: 0, queued: 0, dropped: 0, errors: 0 };

  for (const opp of opportunities) {
    try {
      const { score, matchedSignals, parsedTexts } = await scoreOpportunityForInbox(opp, flisItems, filterConfig);

      if (score >= 4 && parsedTexts.length > 0) {
        const now = new Date();
        for (const { attachmentId, text } of parsedTexts) {
          await prisma.opportunityAttachment.update({
            where: { id: attachmentId },
            data: { parsedText: text, parsedAt: now },
          });
        }
      }

      if (score >= 8) {
        const inboxTitle = buildInboxTitle({
          entityLabel: "Opportunity",
          naicsCodes: opp.naicsCodes,
          pscCode: opp.pscCode,
          text: opp.title ?? null,
          maxLen: 160,
        });
        await prisma.inboxItem.create({
          data: {
            source: "SAM",
            acquisitionPath: AcquisitionPath.OPEN_MARKET,
            type: opp.type ?? "OTHER",
            tag: opp.tag ?? "GENERAL",
            title: inboxTitle,
            deadline: opp.responseDeadline ?? null,
            opportunityId: opp.id,
            buyingOrganizationId: opp.buyingOrganizationId ?? null,
            attachmentScore: score,
            matchedSignals,
          },
        });
        results.autoAdmitted += 1;
      } else if (score >= 4) {
        const createdAt = new Date();
        const fourteenDaysOut = new Date(createdAt.getTime() + 14 * 24 * 60 * 60 * 1000);
        const expiresAt = opp.responseDeadline
          ? new Date(Math.min(fourteenDaysOut.getTime(), new Date(opp.responseDeadline).getTime()))
          : fourteenDaysOut;
        await prisma.scoringQueue.create({
          data: { opportunityId: opp.id, score, matchedSignals, expiresAt },
        });
        results.queued += 1;
      } else {
        results.dropped += 1;
      }

      results.scored += 1;
    } catch (err) {
      console.error(`scoreNewOpportunityAttachments: error on opp ${opp.id}:`, err.message);
      results.errors += 1;
    }

    await new Promise(resolve => setTimeout(resolve, 200));
  }

  return { results };
}

export async function runCleanupExpiredScoringQueue() {
  const deleted = await prisma.scoringQueue.deleteMany({
    where: {
      status: "PENDING",
      OR: [
        { expiresAt: { lt: new Date() } },
        { opportunity: { active: false } },
      ],
    },
  });
  return { count: deleted.count };
}
