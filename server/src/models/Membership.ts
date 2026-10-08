import { Document, Model, Schema, Types, model } from "mongoose";

export enum MembershipStatus {
  ACTIVE = "ACTIVE",
  EXPIRED = "EXPIRED",
  CANCELLED = "CANCELLED",
}

export enum MembershipPaymentStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  PARTIAL = "PARTIAL",
  REFUNDED = "REFUNDED",
}

export interface IMembership extends Document {
  gymId: Types.ObjectId;
  memberId: Types.ObjectId;
  membershipPlanId: Types.ObjectId;

  startDate: Date;
  endDate: Date;

  price: number;
  paymentStatus: MembershipPaymentStatus;
  status: MembershipStatus;

  notes?: string;

  createdAt: Date;
  updatedAt: Date;
}

const membershipSchema = new Schema<IMembership>(
  {
    gymId: {
      type: Schema.Types.ObjectId,
      ref: "Gym",
      required: true,
      index: true,
    },

    memberId: {
      type: Schema.Types.ObjectId,
      ref: "Member",
      required: true,
      index: true,
    },

    membershipPlanId: {
      type: Schema.Types.ObjectId,
      ref: "MembershipPlan",
      required: true,
      index: true,
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentStatus: {
      type: String,
      enum: Object.values(MembershipPaymentStatus),
      default: MembershipPaymentStatus.PENDING,
      required: true,
    },

    status: {
      type: String,
      enum: Object.values(MembershipStatus),
      default: MembershipStatus.ACTIVE,
      required: true,
      index: true,
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

membershipSchema.index({
  gymId: 1,
  memberId: 1,
  startDate: -1,
});

membershipSchema.index({
  gymId: 1,
  status: 1,
  endDate: 1,
});

export const Membership: Model<IMembership> = model<IMembership>(
  "Membership",
  membershipSchema,
);
