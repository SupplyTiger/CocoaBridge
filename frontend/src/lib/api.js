import axiosInstance from "./axios.js";

// API functions to interact with the backend
export const dbApi = {
  // InboxItems
  listInboxItems: (params) => axiosInstance.get("/db/inbox-items", { params }),
  getInboxItem: (id) => axiosInstance.get(`/db/inbox-items/${id}`),
  updateInboxItem: (id, data) => axiosInstance.patch(`/db/inbox-items/${id}`, data),
  deleteInboxItem: (id) => axiosInstance.delete(`/db/inbox-items/${id}`),
  // Opportunities
  listOpportunities: (params) => axiosInstance.get("/db/opportunities", { params }),
  getOpportunity: (id) => axiosInstance.get(`/db/opportunities/${id}`),
  // Awards
  listAwards: (params) => axiosInstance.get("/db/awards", { params }),
  getAward: (id) => axiosInstance.get(`/db/awards/${id}`),
  // Industry Days
  listIndustryDays: (params) => axiosInstance.get("/db/industry-days", { params }),
  getIndustryDay: (id) => axiosInstance.get(`/db/industry-days/${id}`),
  updateIndustryDay: (id, data) => axiosInstance.patch(`/db/industry-days/${id}`, data),
  // Buying Orgs
  listBuyingOrgs: (params) => axiosInstance.get("/db/buying-orgs", { params }),
  getBuyingOrg: (id) => axiosInstance.get(`/db/buying-orgs/${id}`),
};
