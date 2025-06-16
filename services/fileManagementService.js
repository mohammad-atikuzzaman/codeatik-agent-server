import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";
import serverConfig from "../config/serverConfig.js";

export const saveGeneratedFiles = async (id, files) => {
  const outputPath = path.join(serverConfig.GENERATED_SITES_DIR, id);

  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }

  for (const [filePath, content] of Object.entries(files)) {
    const fullPath = path.join(outputPath, filePath);
    const dir = path.dirname(fullPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(fullPath, content);
  }

  return outputPath;
};

export const createZipArchive = async (site) => {
  const zipPath = path.join(serverConfig.GENERATED_SITES_DIR, `${site.id}.zip`);
  const zip = new AdmZip();

  zip.addLocalFolder(site.path);
  zip.writeZip(zipPath);

  return zipPath;
};

export const cleanupZip = (siteId) => {
  const zipPath = path.join(serverConfig.GENERATED_SITES_DIR, `${siteId}.zip`);

  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
  }
};
