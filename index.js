// import express from "express";
// import cors from "cors";
// import dotenv from "dotenv";
// import fs from "fs";
// import path from "path";
// import { fileURLToPath } from "url";
// import { v4 as uuidv4 } from "uuid";
// import axios from "axios";
// import AdmZip from "adm-zip";

// dotenv.config();
// const app = express();
// const PORT = process.env.PORT || 3000;

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// app.use(cors());
// app.use(express.json());

// // Serve static files for preview
// app.use("/preview", express.static(path.join(__dirname, "generated")));

// // POST: Generate Site
// app.post("/api/generate", async (req, res) => {
//   const { prompt } = req.body;
//   const folderId = uuidv4();
//   const outputPath = path.join(__dirname, "generated", folderId);

//   fs.mkdirSync(outputPath, { recursive: true });

//   try {
//     const response = await axios.post(
//       "https://openrouter.ai/api/v1/chat/completions",
//       {
//         model: "openai/gpt-4o-mini",
//         messages: [
//           {
//             role: "system",
//             content:
//               "You are a web development expert. Respond ONLY with JSON where keys are file paths and values are file content. No explanation or markdown.",
//           },
//           { role: "user", content: prompt },
//         ],
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     const codeMap = JSON.parse(response.data.choices[0].message.content);

//     for (const filePath in codeMap) {
//       const fullPath = path.join(outputPath, filePath);
//       fs.mkdirSync(path.dirname(fullPath), { recursive: true });
//       fs.writeFileSync(fullPath, codeMap[filePath]);
//     }

//     res.json({
//       id: folderId,
//       previewUrl: `http://localhost:${PORT}/preview/${folderId}/index.html`,
//     });
//   } catch (error) {
//     console.error("Generation failed:", error.message);
//     res.status(500).json({ error: "Failed to generate site" });
//   }
// });

// // GET: Prepare ZIP & send download link
// app.get("/api/download/:id", (req, res) => {
//   const folderId = req.params.id;
//   const folderPath = path.join(__dirname, "generated", folderId);
//   const zipPath = path.join(__dirname, "generated", `${folderId}.zip`);

//   if (!fs.existsSync(folderPath)) {
//     return res.status(404).json({ error: "Project not found" });
//   }

//   const zip = new AdmZip();
//   zip.addLocalFolder(folderPath);
//   zip.writeZip(zipPath);

//   res.download(zipPath, "generated-site.zip", (err) => {
//     if (!err) {
//       fs.unlinkSync(zipPath);
//     } else {
//       console.error("Download failed:", err);
//     }
//   });
// });


// // Root
// app.get("/", (req, res) => {
//   res.send("🌐 Site Generator Server Running");
// });

// app.listen(PORT, () => {
//   console.log(`🚀 Server running at http://localhost:${PORT}`);
// });



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

// Use /tmp directory for Vercel compatibility
const isVercel = process.env.VERCEL || process.env.NOW_REGION;
const generatedDir = isVercel ? "/tmp/generated" : path.join(__dirname, "generated");

app.use(cors());
app.use(express.json());

// Serve static files for preview (only works locally)
if (!isVercel) {
  app.use("/preview", express.static(path.join(__dirname, "generated")));
}

// POST: Generate Site
app.post("/api/generate", async (req, res) => {
  const { prompt } = req.body;
  const folderId = uuidv4();
  const outputPath = path.join(generatedDir, folderId);

  // Ensure the generated directory exists
  fs.mkdirSync(generatedDir, { recursive: true });
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

    // For Vercel, return the files directly since preview won't work
    if (isVercel) {
      res.json({
        id: folderId,
        message: "Files generated successfully. Use download endpoint to get ZIP.",
        files: Object.keys(codeMap)
      });
    } else {
      res.json({
        id: folderId,
        previewUrl: `http://localhost:${PORT}/preview/${folderId}/index.html`,
      });
    }
  } catch (error) {
    console.error("Generation failed:", error.message);
    res.status(500).json({ error: "Failed to generate site" });
  }
});

// GET: Prepare ZIP & send download link
app.get("/api/download/:id", (req, res) => {
  const folderId = req.params.id;
  const folderPath = path.join(generatedDir, folderId);
  const zipPath = path.join(generatedDir, `${folderId}.zip`);

  if (!fs.existsSync(folderPath)) {
    return res.status(404).json({ error: "Project not found" });
  }

  try {
    const zip = new AdmZip();
    zip.addLocalFolder(folderPath);
    zip.writeZip(zipPath);

    // For Vercel, send the zip file directly
    if (isVercel) {
      const zipBuffer = fs.readFileSync(zipPath);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="generated-site.zip"');
      
      // Clean up files
      fs.unlinkSync(zipPath);
      fs.rmSync(folderPath, { recursive: true, force: true });
      
      res.send(zipBuffer);
    } else {
      res.download(zipPath, "generated-site.zip", (err) => {
        if (!err) {
          fs.unlinkSync(zipPath);
        } else {
          console.error("Download failed:", err);
        }
      });
    }
  } catch (error) {
    console.error("ZIP creation failed:", error);
    res.status(500).json({ error: "Failed to create ZIP file" });
  }
});

// Root
app.get("/", (req, res) => {
  res.send("🌐 Site Generator Server Running");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});