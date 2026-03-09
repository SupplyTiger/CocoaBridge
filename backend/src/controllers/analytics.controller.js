import prisma from "../config/db.js";

const parseAnalyticsPagination = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 25));
  return { page, limit, skip: (page - 1) * limit };
};

const paginate = (arr, page, limit) => {
  const total = arr.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  return {
    data: arr.slice((safePage - 1) * limit, safePage * limit),
    meta: { total, page: safePage, limit, totalPages },
  };
};

// ─── Recipients by obligated amount ──────────────────────────────────────────

export const getRecipientAnalytics = async (req, res) => {
  try {
    const { page, limit } = parseAnalyticsPagination(req.query);

    const grouped = await prisma.award.groupBy({
      by: ["recipientId"],
      _sum: { obligatedAmount: true },
      _count: { id: true },
      where: { recipientId: { not: null } },
      orderBy: { _sum: { obligatedAmount: "desc" } },
    });

    const recipientIds = grouped.map((r) => r.recipientId);
    const recipients = await prisma.recipient.findMany({
      where: { id: { in: recipientIds } },
      select: { id: true, name: true, uei: true },
    });
    const byId = Object.fromEntries(recipients.map((r) => [r.id, r]));

    const all = grouped.map((row) => ({
      recipientId: row.recipientId,
      name: byId[row.recipientId]?.name ?? "Unknown",
      uei: byId[row.recipientId]?.uei ?? null,
      awardCount: row._count.id,
      totalObligated: Number(row._sum.obligatedAmount ?? 0),
    }));

    return res.status(200).json(paginate(all, page, limit));
  } catch (error) {
    console.error("Error in getRecipientAnalytics:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ─── PSC code breakdown ───────────────────────────────────────────────────────

export const getPscAnalytics = async (req, res) => {
  try {
    const { page, limit } = parseAnalyticsPagination(req.query);
    const sortBy = req.query.sortBy === "oppCount" ? "oppCount" : "totalObligated";

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

    const map = {};
    for (const row of oppGroups) {
      map[row.pscCode] = { pscCode: row.pscCode, oppCount: row._count.id, awardCount: 0, totalObligated: 0 };
    }
    for (const row of awardGroups) {
      if (!map[row.pscCode]) map[row.pscCode] = { pscCode: row.pscCode, oppCount: 0, awardCount: 0, totalObligated: 0 };
      map[row.pscCode].awardCount = row._count.id;
      map[row.pscCode].totalObligated = Number(row._sum.obligatedAmount ?? 0);
    }

    const all = Object.values(map).sort((a, b) => b[sortBy] - a[sortBy]);

    return res.status(200).json(paginate(all, page, limit));
  } catch (error) {
    console.error("Error in getPscAnalytics:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ─── NAICS code breakdown ─────────────────────────────────────────────────────

export const getNaicsAnalytics = async (req, res) => {
  try {
    const { page, limit } = parseAnalyticsPagination(req.query);
    const sortBy = req.query.sortBy === "oppCount" ? "oppCount" : "totalObligated";

    const [oppRows, awardRows] = await Promise.all([
      prisma.$queryRaw`
        SELECT unnest("naicsCodes") AS naics, COUNT(*)::int AS opp_count
        FROM "Opportunity"
        WHERE array_length("naicsCodes", 1) > 0
        GROUP BY naics
      `,
      prisma.$queryRaw`
        SELECT unnest("naicsCodes") AS naics,
               COUNT(*)::int AS award_count,
               COALESCE(SUM("obligatedAmount"), 0)::float AS total_obligated
        FROM "Award"
        WHERE array_length("naicsCodes", 1) > 0
        GROUP BY naics
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

    const all = Object.values(map).sort((a, b) => b[sortBy] - a[sortBy]);

    return res.status(200).json(paginate(all, page, limit));
  } catch (error) {
    console.error("Error in getNaicsAnalytics:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ─── Agency breakdown ─────────────────────────────────────────────────────────

const VALID_ORG_LEVELS = ["AGENCY", "SUBAGENCY", "OFFICE", "OTHER"];

export const getAgencyAnalytics = async (req, res) => {
  try {
    const { page, limit } = parseAnalyticsPagination(req.query);
    const sortBy = req.query.sortBy === "oppCount" ? "oppCount" : "awardTotal";
    const level = VALID_ORG_LEVELS.includes(req.query.level) ? req.query.level : "AGENCY";

    const rows = await prisma.$queryRaw`
      WITH RECURSIVE org_tree AS (
        SELECT id AS org_id, id AS root_id
        FROM "BuyingOrganization"
        WHERE level = ${level}::"OrgLevel"

        UNION ALL

        SELECT bo.id, ot.root_id
        FROM "BuyingOrganization" bo
        JOIN org_tree ot ON bo."parentId" = ot.org_id
      ),
      opp_agg AS (
        SELECT
          ot.root_id,
          o.type,
          COUNT(DISTINCT o.id)::int AS cnt
        FROM org_tree ot
        JOIN "Opportunity" o ON o."buyingOrganizationId" = ot.org_id
        GROUP BY ot.root_id, o.type
      ),
      award_agg AS (
        SELECT
          ot.root_id,
          COUNT(DISTINCT a.id)::int AS award_count,
          COALESCE(SUM(a."obligatedAmount"), 0)::float AS award_total
        FROM org_tree ot
        JOIN "Award" a ON a."buyingOrganizationId" = ot.org_id
        GROUP BY ot.root_id
      )
      SELECT
        bo.id                                                                          AS "orgId",
        bo.name,
        bo.level::text,
        COALESCE(SUM(oa.cnt), 0)::int                                                 AS "oppCount",
        COALESCE(json_object_agg(oa.type, oa.cnt) FILTER (WHERE oa.type IS NOT NULL), '{}'::json) AS "oppsByType",
        COALESCE(aa.award_count, 0)                                                   AS "awardCount",
        COALESCE(aa.award_total, 0)                                                   AS "awardTotal"
      FROM "BuyingOrganization" bo
      LEFT JOIN opp_agg oa ON oa.root_id = bo.id
      LEFT JOIN award_agg aa ON aa.root_id = bo.id
      WHERE bo.level = ${level}::"OrgLevel"
      GROUP BY bo.id, bo.name, bo.level, aa.award_count, aa.award_total
    `;

    const all = rows
      .map((r) => ({
        ...r,
        oppsByType: r.oppsByType ?? {},
        oppCount: Number(r.oppCount ?? 0),
        awardCount: Number(r.awardCount ?? 0),
        awardTotal: Number(r.awardTotal ?? 0),
      }))
      .sort((a, b) => b[sortBy] - a[sortBy]);

    return res.status(200).json(paginate(all, page, limit));
  } catch (error) {
    console.error("Error in getAgencyAnalytics:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
