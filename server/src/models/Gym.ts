import { Document, Model, Schema, Types, model } from "mongoose";

export interface IGym extends Document {
  name: string;
  slug: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  logo?: string;
  timezone: string;
  currency: string;
  isActive: boolean;
  ownerId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const gymSchema = new Schema<IGym>(
  {
    name: {
      type: String,
      required: [true, "Gym name is required"],
      trim: true,
      minlength: [2, "Gym name must be at least 2 characters"],
      maxlength: [150, "Gym name cannot exceed 150 characters"],
    },

    slug: {
      type: String,
      required: [true, "Gym slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      minlength: [2, "Gym slug must be at least 2 characters"],
      maxlength: [100, "Gym slug cannot exceed 100 characters"],
      match: [
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Gym slug can only contain lowercase letters, numbers, and hyphens",
      ],
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
      maxlength: [255, "Email cannot exceed 255 characters"],
    },

    phone: {
      type: String,
      trim: true,
      maxlength: [20, "Phone number cannot exceed 20 characters"],
    },

    address: {
      type: String,
      trim: true,
      maxlength: [300, "Address cannot exceed 300 characters"],
    },

    city: {
      type: String,
      trim: true,
      maxlength: [100, "City cannot exceed 100 characters"],
    },

    country: {
      type: String,
      trim: true,
      maxlength: [100, "Country cannot exceed 100 characters"],
    },

    logo: {
      type: String,
      trim: true,
    },

    timezone: {
      type: String,
      default: "Asia/Dhaka",
      trim: true,
    },

    currency: {
      type: String,
      default: "BDT",
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 3,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

export const Gym: Model<IGym> = model<IGym>("Gym", gymSchema);
