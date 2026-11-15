import SiteProject from "../models/SiteProject.js";
import { generateInMemoryZip } from "../services/fileManagementService.js";

export const downloadSiteController = async (req, res, next) => {
  const { id } = req.params;

  try {
    const site = await SiteProject.findById(id);

    if (!site || !site.activeFiles || site.activeFiles.length === 0) {
      return res.status(404).json({ error: "Project not found or contains no files" });
    }

    // Generate ZIP archive purely in memory
    const zipBuffer = generateInMemoryZip(site.activeFiles);

    // Sanitize title for filename
    const sanitizedTitle = (site.title || "generated-site")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 50);

    // Increment download metrics asynchronously
    SiteProject.findByIdAndUpdate(id, { $inc: { downloadCount: 1 } }).catch(() => {});

    res.set({
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${sanitizedTitle}.zip"`,
      "Content-Length": zipBuffer.length,
    });

    return res.send(zipBuffer);
  } catch (error) {
    console.error("ZIP download failed:", error);
    next(error);
  }
};
