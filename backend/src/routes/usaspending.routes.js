import express from "express";
import {
  searchCountFromUsaspending,
  searchAwardFromUsaspending,
  syncAwardsFromUsaspending,
} from "../controllers/usaspending.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// Endpoint A: /api/v2/search/spending_by_award/
/*
 * POST /api/usaspending/search-award
 * Body is passed directly to USAspending Advanced Search
 *
 * Example body:
{
    "filters": {
      "time_period": [
        {
          "start_date": "2007-10-01",
          "end_date": "2026-09-30"
        }
      ],
      "award_type_codes": [
        "A",
        "B",
        "C"
      ],
      "naics_codes": [
        "424450", "424490"
      ],
      "psc_codes": {
        "require": [
          [
            "Product",
            "89",
            "8925"
          ]
        ]
      }
    },
    "page": 1,
    "limit": 100,
    "sort": "End Date",
    "order": "desc",
    "auditTrail": "Results Table - Spending by award search",
    "fields": [
      "Award ID",
      "Recipient Name",
      "Award Amount",
      "Description",
      "Contract Award Type",
      "Recipient UEI",
      "Recipient Location",
      "Primary Place of Performance",
      "def_codes",
      "Awarding Agency",
      "Awarding Sub Agency",
      "Start Date",
      "End Date",
      "NAICS",
      "PSC",
      "recipient_id",
      "prime_award_recipient_id"
    ],
    "spending_level": "awards"
  }
*/
router.post("/search-award", protectRoute, searchAwardFromUsaspending);

// Endpoint B: /api/v2/search/spending_by_award_count/
/*
 * POST /api/usaspending/search-count
 * /
 * Example Body:
 * {
 *   "filters": {
 *     "time_period": [
 *       { "start_date": "2007-10-01", "end_date": "2026-09-30" }
 *     ],
 *     "naics_codes": ["424450", "424490"],
 *     "psc_codes": ["8925"],
 *     "award_type_codes": ["A", "B", "C"] // optional
 *   },
 *   "spending_level": "awards" // optional; defaults to awards
 * }
 *
 */
router.post("/search-count", protectRoute, searchCountFromUsaspending);

// Endpoint C: Sync Awards to Database
/**
 * POST /api/usaspending/sync-awards
 *
 * Fetches awards from USASpending and upserts them to the database.
 * Uses the same filter schema as /search-award.
 *
 * Additional params:
 * - syncAll: boolean - If true, paginates through all results
 * - limit: number - Page size (default 100)
 * - page: number - Starting page (default 1)
 *
 * Example body:
 * {
 *   "syncAll": false,
 *   "limit": 50,
 *   "filters": {
 *     "time_period": [{ "start_date": "2024-01-01", "end_date": "2025-01-31" }],
 *     "naics_codes": ["424450"]
 *   },
 *   "fields": [
 *     "Award ID", "Recipient Name", "Award Amount", "Description",
 *     "Contract Award Type", "Recipient UEI", "Recipient Location",
 *     "Primary Place of Performance", "Awarding Agency", "Awarding Sub Agency",
 *     "Start Date", "End Date", "NAICS", "PSC", "recipient_id",
 *     "awarding_agency_id", "generated_internal_id"
 *   ],
 *   "spending_level": "awards"
 * }
 */
router.post("/sync-awards", protectRoute, syncAwardsFromUsaspending);

export default router;
