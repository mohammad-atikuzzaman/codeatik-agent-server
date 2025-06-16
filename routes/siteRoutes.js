import { Router } from "express";
import { generateSiteController } from "../controllers/siteGenerationController.js";
import { downloadSiteController } from "../controllers/siteDownloadController.js";

const router = Router();

router.post("/generate", generateSiteController);
router.get("/download/:id", downloadSiteController);

// Root route
router.get("/", (req, res) => {
  res.send("🌐 Site Generator Server Running");
});

export default router;
