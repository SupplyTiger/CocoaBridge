import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import prisma from "./db.js";

const COMPANY_PROFILE = {
  legalName: "Prime Printer Solution Inc",
  dba: "SupplyTiger",
  uei: "REMMPZ6DUJ88",
  cageCode: "4Z7K1",
  samStatus: "Active",
  gsaSchedule: "In progress",
  established: 2006,
  businessType: "S Corporation",
  naicsCodes: [
    { code: "424450", description: "Confectionery Merchant Wholesalers" },
    { code: "424410", description: "General Line Grocery Merchant Wholesalers" },
    { code: "424490", description: "Other Grocery And Related Products Merchant Wholesalers" },
  ],
  pscCodes: [
    { code: "8925", description: "Sugar, Confectionery, And Nuts" },
    { code: "8950", description: "Condiments and Related Products" },
  ],
  acquisitionPaths: ["MICROPURCHASE", "GSA", "SUBCONTRACTING"],
  coreCompetencies: [
    "Climate-controlled chocolate fulfillment",
    "Bulk distribution of food products (candy, chocolate, spice sets)",
    "Fulfillment & eCommerce expertise (Amazon, Walmart, B2B)",
  ],
  contact: {
    name: "Ryan Spahr, CEO",
    phone: "610-400-8127",
    email: "gov@primeprinter.net",
    website: "www.supplytiger.fun",
    address: "1595 South Mount Joy Street, Suite 002, Elizabethtown PA 17022",
  },
};

export function registerResources(server) {
  // --- Static resource: company profile ---
  server.resource(
    "company-profile",
    "supplytiger://company/profile",
    { description: "SupplyTiger capability statement — UEI, CAGE, NAICS, PSC, core competencies, and contact info" },
    async () => ({
      contents: [
        {
          uri: "supplytiger://company/profile",
          mimeType: "application/json",
          text: JSON.stringify(COMPANY_PROFILE, null, 2),
        },
      ],
    }),
  );

  // --- Resource template: opportunity detail ---
  server.resource(
    "opportunity-detail",
    new ResourceTemplate("procurement://opportunities/{id}", { list: undefined }),
    { description: "Full opportunity record by ID" },
    async (uri, { id }) => {
      const opportunity = await prisma.opportunity.findUnique({
        where: { id },
        include: {
          buyingOrganization: { select: { id: true, name: true, level: true } },
          _count: { select: { awards: true, contactLinks: true } },
        },
      });
      if (!opportunity) {
        throw new Error(`Opportunity ${id} not found`);
      }
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(opportunity, null, 2),
          },
        ],
      };
    },
  );

  // --- Resource template: award detail ---
  server.resource(
    "award-detail",
    new ResourceTemplate("procurement://awards/{id}", { list: undefined }),
    { description: "Full award record by ID" },
    async (uri, { id }) => {
      const award = await prisma.award.findUnique({
        where: { id },
        include: {
          recipient: { select: { name: true, uei: true } },
          buyingOrganization: { select: { name: true, level: true } },
          opportunity: { select: { title: true } },
        },
      });
      if (!award) {
        throw new Error(`Award ${id} not found`);
      }
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(award, null, 2),
          },
        ],
      };
    },
  );
}
