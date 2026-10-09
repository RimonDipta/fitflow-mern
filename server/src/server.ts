import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import { connectDatabase } from "./config/database.js";

import { startMembershipExpiryJob } from "./jobs/membershipExpiry.job.js";

import authRoutes from "./routes/auth.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import gymRoutes from "./routes/gym.routes.js";
import memberRoutes from "./routes/member.routes.js";
import membershipPlanRoutes from "./routes/membershipPlan.routes.js";
import membershipRoutes from "./routes/membership.routes.js";
import userRoutes from "./routes/user.routes.js";

dotenv.config();

const app = express();

const PORT = Number(process.env.PORT || 5000);

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  }),
);

app.use(helmet());
app.use(morgan("dev"));

app.use(
  express.json({
    limit: "1mb",
  }),
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb",
  }),
);

app.use(cookieParser());

app.get("/api/v1/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "FitFlow API is healthy",
  });
});

app.use("/api/v1/auth", authRoutes);

app.use("/api/v1/users", userRoutes);

app.use("/api/v1/gyms", gymRoutes);

app.use("/api/v1/members", memberRoutes);

app.use("/api/v1/membership-plans", membershipPlanRoutes);

app.use("/api/v1/memberships", membershipRoutes);

app.use("/api/v1/dashboard", dashboardRoutes);

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

const startServer = async (): Promise<void> => {
  try {
    await connectDatabase();

    startMembershipExpiryJob();

    app.listen(PORT, () => {
      console.log(`FitFlow API running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);

    process.exit(1);
  }
};

void startServer();
