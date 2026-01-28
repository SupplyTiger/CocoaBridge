import express from "express";
import { getCurrentOpportunitiesFromSam, getHistoricalOpportunitiesFromSam, getIndustryDayOpportunitiesFromSam} from "../controllers/sam.controller.js";

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

// PING endpoint for testing
router.get("/ping", (req, res) => {
  console.log("SAM PING HIT", req.body);
  return res.status(200).json({ ok: true, body: req.body });
});

/* 
  Endpoints to get opportunities from SAM.gov
*/
router.get("/opportunities/current", getCurrentOpportunitiesFromSam);

/*
  This endpoint fetches historical opportunities from SAM.gov
  It can be filtered by year, department, agency, etc.
*/
// get opportunities from SAM.gov by year, then get more specific with filters later
router.get("/opportunities/historical", getHistoricalOpportunitiesFromSam);

/*
  This endpoint fetches industry day opportunities from SAM.gov
  It filters opportunities based on predefined criteria in the matchesOpportunityIndustryDay function
*/
router.get("/opportunities/event", getIndustryDayOpportunitiesFromSam);



export default router;
