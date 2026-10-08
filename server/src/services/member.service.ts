import { Types } from "mongoose";

import { Gender, Member, MemberStatus } from "../models/Member.js";
import type {
  CreateMemberInput,
  UpdateMemberInput,
} from "../validators/member.validator.js";

interface MemberResult {
  id: string;
  gymId: string;
  userId?: string;
  memberCode: string;
  name: string;
  email?: string;
  phone?: string;
  dateOfBirth?: Date;
  gender?: string;
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

interface MemberListResult {
  members: MemberResult[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const toMemberResult = (member: {
  _id: Types.ObjectId;
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
}): MemberResult => ({
  id: member._id.toString(),
  gymId: member.gymId.toString(),
  userId: member.userId?.toString(),
  memberCode: member.memberCode,
  name: member.name,
  email: member.email,
  phone: member.phone,
  dateOfBirth: member.dateOfBirth,
  gender: member.gender,
  address: member.address,
  city: member.city,
  country: member.country,
  emergencyContactName: member.emergencyContactName,
  emergencyContactPhone: member.emergencyContactPhone,
  emergencyContactRelation: member.emergencyContactRelation,
  height: member.height,
  weight: member.weight,
  status: member.status,
  joinedAt: member.joinedAt,
  notes: member.notes,
  createdAt: member.createdAt,
  updatedAt: member.updatedAt,
});

const generateMemberCode = async (gymId: string): Promise<string> => {
  const prefix = "MEM";

  const count = await Member.countDocuments({
    gymId,
  });

  let sequence = count + 1;

  while (
    await Member.exists({
      gymId,
      memberCode: `${prefix}-${String(sequence).padStart(5, "0")}`,
    })
  ) {
    sequence += 1;
  }

  return `${prefix}-${String(sequence).padStart(5, "0")}`;
};

export const createMember = async (
  gymId: string,
  input: CreateMemberInput,
): Promise<MemberResult> => {
  if (!Types.ObjectId.isValid(gymId)) {
    throw new Error("Invalid gym ID");
  }

  const memberCode = await generateMemberCode(gymId);

  const member = await Member.create({
    gymId,
    memberCode,
    name: input.name,
    email: input.email || undefined,
    phone: input.phone || undefined,
    dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined,
    gender: input.gender ? (input.gender as Gender) : undefined,
    address: input.address || undefined,
    city: input.city || undefined,
    country: input.country || undefined,
    emergencyContactName: input.emergencyContactName || undefined,
    emergencyContactPhone: input.emergencyContactPhone || undefined,
    emergencyContactRelation: input.emergencyContactRelation || undefined,
    height: input.height,
    weight: input.weight,
    status: MemberStatus.ACTIVE,
    joinedAt: input.joinedAt ? new Date(input.joinedAt) : new Date(),
    notes: input.notes || undefined,
  });

  return toMemberResult(member);
};

export const listMembers = async (
  gymId: string,
  page = 1,
  limit = 20,
  search?: string,
): Promise<MemberListResult> => {
  if (!Types.ObjectId.isValid(gymId)) {
    throw new Error("Invalid gym ID");
  }

  const safePage = Math.max(1, page);

  const safeLimit = Math.min(Math.max(1, limit), 100);

  const filter: {
    gymId: string;
    $or?: Array<{
      name?: {
        $regex: string;
        $options: string;
      };
      email?: {
        $regex: string;
        $options: string;
      };
      phone?: {
        $regex: string;
        $options: string;
      };
      memberCode?: {
        $regex: string;
        $options: string;
      };
    }>;
  } = {
    gymId,
  };

  if (search?.trim()) {
    const searchRegex = search.trim();

    filter.$or = [
      {
        name: {
          $regex: searchRegex,
          $options: "i",
        },
      },
      {
        email: {
          $regex: searchRegex,
          $options: "i",
        },
      },
      {
        phone: {
          $regex: searchRegex,
          $options: "i",
        },
      },
      {
        memberCode: {
          $regex: searchRegex,
          $options: "i",
        },
      },
    ];
  }

  const skip = (safePage - 1) * safeLimit;

  const [members, total] = await Promise.all([
    Member.find(filter).sort({ createdAt: -1 }).skip(skip).limit(safeLimit),

    Member.countDocuments(filter),
  ]);

  return {
    members: members.map(toMemberResult),
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.ceil(total / safeLimit),
  };
};

export const getMemberById = async (
  gymId: string,
  memberId: string,
): Promise<MemberResult> => {
  if (!Types.ObjectId.isValid(gymId)) {
    throw new Error("Invalid gym ID");
  }

  if (!Types.ObjectId.isValid(memberId)) {
    throw new Error("Invalid member ID");
  }

  const member = await Member.findOne({
    _id: memberId,
    gymId,
  });

  if (!member) {
    throw new Error("Member not found");
  }

  return toMemberResult(member);
};

export const updateMember = async (
  gymId: string,
  memberId: string,
  input: UpdateMemberInput,
): Promise<MemberResult> => {
  if (!Types.ObjectId.isValid(gymId)) {
    throw new Error("Invalid gym ID");
  }

  if (!Types.ObjectId.isValid(memberId)) {
    throw new Error("Invalid member ID");
  }

  const updateData = {
    ...(input.name !== undefined ? { name: input.name } : {}),

    ...(input.email !== undefined
      ? {
          email: input.email || undefined,
        }
      : {}),

    ...(input.phone !== undefined
      ? {
          phone: input.phone || undefined,
        }
      : {}),

    ...(input.dateOfBirth !== undefined
      ? {
          dateOfBirth: input.dateOfBirth
            ? new Date(input.dateOfBirth)
            : undefined,
        }
      : {}),

    ...(input.gender !== undefined
      ? {
          gender: input.gender ? (input.gender as Gender) : undefined,
        }
      : {}),

    ...(input.address !== undefined
      ? {
          address: input.address || undefined,
        }
      : {}),

    ...(input.city !== undefined
      ? {
          city: input.city || undefined,
        }
      : {}),

    ...(input.country !== undefined
      ? {
          country: input.country || undefined,
        }
      : {}),

    ...(input.emergencyContactName !== undefined
      ? {
          emergencyContactName: input.emergencyContactName || undefined,
        }
      : {}),

    ...(input.emergencyContactPhone !== undefined
      ? {
          emergencyContactPhone: input.emergencyContactPhone || undefined,
        }
      : {}),

    ...(input.emergencyContactRelation !== undefined
      ? {
          emergencyContactRelation: input.emergencyContactRelation || undefined,
        }
      : {}),

    ...(input.height !== undefined ? { height: input.height } : {}),

    ...(input.weight !== undefined ? { weight: input.weight } : {}),

    ...(input.joinedAt !== undefined
      ? {
          joinedAt: input.joinedAt ? new Date(input.joinedAt) : undefined,
        }
      : {}),

    ...(input.notes !== undefined
      ? {
          notes: input.notes || undefined,
        }
      : {}),
  };

  const member = await Member.findOneAndUpdate(
    {
      _id: memberId,
      gymId,
    },
    updateData,
    {
      new: true,
      runValidators: true,
    },
  );

  if (!member) {
    throw new Error("Member not found");
  }

  return toMemberResult(member);
};

export const updateMemberStatus = async (
  gymId: string,
  memberId: string,
  status: MemberStatus,
): Promise<MemberResult> => {
  if (!Types.ObjectId.isValid(gymId)) {
    throw new Error("Invalid gym ID");
  }

  if (!Types.ObjectId.isValid(memberId)) {
    throw new Error("Invalid member ID");
  }

  const member = await Member.findOneAndUpdate(
    {
      _id: memberId,
      gymId,
    },
    {
      status,
    },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!member) {
    throw new Error("Member not found");
  }

  return toMemberResult(member);
};

export const deleteMember = async (
  gymId: string,
  memberId: string,
): Promise<void> => {
  if (!Types.ObjectId.isValid(gymId)) {
    throw new Error("Invalid gym ID");
  }

  if (!Types.ObjectId.isValid(memberId)) {
    throw new Error("Invalid member ID");
  }

  const member = await Member.findOneAndDelete({
    _id: memberId,
    gymId,
  });

  if (!member) {
    throw new Error("Member not found");
  }
};
