import { Router } from "express";
import {
  generateSiteController,
  generateSiteStreamController,
  refineSiteController,
} from "../controllers/siteGenerationController.js";
import { downloadSiteController } from "../controllers/siteDownloadController.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorizeRole } from "../middleware/authorizeRole.js";
import { rateLimiter } from "../middleware/rateLimiter.js";
import {
  getAllSiteData,
  getUsersGeneratedSiteData,
  getSiteById,
  servePreviewFile,
} from "../controllers/siteDataController.js";

const router = Router();

// Rate limiter: 6 requests per 10 minutes to protect AI quota
const aiRateLimiter = rateLimiter(6, 10 * 60 * 1000);

// Real Server-Sent Events (SSE) Agentic Stream Route
router.post("/generate/stream", authenticate, aiRateLimiter, generateSiteStreamController);

// Standard Generation & Refinement Endpoints
router.post("/generate", authenticate, aiRateLimiter, generateSiteController);
router.post("/refine", authenticate, aiRateLimiter, refineSiteController);

// In-Memory Streaming Download
router.get("/download/:id", downloadSiteController);

// Live Dynamic Preview served directly from MongoDB
router.get("/preview/:id", servePreviewFile);
router.get("/preview/:id/:filename", servePreviewFile);

// Project Retrieval
router.get("/project/:id", getSiteById);
router.get("/my-sites", authenticate, getUsersGeneratedSiteData);
router.get(
  "/total-sites",
  authenticate,
  authorizeRole("admin"),
  getAllSiteData
);

export default router;
