import bcrypt from "bcrypt";
import mongoose from "mongoose";

import { Gym } from "../models/Gym.js";
import { User, UserRole } from "../models/User.js";
import type { CreateGymInput } from "../validators/gym.validator.js";

interface CreatedGymAdmin {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  gymId: string;
}

interface CreatedGym {
  id: string;
  name: string;
  slug: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  timezone: string;
  currency: string;
  isActive: boolean;
  ownerId: string;
  createdAt: Date;
}

interface CreateGymResult {
  gym: CreatedGym;
  admin: CreatedGymAdmin;
}

export const createGymWithAdmin = async (
  input: CreateGymInput,
): Promise<CreateGymResult> => {
  const existingGym = await Gym.findOne({
    slug: input.gym.slug,
  });

  if (existingGym) {
    throw new Error("A gym with this slug already exists");
  }

  const existingAdmin = await User.findOne({
    email: input.admin.email,
  });

  if (existingAdmin) {
    throw new Error("A user with this admin email already exists");
  }

  const session = await mongoose.startSession();

  try {
    const result = await session.withTransaction(
      async (): Promise<CreateGymResult> => {
        const passwordHash = await bcrypt.hash(input.admin.password, 12);

        /*
         * Create the Gym as a normal Mongoose document
         * and explicitly save it using the transaction session.
         *
         * This avoids the create([...], { session }) overload
         * issue with the current Mongoose TypeScript types.
         */
        const gym = new Gym({
          name: input.gym.name,
          slug: input.gym.slug,
          email: input.gym.email,
          phone: input.gym.phone,
          address: input.gym.address,
          city: input.gym.city,
          country: input.gym.country,
          timezone: "Asia/Dhaka",
          currency: "BDT",
          isActive: true,
        });

        await gym.save({ session });

        /*
         * Create the first GYM_ADMIN and connect it
         * to the newly created Gym.
         */
        const admin = new User({
          name: input.admin.name,
          email: input.admin.email,
          password: passwordHash,
          role: UserRole.GYM_ADMIN,
          gymId: gym._id,
          isActive: true,
          isEmailVerified: false,
        });

        await admin.save({ session });

        /*
         * The newly created admin becomes the owner
         * of the Gym.
         */
        gym.ownerId = admin._id;

        await gym.save({ session });

        return {
          gym: {
            id: gym._id.toString(),
            name: gym.name,
            slug: gym.slug,
            email: gym.email,
            phone: gym.phone,
            address: gym.address,
            city: gym.city,
            country: gym.country,
            timezone: gym.timezone,
            currency: gym.currency,
            isActive: gym.isActive,
            ownerId: admin._id.toString(),
            createdAt: gym.createdAt,
          },

          admin: {
            id: admin._id.toString(),
            name: admin.name,
            email: admin.email,
            role: admin.role,
            gymId: gym._id.toString(),
          },
        };
      },
    );

    return result;
  } finally {
    await session.endSession();
  }
};
