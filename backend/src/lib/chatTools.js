import { tool } from "ai";
import { z } from "zod";
import { callMcpTool } from "./mcpClient.js";

export const chatTools = {
  search_opportunities: tool({
    description:
      "Find procurement opportunities by keyword, type, NAICS, PSC, state, or active status",
    parameters: z.object({
      keyword: z.string().optional().describe("Searches title + description"),
      type: z
        .enum(["PRE_SOLICITATION", "AWARD_NOTICE", "SOURCES_SOUGHT", "SPECIAL_NOTICE", "SOLICITATION", "OTHER"])
        .optional()
        .describe("Opportunity type"),
      naics: z.string().optional().describe("Match against naicsCodes array"),
      psc: z.string().optional().describe("Match pscCode"),
      state: z.string().optional().describe("Match state field"),
      active: z.boolean().optional().describe("Filter by active status"),
      limit: z.number().optional().describe("Max results (default 20, max 50)"),
      offset: z.number().optional().describe("Pagination offset"),
    }),
    execute: (args) => callMcpTool("search_opportunities", args),
  }),

  get_opportunity: tool({
    description:
      "Retrieve full details of a single procurement opportunity by ID",
    parameters: z.object({
      id: z.string().describe("Opportunity ID"),
    }),
    execute: (args) => callMcpTool("get_opportunity", args),
  }),

  
  search_awards: tool({
    description:
      "Search federal contract awards by keyword, NAICS, PSC, recipient, buying org, or amount range",
    parameters: z.object({
      keyword: z.string().optional().describe("Searches description"),
      naics: z.string().optional().describe("Match against naicsCodes array"),
      psc: z.string().optional().describe("Match pscCode"),
      recipientId: z.string().optional().describe("Filter by recipient ID"),
      buyingOrgId: z.string().optional().describe("Filter by buying organization ID"),
      minAmount: z.number().optional().describe("Minimum obligatedAmount"),
      maxAmount: z.number().optional().describe("Maximum obligatedAmount"),
      limit: z.number().optional().describe("Max results (default 20, max 50)"),
      offset: z.number().optional().describe("Pagination offset"),
    }),
    execute: (args) => callMcpTool("search_awards", args),
  }),

  get_award: tool({
    description:
      "Retrieve full details of a single federal contract award by ID",
    parameters: z.object({
      id: z.string().describe("Award ID"),
    }),
    execute: (args) => callMcpTool("get_award", args),
  }),

  search_buying_orgs: tool({
    description: "Search government buying organizations by name or hierarchy level",
    parameters: z.object({
      name: z.string().optional().describe("Case-insensitive match on name"),
      level: z
        .enum(["AGENCY", "SUBAGENCY", "OFFICE", "OTHER"])
        .optional()
        .describe("Organization level"),
      limit: z.number().optional().describe("Max results (default 20, max 50)"),
      offset: z.number().optional().describe("Pagination offset"),
    }),
    execute: (args) => callMcpTool("search_buying_orgs", args),
  }),

  get_buying_org: tool({
    description:
      "Get full details of a buying organization including parent, children, and counts",
    parameters: z.object({
      id: z.string().describe("BuyingOrganization ID"),
    }),
    execute: (args) => callMcpTool("get_buying_org", args),
  }),

  search_recipients: tool({
    description: "Find award recipients (prime contractors) by name or UEI",
    parameters: z.object({
      name: z.string().optional().describe("Case-insensitive match on name"),
      uei: z.string().optional().describe("Exact match on UEI"),
      limit: z.number().optional().describe("Max results (default 20, max 50)"),
      offset: z.number().optional().describe("Pagination offset"),
    }),
    execute: (args) => callMcpTool("search_recipients", args),
  }),

  search_contacts: tool({
    description:
      "Find contacts linked to opportunities, buying organizations, or industry days",
    parameters: z.object({
      keyword: z.string().optional().describe("Searches linked opportunity/industry day text"),
      opportunityId: z.string().optional().describe("Filter by opportunity"),
      buyingOrgId: z.string().optional().describe("Filter by buying org"),
      limit: z.number().optional().describe("Max results (default 20, max 50)"),
      offset: z.number().optional().describe("Pagination offset"),
    }),
    execute: (args) => callMcpTool("search_contacts", args),
  }),

  score_opportunity: tool({
    description:
      "Score a procurement opportunity against SupplyTiger's company profile. Returns HIGH/MEDIUM/LOW fit.",
    parameters: z.object({
      id: z.string().describe("Opportunity ID to score"),
    }),
    execute: (args) => callMcpTool("score_opportunity", args),
  }),

  get_analytics_summary: tool({
    description:
      "Get high-level procurement database summary: totals, top agencies, recent opportunities",
    parameters: z.object({}),
    execute: () => callMcpTool("get_analytics_summary", {}),
  }),

  get_intelligence_summary: tool({
    description:
      "Deep procurement intelligence for a NAICS code, PSC code, or buying org. Returns incumbents, spend, and active opportunities.",
    parameters: z.object({
      naics: z.string().optional().describe("NAICS code to analyze"),
      psc: z.string().optional().describe("PSC code to analyze"),
      buyingOrgId: z.string().optional().describe("Buying organization ID to analyze"),
    }),
    execute: (args) => callMcpTool("get_intelligence_summary", args),
  }),
};
