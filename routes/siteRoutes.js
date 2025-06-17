import { Router } from "express";
import { generateSiteController } from "../controllers/siteGenerationController.js";
import { downloadSiteController } from "../controllers/siteDownloadController.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorizeRole } from "../middleware/authorizeRole.js";
import {
  getAllSiteData,
  getUsersGeneratedSiteData,
} from "../controllers/siteDataController.js";

const router = Router();

router.post("/generate", authenticate, generateSiteController);
router.get("/download/:id", downloadSiteController);

router.get(
  "/total-sites",
  authenticate,
  authorizeRole("admin"),
  getAllSiteData
);
router.get("/my-sites", authenticate, getUsersGeneratedSiteData);

export default router;
