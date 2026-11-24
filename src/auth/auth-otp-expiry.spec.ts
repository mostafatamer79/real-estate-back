import { AuthService } from "./auth.service";
import type { UserService } from "../user/user.service";
import type { JwtService } from "@nestjs/jwt";
import type { ConfigService } from "@nestjs/config";
import type { MailService } from "../mail/mail.service";
import type { ActivityService } from "../activity/activity.service";
import { Role, User } from "../user/user-entity";

function setup(verified = false) {
  const user = {
    id: "owner",
    email: "owner@example.test",
    role: Role.VIEWER,
    isActive: verified,
    isVerified: verified,
    otp: "123456",
    expireOtp: new Date("2026-11-11T12:00:00Z"),
  } as User;
  const users = {
    findOneByEmail: jest.fn().mockResolvedValue(user),
    findOneByPhone: jest.fn(),
    updateUser: jest.fn().mockResolvedValue(user),
    createUserByemail: jest.fn(),
  };
  const mail = { sendOtp: jest.fn().mockResolvedValue(undefined) };
  const service = new AuthService(
    users as unknown as UserService,
    {} as JwtService,
    {} as ConfigService,
    mail as unknown as MailService,
    {} as ActivityService,
  );
  return { service, users, user, mail };
}

describe("email login OTP deadlines", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-11-11T12:00:00Z"));
  });
  afterEach(() => jest.useRealTimers());

  it("allows a returning verified account to resend its email login OTP without changing identity verification", async () => {
    const { service, user } = setup(true);
    const result = await service.resetOtp(user.email!);
    expect(user.expireOtp).toEqual(new Date("2026-11-11T12:05:00Z"));
    expect(result).toMatchObject({ expiresAt: "2026-11-11T12:05:00.000Z" });
    expect(user.isVerified).toBe(true);
    await expect(service.resetOtp(user.email!)).rejects.toThrow(
      "auth.otp_resend_rate_limited",
    );
  });

  it("returns the same registration deadline persisted for verification", async () => {
    const { service, users } = setup();
    const result = await service.register({ email: "owner@example.test" });
    expect(result).toMatchObject({ expiresAt: "2026-11-11T12:05:00.000Z" });
    expect(users.createUserByemail.mock.calls[0][0].expiredOtp).toEqual(
      new Date("2026-11-11T12:05:00Z"),
    );
  });

  it("rejects the old code exactly at its server deadline", async () => {
    const { service } = setup();
    await expect(
      service.verifyOtp("owner@example.test", "123456"),
    ).rejects.toThrow("auth.otp_expired");
  });
});
