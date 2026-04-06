// Single source of truth for SupplyTiger's company profile.
// Used by resources.js (MCP resource) and tools/scoring.js (opportunity scoring).

import prisma from "../db.js";

/**
 * Load the company profile from AppConfig at runtime.
 * Falls back to the hardcoded COMPANY_PROFILE constant if no DB record exists.
 */
export async function loadCompanyProfileFromDb() {
  try {
    const row = await prisma.appConfig.findUnique({ where: { key: "companyProfile" } });
    if (row?.values?.[0]) {
      return JSON.parse(row.values[0]);
    }
  } catch {
    // parse error or DB failure — fall through to hardcoded constant
  }
  return COMPANY_PROFILE;
}

export const COMPANY_PROFILE = {
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

// Convenience: flat arrays of just the code strings
export const COMPANY_NAICS_CODES = COMPANY_PROFILE.naicsCodes.map((n) => n.code);
export const COMPANY_PSC_CODES = COMPANY_PROFILE.pscCodes.map((p) => p.code);
