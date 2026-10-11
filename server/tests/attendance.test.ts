import { createRequire } from "node:module";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose, { Types } from "mongoose";
import jwt from "jsonwebtoken";

import app from "../src/app.js";

import { Attendance } from "../src/models/Attendance.js";
import { Gym } from "../src/models/Gym.js";
import { Member, MemberStatus } from "../src/models/Member.js";
import {
  Membership,
  MembershipPaymentStatus,
  MembershipStatus,
} from "../src/models/Membership.js";
import { User, UserRole } from "../src/models/User.js";

const require = createRequire(import.meta.url);
const supertest = require("supertest");

const JWT_SECRET = "fitflow-test-secret-that-is-not-a-production-secret";
const API = "/api/v1/attendance";

process.env.JWT_ACCESS_SECRET = JWT_SECRET;

let mongoServer: MongoMemoryServer;
let emailCounter = 0;

type TestContext = {
  gymId: Types.ObjectId;
  userId: Types.ObjectId;
  token: string;
};

type MemberOptions = {
  suffix?: string;
  status?: MemberStatus;
};

type MembershipOptions = {
  status?: MembershipStatus;
  paymentStatus?: MembershipPaymentStatus;
  startDate?: Date;
  endDate?: Date;
};

const createGym = async (suffix = "test") => {
  return Gym.create({
    name: `Test Gym ${suffix}`,
    slug: `test-gym-${suffix}-${new Types.ObjectId().toString().slice(-6)}`,
    isActive: true,
  });
};

const createUser = async (
  gymId: Types.ObjectId,
  role: UserRole = UserRole.GYM_ADMIN,
): Promise<TestContext> => {
  emailCounter += 1;

  const user = await User.create({
    name: `Test User ${emailCounter}`,
    email: `attendance-test-${Date.now()}-${emailCounter}@example.com`,
    password: "test-password-123",
    role,
    gymId,
    isActive: true,
    isEmailVerified: true,
  });

  const token = jwt.sign(
    {
      userId: user._id.toString(),
      role: user.role,
      gymId: gymId.toString(),
    },
    JWT_SECRET,
    { expiresIn: "15m" },
  );

  return {
    gymId,
    userId: user._id,
    token,
  };
};

const createMember = async (
  gymId: Types.ObjectId,
  options: MemberOptions = {},
) => {
  const suffix = options.suffix ?? new Types.ObjectId().toString().slice(-8);

  return Member.create({
    gymId,
    memberCode: `TEST-${suffix}`,
    name: `Test Member ${suffix}`,
    status: options.status ?? MemberStatus.ACTIVE,
    joinedAt: new Date(),
  });
};

const createMembership = async (
  gymId: Types.ObjectId,
  memberId: Types.ObjectId,
  options: MembershipOptions = {},
) => {
  const now = new Date();

  return Membership.create({
    gymId,
    memberId,
    membershipPlanId: new Types.ObjectId(),
    startDate: options.startDate ?? new Date(now.getTime() - 86_400_000),
    endDate: options.endDate ?? new Date(now.getTime() + 86_400_000),
    price: 1000,
    paymentStatus: options.paymentStatus ?? MembershipPaymentStatus.PAID,
    status: options.status ?? MembershipStatus.ACTIVE,
  });
};

const authenticatedRequest = (token: string) => {
  const authorization = `Bearer ${token}`;

  return {
    get: (path: string) =>
      supertest(app).get(path).set("Authorization", authorization),

    post: (path: string) =>
      supertest(app).post(path).set("Authorization", authorization),

    patch: (path: string) =>
      supertest(app).patch(path).set("Authorization", authorization),
  };
};

const getAttendanceFromResponse = (body: any) =>
  body?.data?.attendance ?? body?.attendance ?? body?.data;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  await Promise.all([
    User.init(),
    Gym.init(),
    Member.init(),
    Membership.init(),
    Attendance.init(),
  ]);
});

afterEach(async () => {
  await Promise.all([
    Attendance.deleteMany({}),
    Membership.deleteMany({}),
    Member.deleteMany({}),
    User.deleteMany({}),
    Gym.deleteMany({}),
  ]);
});

afterAll(async () => {
  await mongoose.disconnect();

  if (mongoServer) {
    await mongoServer.stop();
  }
});

describe("Attendance API", () => {
  it("rejects unauthenticated requests", async () => {
    const response = await supertest(app).get(API);

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it("forbids users with the MEMBER role", async () => {
    const gym = await createGym("member-role");
    const context = await createUser(gym._id, UserRole.MEMBER);

    const response = await authenticatedRequest(context.token).get(API);

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
  });

  it("checks in an active member with a valid membership", async () => {
    const gym = await createGym("valid-checkin");
    const context = await createUser(gym._id);
    const member = await createMember(gym._id);

    await createMembership(gym._id, member._id);

    const response = await authenticatedRequest(context.token)
      .post(`${API}/check-in`)
      .send({ memberId: member._id.toString() });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);

    const attendance = getAttendanceFromResponse(response.body);

    expect(attendance.memberId).toBe(member._id.toString());
    expect(attendance.checkInAt).toBeDefined();
    expect(attendance.durationMinutes).toBeNull();

    const storedAttendance = await Attendance.findById(attendance.id);

    expect(storedAttendance).not.toBeNull();
    expect(storedAttendance?.isOpen).toBe(true);
  });

  it("rejects a duplicate check-in", async () => {
    const gym = await createGym("duplicate");
    const context = await createUser(gym._id);
    const member = await createMember(gym._id);

    await createMembership(gym._id, member._id);

    const firstResponse = await authenticatedRequest(context.token)
      .post(`${API}/check-in`)
      .send({ memberId: member._id.toString() });

    const secondResponse = await authenticatedRequest(context.token)
      .post(`${API}/check-in`)
      .send({ memberId: member._id.toString() });

    expect(firstResponse.status).toBe(201);
    expect(secondResponse.status).toBe(409);
    expect(secondResponse.body.success).toBe(false);
  });

  it("rejects check-in without a valid active membership", async () => {
    const gym = await createGym("no-membership");
    const context = await createUser(gym._id);
    const member = await createMember(gym._id);

    const response = await authenticatedRequest(context.token)
      .post(`${API}/check-in`)
      .send({ memberId: member._id.toString() });

    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
  });

  it("rejects check-in for an inactive member", async () => {
    const gym = await createGym("inactive");
    const context = await createUser(gym._id);
    const member = await createMember(gym._id, {
      status: MemberStatus.INACTIVE,
    });

    await createMembership(gym._id, member._id);

    const response = await authenticatedRequest(context.token)
      .post(`${API}/check-in`)
      .send({ memberId: member._id.toString() });

    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
  });

  it("checks out an attendance session and rejects a second checkout", async () => {
    const gym = await createGym("checkout");
    const context = await createUser(gym._id);
    const member = await createMember(gym._id);

    await createMembership(gym._id, member._id);

    const checkInResponse = await authenticatedRequest(context.token)
      .post(`${API}/check-in`)
      .send({ memberId: member._id.toString() });

    expect(checkInResponse.status).toBe(201);

    const attendance = getAttendanceFromResponse(checkInResponse.body);

    const checkOutResponse = await authenticatedRequest(context.token).patch(
      `${API}/${attendance.id}/check-out`,
    );

    expect(checkOutResponse.status).toBe(200);
    expect(checkOutResponse.body.success).toBe(true);

    const checkedOutAttendance = getAttendanceFromResponse(
      checkOutResponse.body,
    );

    expect(checkedOutAttendance.checkOutAt).toBeDefined();

    const storedAttendance = await Attendance.findById(attendance.id);

    expect(storedAttendance?.isOpen).toBe(false);
    expect(storedAttendance?.checkOutAt).toBeDefined();

    const secondCheckOutResponse = await authenticatedRequest(
      context.token,
    ).patch(`${API}/${attendance.id}/check-out`);

    expect(secondCheckOutResponse.status).toBe(409);
    expect(secondCheckOutResponse.body.success).toBe(false);
  });

  it("rejects an impossible calendar date", async () => {
    const gym = await createGym("invalid-date");
    const context = await createUser(gym._id);

    const response = await authenticatedRequest(context.token).get(API).query({
      date: "2026-02-30",
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it("isolates attendance records between gyms", async () => {
    const gymA = await createGym("isolation-a");
    const gymB = await createGym("isolation-b");

    const contextA = await createUser(gymA._id);
    const contextB = await createUser(gymB._id);

    const memberA = await createMember(gymA._id, { suffix: "isolation-a" });
    const memberB = await createMember(gymB._id, { suffix: "isolation-b" });

    await createMembership(gymA._id, memberA._id);
    await createMembership(gymB._id, memberB._id);

    const checkInA = await authenticatedRequest(contextA.token)
      .post(`${API}/check-in`)
      .send({ memberId: memberA._id.toString() });

    const checkInB = await authenticatedRequest(contextB.token)
      .post(`${API}/check-in`)
      .send({ memberId: memberB._id.toString() });

    expect(checkInA.status).toBe(201);
    expect(checkInB.status).toBe(201);

    const listA = await authenticatedRequest(contextA.token).get(API);

    expect(listA.status).toBe(200);

    const records = listA.body.data.records as Array<{ memberId: string }>;

    expect(
      records.some((record) => record.memberId === memberA._id.toString()),
    ).toBe(true);
    expect(
      records.some((record) => record.memberId === memberB._id.toString()),
    ).toBe(false);
  });
});
