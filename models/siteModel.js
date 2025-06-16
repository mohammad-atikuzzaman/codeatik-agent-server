import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import serverConfig from '../config/serverConfig.js';

export default class SiteModel {
  static async createSite(files) {
    const id = uuidv4();
    const outputPath = path.join(serverConfig.GENERATED_SITES_DIR, id);
    
    // Save files to disk
    for (const [filePath, content] of Object.entries(files)) {
      const fullPath = path.join(outputPath, filePath);
      const dir = path.dirname(fullPath);
      
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(fullPath, content);
    }
    
    return { id, path: outputPath };
  }
  
  static async getSite(id) {
    const folderPath = path.join(serverConfig.GENERATED_SITES_DIR, id);
    
    if (!fs.existsSync(folderPath)) {
      return null;
    }
    
    return { id, path: folderPath };
  }
  
  static async cleanupSite(id) {
    const folderPath = path.join(serverConfig.GENERATED_SITES_DIR, id);
    
    if (fs.existsSync(folderPath)) {
      fs.rmSync(folderPath, { recursive: true, force: true });
    }
  }
}