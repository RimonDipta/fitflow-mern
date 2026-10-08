import "dotenv/config";

import bcrypt from "bcrypt";

import { connectDatabase } from "../config/database.js";
import { User } from "../models/User.js";
import { UserRole } from "../models/User.js";

const SUPER_ADMIN_NAME = "FitFlow Super Admin";
const SUPER_ADMIN_EMAIL = "admin@fitflow.local";
const SUPER_ADMIN_PASSWORD = "Admin@12345";

const createSuperAdmin = async (): Promise<void> => {
  try {
    await connectDatabase();

    const existingAdmin = await User.findOne({
      email: SUPER_ADMIN_EMAIL.toLowerCase(),
    }).select("+password");

    if (existingAdmin) {
      if (existingAdmin.role === UserRole.SUPER_ADMIN) {
        console.log("SUPER_ADMIN already exists.");
        return;
      }

      existingAdmin.role = UserRole.SUPER_ADMIN;
      existingAdmin.gymId = undefined;
      await existingAdmin.save();

      console.log("Existing user promoted to SUPER_ADMIN.");
      return;
    }

    const hashedPassword = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 12);

    await User.create({
      name: SUPER_ADMIN_NAME,
      email: SUPER_ADMIN_EMAIL,
      password: hashedPassword,
      role: UserRole.SUPER_ADMIN,
      isActive: true,
      isEmailVerified: true,
    });

    console.log("SUPER_ADMIN created successfully.");
    console.log(`Email: ${SUPER_ADMIN_EMAIL}`);
    console.log(`Password: ${SUPER_ADMIN_PASSWORD}`);
  } catch (error) {
    console.error("Failed to create SUPER_ADMIN:", error);
    process.exitCode = 1;
  } finally {
    process.exit();
  }
};

void createSuperAdmin();
