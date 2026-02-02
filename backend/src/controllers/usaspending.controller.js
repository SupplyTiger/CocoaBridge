import axios from "axios";
import { ENV } from "../config/env.js";

// TODO: Pagination params?
// TODO: Error handling? and fix count response structure?
export const searchAwardFromUsaspending = async (req, res) => {
  try {
    const response = await axios.post(
      `${ENV.USASPENDING_BASE_URL}/api/v2/search/spending_by_award/`,
      {
        ...req.body,
        limit: req.body.limit ?? 100,
        page: req.body.page ?? 1,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 20000,
      },
    );

    return res.status(200).json({
      count: response.data.page_metadata?.total || 0,
      data: response.data.results,
    });
    
  } catch (error) {
    console.error(
      "Error in searchAwardFromUsaspending controller:",
      error?.response?.data || error,
    );

    res.status(500).json({
      error: "Failed to fetch data from USAspending",
      details: error?.response?.data,
    });
  }
};

export const searchCountFromUsaspending = async (req, res) => {
  try {
    const response = await axios.post(
      `${ENV.USASPENDING_BASE_URL}/api/v2/search/spending_by_award_count/`,
      { ...req.body },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 20000,
      },
    );
    return res.status(200).json({ data: response.data });
  } catch (error) {
    console.error(
      "Error in searchCountFromUsaspending controller:",
      error?.response?.data || error,
    );
    res.status(500).json({
      error: "Failed to fetch data from USAspending",
      details: error?.response?.data,
    });
  }
};

export const searchCategoryFromUsaspending = async (req, res) => {
  try {
    const category = req.body.category;
    const url = `${ENV.USASPENDING_BASE_URL}/api/v2/search/spending_by_category/${category}/`;

    // remove category from payload since using category-in-path
    const { category: _omit, ...payload } = req.body;

    const response = await axios.post(
      url,
      { ...payload, limit: req.body.limit ?? 100, page: req.body.page ?? 1 },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 20000,
      },
    );
    return res.status(200).json({ data: response.data });
  } 
 catch (error) {
    console.error("Error in searchCategoryFromUsaspending controller:", error?.response?.data || error);
    res.status(500).json({
      error: "Failed to fetch data from USAspending",
      details: error?.response?.data,
    });
  }
};

export const getAwardByIdFromUsaspending = async (req, res) => {
  try {
    const { award_id } = req.params;
    const response = await axios.get(
      `${ENV.USASPENDING_BASE_URL}/api/v2/awards/${award_id}/`,
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 20000,
      },
    );
    return res.status(200).json({ data: response.data });
  } catch (error) {
    console.error(
      "Error in getAwardByIdFromUSAspending controller:",
      error?.response?.data || error,
    );
    res.status(500).json({
      error: "Failed to fetch data from USAspending",
      details: error?.response?.data,
    });
  }
};