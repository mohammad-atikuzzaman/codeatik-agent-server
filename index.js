import express from "express";
import cors from "cors";
import passport from "passport";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

import "./config/passport.js"
import connectDB from "./config/db.js";

import serverConfig from "./config/serverConfig.js";
import { errorHandler } from "./utils/errorHandler.js";

import siteRoutes from "./routes/siteRoutes.js";
import authRoutes from "./routes/authRoutes.js"
import userRoutes  from "./routes/userRoutes.js"

const app = express();

connectDB();

dotenv.config();
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

app.use("/preview", express.static(serverConfig.GENERATED_SITES_DIR));

app.use("/api", siteRoutes);

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

app.use(errorHandler);

app.listen(serverConfig.PORT, () => {
  console.log(`🚀 Server running at http://localhost:${serverConfig.PORT}`);
});
