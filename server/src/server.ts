import "dotenv/config";

import app from "./app.js";
import { connectDatabase } from "./config/database.js";
import { startMembershipExpiryJob } from "./jobs/membershipExpiry.job.js";

const PORT = Number(process.env.PORT || 5000);

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
