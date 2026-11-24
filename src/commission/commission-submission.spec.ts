import { CommissionService } from "./commission.service";
import { CommissionStatus } from "./commission.entity";
import { Role } from "../user/user-entity";
describe("commission draft submission", () => {
  const setup = () => {
    const commission = {
      id: "draft",
      creatorId: "owner",
      status: CommissionStatus.DRAFT,
      owner: { idNumber: "other" },
      buyer: { idNumber: "another" },
    };
    const repository = {
      findOne: jest.fn().mockResolvedValue(commission),
      save: jest.fn(async (value) => value),
    };
    return {
      service: new CommissionService(repository as never, {} as never),
      commission,
      repository,
    };
  };
  it.each([Role.USER, Role.VIEWER, Role.OWNER, Role.AGENT])(
    "lets the actual creator with role %s submit its draft",
    async (role) => {
      const { service, repository } = setup();
      const result = await service.submit("draft", {
        id: "owner",
        role,
      } as never);
      expect(result.status).toBe(CommissionStatus.PENDING);
      expect(result.submittedAt).toBeInstanceOf(Date);
      expect(repository.save).toHaveBeenCalledTimes(1);
    },
  );
  it("rejects submission by another account", async () => {
    const { service, repository } = setup();
    await expect(
      service.submit("draft", { id: "stranger", role: Role.AGENT } as never),
    ).rejects.toThrow();
    expect(repository.save).not.toHaveBeenCalled();
  });
  it("does not resubmit an already reviewed request", async () => {
    const { service, commission, repository } = setup();
    commission.status = CommissionStatus.APPROVED;
    await expect(
      service.submit("draft", { id: "owner", role: Role.AGENT } as never),
    ).rejects.toThrow("already");
    expect(repository.save).not.toHaveBeenCalled();
  });
});
