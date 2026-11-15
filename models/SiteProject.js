import mongoose from "mongoose";

const fileItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  content: {
    type: String,
    required: true,
  },
  mimeType: {
    type: String,
    default: "text/plain",
  },
  sizeBytes: {
    type: Number,
    default: 0,
  },
});

const revisionSchema = new mongoose.Schema({
  revisionNumber: {
    type: Number,
    default: 1,
  },
  prompt: {
    type: String,
    required: true,
  },
  files: [fileItemSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const siteProjectSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    email: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      default: "Generated Website",
    },
    description: {
      type: String,
      default: "",
    },
    initialPrompt: {
      type: String,
      required: true,
    },
    blueprint: {
      category: { type: String },
      targetAudience: { type: String },
      brandTone: { type: String },
      colorPalette: {
        primary: { type: String },
        secondary: { type: String },
        background: { type: String },
        surface: { type: String },
        text: { type: String },
        accent: { type: String },
      },
      typography: {
        fontFamily: { type: String },
        headingFont: { type: String },
      },
      sections: [{ name: String, summary: String }],
      interactiveWidgets: [{ type: String }],
    },
    activeFiles: [fileItemSchema],
    revisions: [revisionSchema],
    tags: [{ type: String }],
    isPublic: {
      type: Boolean,
      default: false,
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast user dashboard sorting
siteProjectSchema.index({ email: 1, createdAt: -1 });

export default mongoose.model("SiteProject", siteProjectSchema);
