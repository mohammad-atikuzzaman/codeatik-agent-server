import User from "../models/User.js"
import SitesGenerationData from "../models/SitesGenerationData.js"

export const getStats = async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const siteCount = await SitesGenerationData.countDocuments();

    res.status(200).json({
      totalUsers: userCount,
      totalGeneratedSites: siteCount,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch stats", error: error.message });
  }
};
