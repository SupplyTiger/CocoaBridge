import prisma from "../config/db.js";

// ─── Recipients by obligated amount ──────────────────────────────────────────

export const getRecipientAnalytics = async (req, res) => {
  try {
    const grouped = await prisma.award.groupBy({
      by: ["recipientId"],
      _sum: { obligatedAmount: true },
      _count: { id: true },
      where: { recipientId: { not: null } },
    });

    const top = grouped
      .sort((a, b) => Number(b._sum.obligatedAmount ?? 0) - Number(a._sum.obligatedAmount ?? 0))
      .slice(0, 50);

    const recipientIds = top.map((r) => r.recipientId);
    const recipients = await prisma.recipient.findMany({
      where: { id: { in: recipientIds } },
      select: { id: true, name: true, uei: true },
    });
    const byId = Object.fromEntries(recipients.map((r) => [r.id, r]));

    const data = top.map((row) => ({
      recipientId: row.recipientId,
      name: byId[row.recipientId]?.name ?? "Unknown",
      uei: byId[row.recipientId]?.uei ?? null,
      awardCount: row._count.id,
      totalObligated: Number(row._sum.obligatedAmount ?? 0),
    }));

    return res.json({ data });
  } catch (error) {
    console.error("Error in getRecipientAnalytics:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ─── PSC code breakdown ───────────────────────────────────────────────────────

export const getPscAnalytics = async (req, res) => {
  try {
    const [oppGroups, awardGroups] = await Promise.all([
      prisma.opportunity.groupBy({
        by: ["pscCode"],
        _count: { id: true },
        where: { pscCode: { not: null } },
      }),
      prisma.award.groupBy({
        by: ["pscCode"],
        _count: { id: true },
        _sum: { obligatedAmount: true },
        where: { pscCode: { not: null } },
      }),
    ]);

    // Build unified map keyed by pscCode
    const map = {};
    for (const row of oppGroups) {
      map[row.pscCode] = { pscCode: row.pscCode, oppCount: row._count.id, awardCount: 0, totalObligated: 0 };
    }
    for (const row of awardGroups) {
      if (!map[row.pscCode]) map[row.pscCode] = { pscCode: row.pscCode, oppCount: 0, awardCount: 0, totalObligated: 0 };
      map[row.pscCode].awardCount = row._count.id;
      map[row.pscCode].totalObligated = Number(row._sum.obligatedAmount ?? 0);
    }

    const data = Object.values(map).sort((a, b) => b.totalObligated - a.totalObligated);

    return res.json({ data });
  } catch (error) {
    console.error("Error in getPscAnalytics:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ─── NAICS code breakdown ─────────────────────────────────────────────────────

export const getNaicsAnalytics = async (req, res) => {
  try {
    const [oppRows, awardRows] = await Promise.all([
      prisma.$queryRaw`
        SELECT unnest("naicsCodes") AS naics, COUNT(*)::int AS opp_count
        FROM "Opportunity"
        WHERE array_length("naicsCodes", 1) > 0
        GROUP BY naics
        ORDER BY opp_count DESC
        LIMIT 100
      `,
      prisma.$queryRaw`
        SELECT unnest("naicsCodes") AS naics,
               COUNT(*)::int AS award_count,
               COALESCE(SUM("obligatedAmount"), 0)::float AS total_obligated
        FROM "Award"
        WHERE array_length("naicsCodes", 1) > 0
        GROUP BY naics
        ORDER BY total_obligated DESC
        LIMIT 100
      `,
    ]);

    const map = {};
    for (const row of oppRows) {
      map[row.naics] = { naics: row.naics, oppCount: row.opp_count, awardCount: 0, totalObligated: 0 };
    }
    for (const row of awardRows) {
      if (!map[row.naics]) map[row.naics] = { naics: row.naics, oppCount: 0, awardCount: 0, totalObligated: 0 };
      map[row.naics].awardCount = row.award_count;
      map[row.naics].totalObligated = Number(row.total_obligated ?? 0);
    }

    const data = Object.values(map).sort((a, b) => b.totalObligated - a.totalObligated);

    return res.json({ data });
  } catch (error) {
    console.error("Error in getNaicsAnalytics:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ─── Agency breakdown ─────────────────────────────────────────────────────────

export const getAgencyAnalytics = async (req, res) => {
  try {
    const [oppGroups, awardGroups] = await Promise.all([
      prisma.opportunity.groupBy({
        by: ["buyingOrganizationId", "type"],
        _count: { id: true },
        where: { buyingOrganizationId: { not: null } },
      }),
      prisma.award.groupBy({
        by: ["buyingOrganizationId"],
        _count: { id: true },
        _sum: { obligatedAmount: true },
        where: { buyingOrganizationId: { not: null } },
      }),
    ]);

    // Collect all org IDs
    const orgIds = [
      ...new Set([
        ...oppGroups.map((r) => r.buyingOrganizationId),
        ...awardGroups.map((r) => r.buyingOrganizationId),
      ]),
    ];

    const orgs = await prisma.buyingOrganization.findMany({
      where: { id: { in: orgIds } },
      select: { id: true, name: true, level: true },
    });
    const orgById = Object.fromEntries(orgs.map((o) => [o.id, o]));

    // Build per-org map
    const map = {};
    for (const row of oppGroups) {
      const id = row.buyingOrganizationId;
      if (!map[id]) {
        map[id] = {
          orgId: id,
          name: orgById[id]?.name ?? "Unknown",
          level: orgById[id]?.level ?? null,
          oppCount: 0,
          oppsByType: {},
          awardCount: 0,
          awardTotal: 0,
        };
      }
      map[id].oppCount += row._count.id;
      map[id].oppsByType[row.type] = (map[id].oppsByType[row.type] ?? 0) + row._count.id;
    }
    for (const row of awardGroups) {
      const id = row.buyingOrganizationId;
      if (!map[id]) {
        map[id] = {
          orgId: id,
          name: orgById[id]?.name ?? "Unknown",
          level: orgById[id]?.level ?? null,
          oppCount: 0,
          oppsByType: {},
          awardCount: 0,
          awardTotal: 0,
        };
      }
      map[id].awardCount = row._count.id;
      map[id].awardTotal = Number(row._sum.obligatedAmount ?? 0);
    }

    const data = Object.values(map)
      .sort((a, b) => (b.oppCount + b.awardCount) - (a.oppCount + a.awardCount))
      .slice(0, 50);

    return res.json({ data });
  } catch (error) {
    console.error("Error in getAgencyAnalytics:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
