import User from "../models/User.js";
import SiteProject from "../models/SiteProject.js";
import SitesGenerationData from "../models/SitesGenerationData.js";

export const getStats = async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const siteProjectsCount = await SiteProject.countDocuments();
    const legacySiteCount = await SitesGenerationData.countDocuments().catch(() => 0);

    res.status(200).json({
      totalUsers: userCount,
      totalGeneratedSites: siteProjectsCount + legacySiteCount,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch stats",
      error: error.message,
    });
  }
};
