import { expireOverdueMemberships } from "../services/membershipExpiry.service.js";

const ONE_HOUR_MS = 60 * 60 * 1000;

let isRunning = false;

const runMembershipExpiry = async (): Promise<void> => {
  if (isRunning) {
    return;
  }

  isRunning = true;

  try {
    const expiredCount = await expireOverdueMemberships();

    if (expiredCount > 0) {
      console.log(
        `[Membership Expiry] Successfully expired ${expiredCount} membership(s).`,
      );
    }
  } catch (error) {
    console.error("[Membership Expiry] Scheduled expiry check failed:", error);
  } finally {
    isRunning = false;
  }
};

/**
 * Starts the expiry job.
 *
 * The first check runs immediately. Subsequent checks run
 * every hour while the server process is running.
 */
export const startMembershipExpiryJob = (): void => {
  console.log(
    "[Membership Expiry] Job started. Running an initial check and scheduling hourly checks.",
  );

  void runMembershipExpiry();

  const interval = setInterval(() => {
    void runMembershipExpiry();
  }, ONE_HOUR_MS);

  // The timer should not prevent Node.js from shutting down.
  interval.unref();
};
