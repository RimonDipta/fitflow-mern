import { Types } from "mongoose";

import { Attendance } from "../models/Attendance.js";
import { Member, MemberStatus } from "../models/Member.js";
import { Membership, MembershipStatus } from "../models/Membership.js";

interface AttendanceResult {
  id: string;
  gymId: string;
  memberId: string;
  member: {
    id: string;
    name: string;
    memberCode: string;
  };
  checkInAt: Date;
  checkOutAt?: Date;
  checkedInBy: string;
  checkedOutBy?: string;
  durationMinutes: number | null;
}

interface AttendanceListResult {
  records: AttendanceResult[];
  total: number;
  checkedInCount: number;
  checkedOutCount: number;
}

const validateObjectId = (value: string, message: string): void => {
  if (!Types.ObjectId.isValid(value)) {
    throw new Error(message);
  }
};

const getStartOfUtcDay = (date: Date = new Date()): Date =>
  new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );

const toAttendanceResult = (
  attendance: {
    _id: Types.ObjectId;
    gymId: Types.ObjectId;
    memberId: Types.ObjectId;
    checkInAt: Date;
    checkOutAt?: Date;
    checkedInBy: Types.ObjectId;
    checkedOutBy?: Types.ObjectId;
  },
  member: {
    _id: Types.ObjectId;
    name: string;
    memberCode: string;
  },
): AttendanceResult => {
  const endTime = attendance.checkOutAt
    ? attendance.checkOutAt.getTime()
    : null;

  const durationMinutes =
    endTime === null
      ? null
      : Math.max(
          0,
          Math.floor((endTime - attendance.checkInAt.getTime()) / 60_000),
        );

  return {
    id: attendance._id.toString(),
    gymId: attendance.gymId.toString(),
    memberId: attendance.memberId.toString(),
    member: {
      id: member._id.toString(),
      name: member.name,
      memberCode: member.memberCode,
    },
    checkInAt: attendance.checkInAt,
    checkOutAt: attendance.checkOutAt,
    checkedInBy: attendance.checkedInBy.toString(),
    checkedOutBy: attendance.checkedOutBy?.toString(),
    durationMinutes,
  };
};

export const checkInMember = async (
  gymId: string,
  memberId: string,
  userId: string,
): Promise<AttendanceResult> => {
  validateObjectId(gymId, "Invalid gym ID");
  validateObjectId(memberId, "Invalid member ID");
  validateObjectId(userId, "Invalid user ID");

  const member = await Member.findOne({
    _id: memberId,
    gymId,
  });

  if (!member) {
    throw new Error("Member not found in this gym");
  }

  if (member.status !== MemberStatus.ACTIVE) {
    throw new Error("Only active members can check in");
  }

  const now = new Date();

  const validMembership = await Membership.findOne({
    gymId,
    memberId: member._id,
    status: MembershipStatus.ACTIVE,
    startDate: { $lte: now },
    endDate: { $gte: now },
  });

  if (!validMembership) {
    throw new Error("Member does not have a valid active membership today");
  }

  const existingSession = await Attendance.findOne({
    gymId,
    memberId: member._id,
    checkOutAt: { $exists: false },
  });

  if (existingSession) {
    throw new Error("Member is already checked in");
  }

  try {
    const attendance = await Attendance.create({
      gymId,
      memberId: member._id,
      checkedInBy: userId,
      checkInAt: now,
    });

    return toAttendanceResult(attendance, member);
  } catch (error) {
    // The unique partial index protects against concurrent check-ins.
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      throw new Error("Member is already checked in");
    }

    throw error;
  }
};

export const checkOutMember = async (
  gymId: string,
  attendanceId: string,
  userId: string,
): Promise<AttendanceResult> => {
  validateObjectId(gymId, "Invalid gym ID");
  validateObjectId(attendanceId, "Invalid attendance ID");
  validateObjectId(userId, "Invalid user ID");

  const attendance = await Attendance.findOne({
    _id: attendanceId,
    gymId,
    checkOutAt: { $exists: false },
  });

  if (!attendance) {
    throw new Error("Open attendance session not found");
  }

  const checkOutAt = new Date();

  if (checkOutAt < attendance.checkInAt) {
    throw new Error("Check-out time cannot precede check-in time");
  }

  // Conditional update prevents two requests from checking out
  // the same session at the same time.
  const updatedAttendance = await Attendance.findOneAndUpdate(
    {
      _id: attendanceId,
      gymId,
      checkOutAt: { $exists: false },
    },
    {
      $set: {
        checkOutAt,
        checkedOutBy: userId,
      },
    },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!updatedAttendance) {
    throw new Error("This attendance session has already been checked out");
  }

  const member = await Member.findOne({
    _id: updatedAttendance.memberId,
    gymId,
  }).select("_id name memberCode");

  if (!member) {
    throw new Error("Attendance member could not be found");
  }

  return toAttendanceResult(updatedAttendance, member);
};

export const listAttendance = async (
  gymId: string,
  date?: string,
  search?: string,
): Promise<AttendanceListResult> => {
  validateObjectId(gymId, "Invalid gym ID");

  const filter: Record<string, unknown> = { gymId };

  if (date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error("Date must use YYYY-MM-DD format");
    }

    const parsedDate = new Date(`${date}T00:00:00.000Z`);

    if (
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== date
    ) {
      throw new Error("Invalid attendance date");
    }

    const start = getStartOfUtcDay(parsedDate);
    const end = new Date(start.getTime() + 86_400_000);

    filter.checkInAt = {
      $gte: start,
      $lt: end,
    };
  }

  if (search?.trim()) {
    const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const matchingMembers = await Member.find({
      gymId,
      $or: [
        { name: { $regex: escapedSearch, $options: "i" } },
        { memberCode: { $regex: escapedSearch, $options: "i" } },
      ],
    })
      .select("_id")
      .limit(200)
      .lean();

    const matchingMemberIds = matchingMembers.map((member) => member._id);

    if (matchingMemberIds.length === 0) {
      return {
        records: [],
        total: 0,
        checkedInCount: 0,
        checkedOutCount: 0,
      };
    }

    filter.memberId = { $in: matchingMemberIds };
  }

  const attendanceRecords = await Attendance.find(filter)
    .sort({ checkInAt: -1 })
    .limit(100)
    .lean();

  const records: AttendanceResult[] = [];

  for (const attendance of attendanceRecords) {
    const member = await Member.findOne({
      _id: attendance.memberId,
      gymId,
    })
      .select("_id name memberCode")
      .lean();

    if (!member) {
      continue;
    }

    records.push(
      toAttendanceResult(
        {
          _id: attendance._id,
          gymId: attendance.gymId,
          memberId: attendance.memberId,
          checkInAt: attendance.checkInAt,
          checkOutAt: attendance.checkOutAt,
          checkedInBy: attendance.checkedInBy,
          checkedOutBy: attendance.checkedOutBy,
        },
        member,
      ),
    );
  }

  return {
    records,
    total: records.length,
    checkedInCount: records.filter((record) => !record.checkOutAt).length,
    checkedOutCount: records.filter((record) => Boolean(record.checkOutAt))
      .length,
  };
};
