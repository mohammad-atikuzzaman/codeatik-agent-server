import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  PORT: process.env.PORT || 3000,
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  GENERATED_SITES_DIR: path.join(__dirname, "../generated"),
  DIRNAME: __dirname,
};
