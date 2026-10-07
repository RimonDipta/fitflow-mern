import { Document, Model, Schema, model } from "mongoose";

export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  GYM_ADMIN = "GYM_ADMIN",
  TRAINER = "TRAINER",
  STAFF = "STAFF",
  MEMBER = "MEMBER",
}

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  gymId?: Schema.Types.ObjectId;
  avatar?: string;
  phone?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },

    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.MEMBER,
      required: true,
      index: true,
    },

    gymId: {
      type: Schema.Types.ObjectId,
      ref: "Gym",
      index: true,
    },

    avatar: {
      type: String,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
      maxlength: [20, "Phone number cannot exceed 20 characters"],
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

export const User: Model<IUser> = model<IUser>("User", userSchema);
