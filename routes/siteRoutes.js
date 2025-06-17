import { Router } from "express";
import { generateSiteController } from "../controllers/siteGenerationController.js";
import { downloadSiteController } from "../controllers/siteDownloadController.js";
import { authenticate } from "../middleware/authenticate.js";
import SitesGenerationData from "../models/SitesGenerationData.js";

const router = Router();

router.post("/generate", authenticate, generateSiteController);
router.get("/download/:id", downloadSiteController);

router.get("/total-sites", async (req, res) => {
  const sites = await SitesGenerationData.find();
  res.json(sites);
});
router.get("/my-sites", authenticate, async (req, res) => {
  const sites = await SitesGenerationData.find({ email: req.user.email });
  res.json(sites);
});

export default router;
