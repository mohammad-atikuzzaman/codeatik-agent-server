import SiteModel from "../models/siteModel.js";
import { generateSite } from "../services/aiGenerationService.js";

export const generateSiteController = async (req, res, next) => {
  const { prompt } = req.body;
  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "Invalid prompt provided" });
  }

  try {
    const generatedFiles = await generateSite(prompt);
    const site = await SiteModel.createSite(generatedFiles);

    res.json({
      id: site.id,
      previewUrl: `${process.env.API_URL}/preview/${
        site.id
      }/index.html`,
    });
  } catch (error) {
    next(error);
  }
};
