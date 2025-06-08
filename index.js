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

app.post("/api/generate", async (req, res) => {
  const { prompt } = req.body;
  const folderId = uuidv4();
  const outputPath = path.join(__dirname, "generated", folderId);
  fs.mkdirSync(outputPath, { recursive: true });

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a web development expert. Respond ONLY with JSON where keys are file paths and values are file content. No explanation or markdown.",
          },
          { role: "user", content: prompt },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const codeMap = JSON.parse(response.data.choices[0].message.content);

    for (const filePath in codeMap) {
      const fullPath = path.join(outputPath, filePath);
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, codeMap[filePath]);
    }

    const zip = new AdmZip();
    zip.addLocalFolder(outputPath);
    const zipPath = path.join(__dirname, "generated", `${folderId}.zip`);
    zip.writeZip(zipPath);

    // Instead of res.download(), send the URL for frontend to fetch
    res.json({ downloadUrl: `/download/${folderId}` });
  } catch (error) {
    console.error("Generation failed:", error.message);
    res.status(500).json({ error: "Failed to generate code" });
  }
});

// Serve ZIP files on /download/:id route
app.get("/download/:id", (req, res) => {
  const zipFile = path.join(__dirname, "generated", `${req.params.id}.zip`);
  if (fs.existsSync(zipFile)) {
    res.download(zipFile, "generated-code.zip", (err) => {
      if (!err) {
        // Delete after download
        fs.rmSync(path.join(__dirname, "generated", req.params.id), {
          recursive: true,
          force: true,
        });
        fs.unlinkSync(zipFile);
      }
    });
  } else {
    res.status(404).send("File not found");
  }
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
