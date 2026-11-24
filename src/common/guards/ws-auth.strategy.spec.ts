import { JwtService } from "@nestjs/jwt";
import { WsJwtStrategy } from "./ws-auth.strategy";

describe("chat socket token validation", () => {
  const jwt = new JwtService({ secret: "local-chat-test-key" });
  const users = { findOne: jest.fn() };
  const strategy = new WsJwtStrategy(jwt, users as any);

  beforeEach(() => users.findOne.mockReset());

  it.each([undefined, "", 42])(
    "rejects a signed token with invalid subject %p before querying users",
    async (sub) => {
      users.findOne.mockResolvedValue({ id: "first-user", isActive: true });
      expect(await strategy.validate(jwt.sign({ sub }))).toBeNull();
      expect(users.findOne).not.toHaveBeenCalled();
    },
  );

  it("uses the database identity and permissions instead of token identity fields", async () => {
    users.findOne.mockResolvedValue({
      id: "member",
      isActive: true,
      role: "user",
    });
    const result = await strategy.validate(
      jwt.sign({ sub: "member", userId: "victim", role: "admin" }),
    );
    expect(users.findOne).toHaveBeenCalledWith({ where: { id: "member" } });
    expect(result).toMatchObject({
      id: "member",
      userId: "member",
      role: "user",
    });
  });

  it.each(["expired", "tampered", "inactive", "deleted"])(
    "rejects %s credentials",
    async (kind) => {
      users.findOne.mockResolvedValue(
        kind === "deleted"
          ? null
          : { id: "member", isActive: kind !== "inactive" },
      );
      let token = jwt.sign(
        { sub: "member" },
        kind === "expired" ? { expiresIn: -1 } : {},
      );
      if (kind === "tampered") token += "invalid";
      expect(await strategy.validate(token)).toBeNull();
    },
  );
});
