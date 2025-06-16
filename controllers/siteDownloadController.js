// import SiteModel from "../models/siteModel.js";
import SiteModel from "../models/siteModel.js";
import { cleanupZip, createZipArchive } from "../services/fileManagementService.js";

export const downloadSiteController = async (req, res, next) => {
  const { id } = req.params;

  try {
    const site = await SiteModel.getSite(id);

    if (!site) {
      return res.status(404).json({ error: "Project not found" });
    }

    const zipPath = await createZipArchive(site);

    res.download(zipPath, "generated-site.zip", (err) => {
      if (err) {
        next(err);
      }
      cleanupZip(id);
    });
  } catch (error) {
    next(error);
  }
};
