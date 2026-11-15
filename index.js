import express from "express";
import cors from "cors";
import passport from "passport";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

import "./config/passport.js";
import connectDB from "./config/db.js";

import serverConfig from "./config/serverConfig.js";
import { errorHandler } from "./utils/errorHandler.js";

import siteRoutes from "./routes/siteRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import sendEmailRoutes from "./routes/sendEmailRoutes.js";
import statsRoute from "./routes/statsRoute.js";
import { servePreviewFile } from "./controllers/siteDataController.js";

const app = express();

dotenv.config();

// Connect to MongoDB
connectDB();

// Global Middleware
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:8080",
  "http://localhost:5173",
  "https://codeatikagent.netlify.app",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps, curl, or direct links)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive for preview embeds
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
app.use(passport.initialize());

// Dynamic Preview Routes (Zero-Disk MongoDB Streaming)
app.get("/preview/:id", servePreviewFile);
app.get("/preview/:id/:filename", servePreviewFile);

// Website Builder & Project Routes
app.use("/api", siteRoutes);

// Auth & Users
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api", statsRoute);

// Contact / Email
app.use("/send-email", sendEmailRoutes);

// Error Handler
app.use(errorHandler);

// Root route
app.get("/", (req, res) => {
  res.send("CodeAtik Agent Server 2.0 (Zero-Disk Serverless Ready) is running 🚀");
});

app.listen(serverConfig.PORT, () => {
  console.log(`🚀 Server running at http://localhost:${serverConfig.PORT}`);
});
