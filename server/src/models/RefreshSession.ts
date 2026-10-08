import { Document, Model, Schema, Types, model } from "mongoose";

export interface IRefreshSession extends Document {
  userId: Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  revokedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const refreshSessionSchema = new Schema<IRefreshSession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    revokedAt: {
      type: Date,
      default: undefined,
    },
  },
  {
    timestamps: true,
  },
);

refreshSessionSchema.index(
  { expiresAt: 1 },
  {
    expireAfterSeconds: 0,
  },
);

export const RefreshSession: Model<IRefreshSession> = model<IRefreshSession>(
  "RefreshSession",
  refreshSessionSchema,
);
