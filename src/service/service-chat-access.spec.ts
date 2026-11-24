import { ServiceRequestService } from "./service-request.service";
import { Role } from "../user/user-entity";
describe("service request chat membership", () => {
  function setup() {
    const request = {
      id: "request",
      userId: "owner",
      targetDepartment: "legal",
      departmentPrices: {},
      chatRoomId: "room",
    };
    const service: any = Object.create(ServiceRequestService.prototype);
    service.serviceRequestRepository = {
      findOne: jest.fn().mockResolvedValue(request),
      save: jest.fn(),
    };
    const chat = { ensureParticipant: jest.fn().mockResolvedValue(undefined) };
    return { service, chat };
  }
  it("enrolls an authorized department reader when opening an existing room", async () => {
    const { service, chat } = setup();
    await expect(
      service.getOrCreateChatRoom(
        "request",
        {
          id: "reader",
          role: Role.EMPLOYEE,
          departmentPermissions: { legal: "view" },
        },
        chat,
      ),
    ).resolves.toEqual({ chatRoomId: "room" });
    expect(chat.ensureParticipant).toHaveBeenCalledWith("room", "reader");
  });
  it("preserves owner access after an account role change", async () => {
    const { service, chat } = setup();
    await expect(
      service.getOrCreateChatRoom(
        "request",
        { id: "owner", role: Role.OWNER },
        chat,
      ),
    ).resolves.toEqual({ chatRoomId: "room" });
  });
  it("does not let stale membership override an explicit denial", async () => {
    const { service, chat } = setup();
    await expect(
      service.getOrCreateChatRoom(
        "request",
        {
          id: "denied",
          role: Role.EMPLOYEE,
          departments: ["legal"],
          departmentPermissions: { legal: "none" },
        },
        chat,
      ),
    ).rejects.toThrow();
    expect(chat.ensureParticipant).not.toHaveBeenCalled();
  });
});
