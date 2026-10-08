import { Document, Model, Schema, Types, model } from "mongoose";

export enum MembershipPlanStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

export interface IMembershipPlan extends Document {
  gymId: Types.ObjectId;
  name: string;
  description?: string;
  durationDays: number;
  price: number;
  status: MembershipPlanStatus;
  createdAt: Date;
  updatedAt: Date;
}

const membershipPlanSchema = new Schema<IMembershipPlan>(
  {
    gymId: {
      type: Schema.Types.ObjectId,
      ref: "Gym",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: [true, "Membership plan name is required"],
      trim: true,
      minlength: [2, "Membership plan name must be at least 2 characters"],
      maxlength: [100, "Membership plan name cannot exceed 100 characters"],
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    durationDays: {
      type: Number,
      required: true,
      min: 1,
      max: 3650,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: Object.values(MembershipPlanStatus),
      default: MembershipPlanStatus.ACTIVE,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

membershipPlanSchema.index({
  gymId: 1,
  name: 1,
});

export const MembershipPlan: Model<IMembershipPlan> = model<IMembershipPlan>(
  "MembershipPlan",
  membershipPlanSchema,
);
