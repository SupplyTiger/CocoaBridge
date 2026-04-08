import { callMcpTool } from "./mcpClient.js";
import { generateText } from "ai";
import { getModel } from "./modelProvider.js";
import prisma from "../config/db.js";

export async function fetchDigestData() {
  const now = new Date();
  const isoWeek = toISOWeek(now);
  const sevenDaysOut = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [analytics, topOpps, weeklyMetrics, upcomingDeadlines] = await Promise.allSettled([
    callMcpTool("get_analytics_summary", {}),
    callMcpTool("search_opportunities", { limit: 5 }),
    callMcpTool("get_weekly_metrics", { week: isoWeek }),
    prisma.inboxItem.findMany({
      where: {
        deadline: { gte: now, lt: sevenDaysOut },
        reviewStatus: { in: ["IN_REVIEW", "QUALIFIED", "CONTACTED"] },
      },
      select: { id: true, title: true, deadline: true, reviewStatus: true },
      orderBy: { deadline: "asc" },
      take: 10,
    }),
  ]);

  return {
    analytics: analytics.status === "fulfilled" ? analytics.value : null,
    topOpps: topOpps.status === "fulfilled" ? (topOpps.value?.results ?? []) : [],
    weeklyMetrics: weeklyMetrics.status === "fulfilled" ? weeklyMetrics.value : null,
    upcomingDeadlines: upcomingDeadlines.status === "fulfilled" ? upcomingDeadlines.value : [],
  };
}

export async function generateNarrative(data) {
  try {
    const { text } = await generateText({
      model: getModel("gemini-2.5-flash"),
      system:
        "You are a federal procurement intelligence assistant. Write concise, professional briefings for a government contracting team.",
      prompt: `Write a 3–4 sentence daily digest summary based on this procurement pipeline data. Highlight the most actionable signals — upcoming deadlines, strong new opportunities, or outreach activity that needs attention. Be specific and direct.\n\n${JSON.stringify(data, null, 2)}`,
    });
    return text;
  } catch {
    return null;
  }
}

function toISOWeek(date) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  const dow = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dow);
  const year = d.getUTCFullYear();
  const startOfYear = new Date(Date.UTC(year, 0, 1));
  const weekNum = Math.ceil(((d - startOfYear) / 86400000 + 1) / 7);
  return `${year}-W${String(weekNum).padStart(2, "0")}`;
}
