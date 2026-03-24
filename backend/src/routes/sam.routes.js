import express from "express";
import {
  backfillNullOpportunityDescriptionsFromSam,
  backfillOpportunityAttachments,
  getIndustryDayOpportunitiesFromSam,
  getOpportunityDescriptionFromSam,
  syncCurrentOpportunitiesFromSam,
} from "../controllers/sam.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

// Fields of interest:
/**
 * Total Records:
 * Notice Id:
 * Limit:
 * Title:
 * type:
 * baseType:
 * Solicitation Number:
 * Department:
 * Subtier:
 * Office:
 * postedDate:
 * rtpe:
 * responseDeadline:
 * naicsCode:
 * Classification Code:
 * active: true/false
 * data.award,
 * data.award.awardee
 * pointofcontact
 * description
 * organizationType
 * officeAddress
 * placeOfPerformance
 * links
 */
const router = express.Router();

router.get("/opportunities/current/sync", protectRoute, syncCurrentOpportunitiesFromSam);

/*
  This endpoint fetches historical opportunities from SAM.gov
  It can be filtered by year, department, agency, etc.
*/

/*
  This endpoint fetches industry day opportunities from SAM.gov
  It filters opportunities based on predefined criteria in the matchesOpportunityIndustryDay function
*/
router.get("/opportunities/event", protectRoute, getIndustryDayOpportunitiesFromSam);

router.get(
  "/opportunities/description/backfill", protectRoute,
  backfillNullOpportunityDescriptionsFromSam,
);

router.get(
  "/opportunities/attachments/backfill", protectRoute,
  backfillOpportunityAttachments,
);

/*
  This endpoint fetches the detailed description for a specific opportunity from SAM.gov
  Query parameter: cache=true to save description to database
*/
router.get("/opportunities/:noticeId/description", protectRoute, getOpportunityDescriptionFromSam);

export default router;
