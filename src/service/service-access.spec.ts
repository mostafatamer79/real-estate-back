import { ServiceRequestService } from "./service-request.service";
import { Role } from "../user/user-entity";
describe("department request read boundaries", () => {
  const setup = () => {
    const query = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };
    const service = Object.create(
      ServiceRequestService.prototype,
    ) as ServiceRequestService;
    Object.assign(service, {
      serviceRequestRepository: { createQueryBuilder: () => query },
      getOwnerIds: async () => ["staff"],
      deptToTargetMap: {
        legal: "legal",
        marketing: "marketing",
        properties: "real_estate",
      },
    });
    return { service, query };
  };
  it("does not allow a staff member to select another department explicitly", async () => {
    const { service } = setup();
    await expect(
      service.findAll(
        {
          id: "staff",
          role: Role.EMPLOYEE,
          departments: ["marketing"],
          departmentPermissions: { marketing: "view" },
        } as never,
        1,
        10,
        false,
        "legal",
      ),
    ).rejects.toThrow();
  });
  it("retains owner scoping when a provider selects a department", async () => {
    const { service, query } = setup();
    await service.findAll(
      { id: "provider", role: Role.VIEWER } as never,
      1,
      10,
      false,
      "legal",
      undefined,
      true,
    );
    expect(query.andWhere).toHaveBeenCalledWith("service.userId = :userId", {
      userId: "provider",
    });
  });
  it("rejects unknown department names instead of falling back to all records", async () => {
    const { service } = setup();
    await expect(
      service.findByDepartment("unknown", {
        id: "admin",
        role: Role.ADMIN,
      } as never),
    ).rejects.toThrow();
  });
});

describe("consistent department helper use in lists", () => {
  const setup = () => {
    const query = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };
    const service = Object.create(
      ServiceRequestService.prototype,
    ) as ServiceRequestService;
    Object.assign(service, {
      serviceRequestRepository: { createQueryBuilder: () => query },
      getOwnerIds: async () => ["staff"],
    });
    return { service, query };
  };
  it("honors explicit none over membership in filtered and unfiltered lists", async () => {
    const { service, query } = setup();
    const user = {
      id: "staff",
      role: Role.EMPLOYEE,
      departments: ["marketing"],
      departmentPermissions: { marketing: "none" },
    } as never;
    await expect(
      service.findAll(user, 1, 10, false, "marketing"),
    ).rejects.toThrow();
    await service.findAll(user);
    expect(query.andWhere).toHaveBeenCalledWith(
      "service.userId IN (:...ownerIds)",
      { ownerIds: ["staff"] },
    );
  });
  it("uses specialist-role fallback without requiring duplicate membership entries", async () => {
    const { service, query } = setup();
    const user = {
      id: "staff",
      role: Role.MARKETING,
      departments: [],
      departmentPermissions: {},
    } as never;
    await service.findAll(user, 1, 10, false, "marketing");
    await service.findAll(user);
    expect(query.andWhere).toHaveBeenCalledWith(
      "service.targetDepartment IN (:...targetDepts)",
      { targetDepts: ["marketing"] },
    );
  });
});

describe("request ownership is independent of customer account role", () => {
  it.each([Role.OWNER, Role.BROKER, Role.USER, Role.VIEWER])(
    "lets role %s read its own request",
    async (role) => {
      const request = {
        id: "r",
        userId: "owner",
        targetDepartment: "marketing",
      };
      const service = Object.create(
        ServiceRequestService.prototype,
      ) as ServiceRequestService;
      Object.assign(service, {
        serviceRequestRepository: { findOne: async () => request },
      });
      expect(
        await service.findOne("r", {
          id: "owner",
          role,
          departments: [],
          departmentPermissions: {},
        } as never),
      ).toBe(request);
    },
  );
});
