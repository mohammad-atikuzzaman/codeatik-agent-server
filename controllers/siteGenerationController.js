import SiteProject from "../models/SiteProject.js";
import {
  generateSite,
  planArchitecture,
  synthesizeCode,
} from "../services/aiGenerationService.js";
import { getMimeType } from "../services/fileManagementService.js";

/**
 * Convert file dictionary { "index.html": "..." } to SiteProject files array
 */
const formatFilesArray = (filesDict) => {
  return Object.entries(filesDict).map(([name, content]) => ({
    name,
    content: typeof content === "string" ? content : "",
    mimeType: getMimeType(name),
    sizeBytes: Buffer.byteLength(content || "", "utf-8"),
  }));
};

/**
 * Real Server-Sent Events (SSE) Stream Controller
 * Streams real-time agentic pipeline stages to the client.
 */
export const generateSiteStreamController = async (req, res) => {
  const { prompt } = req.body;
  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return res.status(400).json({ error: "A valid prompt is required" });
  }

  // Set SSE Headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  if (typeof res.flushHeaders === "function") {
    res.flushHeaders();
  }

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    if (typeof res.flush === "function") {
      res.flush();
    }
  };

  try {
    // Stage 1: Chief UX/UI Architect Agent
    sendEvent("stage", {
      stage: "architect",
      step: 1,
      totalSteps: 3,
      message: "Chief Architect Agent: Analyzing intent & formulating UX blueprint...",
    });

    const blueprint = await planArchitecture(prompt.trim());

    // Stream blueprint to client immediately so UI shows planned theme & palette
    sendEvent("blueprint", blueprint);

    // Stage 2: Lead Frontend Synthesizer Agent
    sendEvent("stage", {
      stage: "synthesizer",
      step: 2,
      totalSteps: 3,
      message: `Lead Engineer Agent: Synthesizing "${blueprint.title}" (HTML5, Tailwind CSS, ES6 JS)...`,
    });

    const synthesized = await synthesizeCode(prompt.trim(), blueprint);

    // Stage 3: QA & Database Persistence Agent
    sendEvent("stage", {
      stage: "qa",
      step: 3,
      totalSteps: 3,
      message: "QA Agent: Verifying assets, injecting Google Fonts & persisting to database...",
    });

    const filesArray = formatFilesArray(synthesized.files);

    const site = await SiteProject.create({
      userId: req.user?.id || req.user?._id,
      email: req.user?.email || "anonymous@codeatik.com",
      title: blueprint.title || synthesized.title || "Generated Website",
      initialPrompt: prompt.trim(),
      blueprint,
      activeFiles: filesArray,
      revisions: [
        {
          revisionNumber: 1,
          prompt: prompt.trim(),
          files: filesArray,
        },
      ],
    });

    // Send complete event with full site payload
    sendEvent("complete", {
      id: site._id,
      title: site.title,
      blueprint: site.blueprint,
      previewUrl: `${process.env.API_URL || ""}/api/preview/${site._id}/index.html`,
      files: synthesized.files,
      createdAt: site.createdAt,
    });

    res.end();
  } catch (error) {
    console.error("Stream generation error:", error);
    sendEvent("error", {
      error: error.message || "Failed to generate website in stream",
    });
    res.end();
  }
};

/**
 * Handle initial site generation via standard JSON endpoint
 */
export const generateSiteController = async (req, res, next) => {
  const { prompt } = req.body;
  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return res.status(400).json({ error: "A valid prompt is required" });
  }

  try {
    const aiResult = await generateSite(prompt.trim());
    const filesArray = formatFilesArray(aiResult.files);

    const site = await SiteProject.create({
      userId: req.user?.id || req.user?._id,
      email: req.user?.email || "anonymous@codeatik.com",
      title: aiResult.title || "Generated Website",
      initialPrompt: prompt.trim(),
      blueprint: aiResult.blueprint,
      activeFiles: filesArray,
      revisions: [
        {
          revisionNumber: 1,
          prompt: prompt.trim(),
          files: filesArray,
        },
      ],
    });

    res.status(201).json({
      id: site._id,
      title: site.title,
      blueprint: site.blueprint,
      previewUrl: `${process.env.API_URL || ""}/api/preview/${site._id}/index.html`,
      files: aiResult.files,
      createdAt: site.createdAt,
    });
  } catch (error) {
    console.error("Agentic site generation failed:", error);
    next(error);
  }
};

/**
 * Handle iterative refinement on an existing site
 */
export const refineSiteController = async (req, res, next) => {
  const { projectId, prompt } = req.body;
  if (!projectId || !prompt || typeof prompt !== "string" || !prompt.trim()) {
    return res.status(400).json({ error: "projectId and refinement prompt are required" });
  }

  try {
    const site = await SiteProject.findById(projectId);
    if (!site) {
      return res.status(404).json({ error: "Project not found" });
    }

    if (site.email !== req.user?.email && req.user?.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized access to project" });
    }

    const previousFiles = {};
    for (const f of site.activeFiles) {
      previousFiles[f.name] = f.content;
    }

    const aiResult = await generateSite(prompt.trim(), previousFiles, site.blueprint);
    const updatedFilesArray = formatFilesArray(aiResult.files);

    const nextRevisionNumber = (site.revisions?.length || 0) + 1;
    site.activeFiles = updatedFilesArray;
    site.title = aiResult.title || site.title;
    site.revisions.push({
      revisionNumber: nextRevisionNumber,
      prompt: prompt.trim(),
      files: updatedFilesArray,
    });
    site.updatedAt = new Date();
    await site.save();

    res.status(200).json({
      id: site._id,
      title: site.title,
      blueprint: site.blueprint,
      revision: nextRevisionNumber,
      previewUrl: `${process.env.API_URL || ""}/api/preview/${site._id}/index.html`,
      files: aiResult.files,
      updatedAt: site.updatedAt,
    });
  } catch (error) {
    console.error("Site refinement failed:", error);
    next(error);
  }
};
