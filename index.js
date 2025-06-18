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
import sendEmailRoutes from "./routes/sendEmailRutes.js"

const app = express();

connectDB();

dotenv.config();
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

app.use("/preview", express.static(serverConfig.GENERATED_SITES_DIR));

// website builder routes
app.use("/api", siteRoutes);

// others routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

// send email
app.use("/send-email", sendEmailRoutes )

app.use(errorHandler);

// Home route
app.use("/", async(req, res)=>{
  res.send("Welcome to codeatik-agent server")
})

app.listen(serverConfig.PORT, () => {
  console.log(`🚀 Server running at http://localhost:${serverConfig.PORT}`);
});
