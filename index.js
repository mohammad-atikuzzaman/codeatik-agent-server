import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import AdmZip from "adm-zip";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

// Serve static files for preview
app.use("/preview", express.static(path.join(__dirname, "generated")));

// POST: Generate Site
app.post("/api/generate", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "Invalid prompt provided" });
  }

  const folderId = uuidv4();
  const outputPath = path.join(__dirname, "generated", folderId);

  try {
    fs.mkdirSync(outputPath, { recursive: true });

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "deepseek/deepseek-r1:free",
        messages: [
          {
            role: "user",
            content: `
You are an expert frontend engineer. Generate a static website using ONLY HTML, CSS, and JavaScript.

SPECIFIC INSTRUCTIONS:
1. Use Tailwind CSS ONLY if explicitly requested in the prompt
2. ABSOLUTELY NO React, Next.js, Angular, Vue, Bootstrap or other frameworks
3. Return PURE VALID JSON - no markdown, no explanations
4. JSON structure: { "filename": "file content" }
5. Escape ALL special characters in strings (quotes, newlines, etc.)
6. Ensure ALL strings are properly quoted and terminated
7. Do NOT include any text outside the JSON object

EXAMPLE FORMAT:
{
  "index.html": "<!DOCTYPE html>\\n<html>...</html>",
  "styles.css": "body { background: #fff; }"
}

USER PROMPT: ${prompt}
          `.trim(),
          },
        ],
        temperature: 0.2,
        max_tokens: 4000,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    if (!response.data.choices?.[0]?.message?.content) {
      throw new Error("Empty response from AI model");
    }

    if (response.data.choices[0].finish_reason === "length") {
      console.warn("Response truncated due to token limit");
    }

    let rawContent = response.data.choices[0].message.content;
    console.log("Raw AI response:", rawContent.substring(0, 500) + "...");

    // Enhanced cleaning
    rawContent = rawContent
      .replace(/^[\s]*```(?:json)?/gm, "") // Remove starting code blocks
      .replace(/```[\s]*$/gm, "") // Remove ending code blocks
      .trim();

    // Robust JSON parsing with fallback
    let codeMap;
    try {
      codeMap = JSON.parse(rawContent);
    } catch (parseError) {
      console.error(
        "Initial JSON parse failed. Attempting fixes...",
        parseError
      );

      // Try fixing common issues
      try {
        // Fix 1: Remove any text outside of {}
        const jsonStart = rawContent.indexOf("{");
        const jsonEnd = rawContent.lastIndexOf("}") + 1;
        if (jsonStart === -1 || jsonEnd === -1) {
          throw new Error("No JSON structure found in response");
        }
        const jsonString = rawContent.substring(jsonStart, jsonEnd);

        // Fix 2: Handle common JSON issues
        const fixedContent = jsonString
          .replace(/(['"])?([a-zA-Z0-9_\-]+)(['"])?:/g, '"$2":') // Fix unquoted keys
          .replace(/'/g, '"') // Replace single quotes
          .replace(/,\s*([}\]])/g, "$1") // Remove trailing commas
          .replace(/\\\//g, "/") // Fix escaped forward slashes
          .replace(/\\n/g, "\n") // Fix newline characters
          .replace(/\\t/g, "  ") // Fix tabs
          .replace(/\\\\/g, "\\"); // Fix double backslashes

        console.log(
          "Fixed JSON content:",
          fixedContent.substring(0, 500) + "..."
        );
        codeMap = JSON.parse(fixedContent);
      } catch (finalError) {
        console.error("Final JSON parse error:", finalError.message);
        console.error(
          "Problematic content snippet:",
          rawContent.substring(0, 1000)
        );
        throw new Error(`JSON parse failed: ${finalError.message}`);
      }
    }

    // Validate codeMap structure
    if (
      typeof codeMap !== "object" ||
      codeMap === null ||
      Array.isArray(codeMap)
    ) {
      throw new Error(
        "Invalid code structure - expected object with file paths"
      );
    }

    // Write files
    for (const [filePath, content] of Object.entries(codeMap)) {
      if (typeof content !== "string") {
        console.warn(`Skipping non-string content for file: ${filePath}`);
        continue;
      }

      const fullPath = path.join(outputPath, filePath);
      const dir = path.dirname(fullPath);

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(fullPath, content);
      console.log(`Created: ${filePath}`);
    }

    res.json({
      id: folderId,
      previewUrl: `https://codeatik-agent-server.onrender.com/preview/${folderId}/index.html`,
      // previewUrl: `${req.protocol}://${req.get("host")}/preview/${folderId}/index.html`,
    });
  } catch (error) {
    console.error("Generation failed:", {
      message: error.message,
      stack: error.stack,
      response: error.response?.data
        ? JSON.stringify(error.response.data, null, 2)
        : "N/A",
    });

    // Clean up failed generation directory
    if (fs.existsSync(outputPath)) {
      fs.rmSync(outputPath, { recursive: true, force: true });
    }

    res.status(500).json({
      error: "Failed to generate site",
      details: error.message,
    });
  }
});

// GET: Prepare ZIP & send download link
app.get("/api/download/:id", (req, res) => {
  const folderId = req.params.id;
  const folderPath = path.join(__dirname, "generated", folderId);
  const zipPath = path.join(__dirname, "generated", `${folderId}.zip`);

  if (!fs.existsSync(folderPath)) {
    return res.status(404).json({ error: "Project not found" });
  }

  try {
    const zip = new AdmZip();
    zip.addLocalFolder(folderPath);
    zip.writeZip(zipPath);

    res.download(zipPath, "generated-site.zip", (err) => {
      if (err) {
        console.error("Download failed:", err);
        res.status(500).json({ error: "Download failed" });
      }

      // Clean up ZIP file after download
      if (fs.existsSync(zipPath)) {
        fs.unlinkSync(zipPath);
      }
    });
  } catch (error) {
    console.error("ZIP creation failed:", error);
    res.status(500).json({ error: "Failed to create download package" });
  }
});

// Root
app.get("/", (req, res) => {
  res.send("🌐 Site Generator Server Running");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
