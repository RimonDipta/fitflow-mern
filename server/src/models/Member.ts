import { Document, Model, Schema, Types, model } from "mongoose";

export enum MemberStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED",
}

export enum Gender {
  MALE = "MALE",
  FEMALE = "FEMALE",
  OTHER = "OTHER",
  PREFER_NOT_TO_SAY = "PREFER_NOT_TO_SAY",
}

export interface IMember extends Document {
  gymId: Types.ObjectId;
  userId?: Types.ObjectId;

  memberCode: string;

  name: string;
  email?: string;
  phone?: string;

  dateOfBirth?: Date;
  gender?: Gender;

  address?: string;
  city?: string;
  country?: string;

  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;

  height?: number;
  weight?: number;

  status: MemberStatus;

  joinedAt: Date;

  notes?: string;

  createdAt: Date;
  updatedAt: Date;
}

const memberSchema = new Schema<IMember>(
  {
    gymId: {
      type: Schema.Types.ObjectId,
      ref: "Gym",
      required: true,
      index: true,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    memberCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 30,
    },

    name: {
      type: String,
      required: [true, "Member name is required"],
      trim: true,
      minlength: [2, "Member name must be at least 2 characters"],
      maxlength: [100, "Member name cannot exceed 100 characters"],
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
      maxlength: 255,
    },

    phone: {
      type: String,
      trim: true,
      maxlength: 20,
    },

    dateOfBirth: {
      type: Date,
    },

    gender: {
      type: String,
      enum: Object.values(Gender),
    },

    address: {
      type: String,
      trim: true,
      maxlength: 300,
    },

    city: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    country: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    emergencyContactName: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    emergencyContactPhone: {
      type: String,
      trim: true,
      maxlength: 20,
    },

    emergencyContactRelation: {
      type: String,
      trim: true,
      maxlength: 50,
    },

    height: {
      type: Number,
      min: 1,
      max: 300,
    },

    weight: {
      type: Number,
      min: 1,
      max: 500,
    },

    status: {
      type: String,
      enum: Object.values(MemberStatus),
      default: MemberStatus.ACTIVE,
      required: true,
      index: true,
    },

    joinedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
  },
  {
    timestamps: true,
  },
);

memberSchema.index({ gymId: 1, memberCode: 1 }, { unique: true });

memberSchema.index({
  gymId: 1,
  email: 1,
});

memberSchema.index({
  gymId: 1,
  phone: 1,
});

export const Member: Model<IMember> = model<IMember>("Member", memberSchema);
