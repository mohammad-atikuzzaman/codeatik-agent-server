import mongoose from "mongoose";

const sitesGenerationData = new mongoose.Schema({
  email: { type: String },
  prompt: { type: String },
  folderId: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("SitesGenerationData", sitesGenerationData);
