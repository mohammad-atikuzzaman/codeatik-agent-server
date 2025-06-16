import { Router } from "express";
import { generateSiteController } from "../controllers/siteGenerationController.js";
import { downloadSiteController } from "../controllers/siteDownloadController.js";

const router = Router();

router.post("/generate", generateSiteController);
router.get("/download/:id", downloadSiteController);

export default router;
