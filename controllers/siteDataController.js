import SitesGenerationData from "../models/SitesGenerationData.js";

export const getUsersGeneratedSiteData = async (req, res) => {
  const sites = await SitesGenerationData.find({ email: req.user.email });
  res.json(sites);
};

export const getAllSiteData = async (req, res) => {
  const sites = await SitesGenerationData.find();
  res.json(sites);
};
