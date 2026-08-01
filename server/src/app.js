import "dotenv/config";

import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import { connectDatabase } from "./config/database.js";
import authRoutes from "./routes/authRoutes.js";
import siteRoutes from "./routes/siteRoutes.js";
import deviceRoutes from "./routes/deviceRoutes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import userRoutes from "./routes/userRoutes.js";

import dashboardRoutes from "./routes/dashboardRoutes.js";

const app = express();
const port = Number(process.env.PORT) || 5000;

app.set("trust proxy", 1);
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many login attempts. Please try again later.",
  },
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Ruhanex IoT API is running",
  });
});

/*
 * Public authentication routes must be registered first.
 */
app.use("/api/auth/login", loginLimiter);
app.use("/api/auth", authRoutes);

/*
 * Protected resource routes.
 */
app.use("/api/sites", siteRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/users", userRoutes);

/*
 * The dashboard router is mounted broadly at /api,
 * so it must not contain router.use(authenticate).
 */
app.use("/api", dashboardRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

async function startServer() {
  await connectDatabase();

  app.listen(port, () => {
    console.log(`API server running at http://localhost:${port}`);
  });
}

startServer();
