import { Document, Model, Schema, Types, model } from "mongoose";

export interface IAttendance extends Document {
  gymId: Types.ObjectId;
  memberId: Types.ObjectId;
  checkInAt: Date;
  checkOutAt?: Date;
  checkedInBy: Types.ObjectId;
  checkedOutBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceSchema = new Schema<IAttendance>(
  {
    gymId: {
      type: Schema.Types.ObjectId,
      ref: "Gym",
      required: true,
    },
    memberId: {
      type: Schema.Types.ObjectId,
      ref: "Member",
      required: true,
    },
    checkInAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    checkOutAt: {
      type: Date,
    },
    checkedInBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    checkedOutBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

attendanceSchema.index({
  gymId: 1,
  checkInAt: -1,
});

attendanceSchema.index({
  gymId: 1,
  memberId: 1,
  checkInAt: -1,
});

// A member can have only one open attendance session per gym.
// This also protects against simultaneous check-in requests.
attendanceSchema.index(
  {
    gymId: 1,
    memberId: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      checkOutAt: { $exists: false },
    },
  },
);

export const Attendance: Model<IAttendance> = model<IAttendance>(
  "Attendance",
  attendanceSchema,
);
