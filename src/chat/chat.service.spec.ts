import { BadRequestException, ForbiddenException } from "@nestjs/common";
import { ChatService } from "./chat.service";

describe("chat membership and message history", () => {
  let service: ChatService;
  let rooms: any,
    messages: any,
    users: any,
    notifications: any,
    notificationGateway: any;
  let readQuery: any;

  beforeEach(() => {
    rooms = {
      findOne: jest
        .fn()
        .mockResolvedValue({
          id: "room",
          participants: [{ id: "member" }, { id: "peer" }],
        }),
    };
    readQuery = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      execute: jest.fn(),
    };
    messages = {
      create: jest.fn((data) => data),
      save: jest.fn(async (data) => ({ ...data, id: "saved" })),
      find: jest.fn().mockResolvedValue([{ id: "newest" }, { id: "previous" }]),
      createQueryBuilder: jest.fn(() => readQuery),
      count: jest.fn(),
    };
    users = {
      findOne: jest
        .fn()
        .mockResolvedValue({ id: "member", role: "admin", firstName: "Test" }),
    };
    notifications = {
      create: jest.fn().mockResolvedValue({ id: "notice" }),
      markChatNotificationsAsRead: jest.fn(),
    };
    notificationGateway = { sendNotificationToUser: jest.fn() };
    service = new ChatService(
      rooms,
      messages,
      users,
      notifications,
      notificationGateway,
    );
  });

  it("loads the latest bounded history in chronological display order", async () => {
    expect(await service.getRoomMessages("room", 2, "member")).toEqual([
      { id: "previous" },
      { id: "newest" },
    ]);
    expect(messages.find).toHaveBeenCalledWith(
      expect.objectContaining({
        order: { createdAt: "DESC", id: "DESC" },
        take: 2,
      }),
    );
    expect(readQuery.execute).toHaveBeenCalled();
    expect(notifications.markChatNotificationsAsRead).toHaveBeenCalledWith(
      "room",
      "member",
    );
  });

  it("uses the newest message for the room-list preview", async () => {
    messages.find.mockResolvedValue([{ id: "newest" }]);
    expect(await service.getRoomMessages("room", 1)).toEqual([
      { id: "newest" },
    ]);
    expect(messages.find).toHaveBeenCalledWith(
      expect.objectContaining({
        order: { createdAt: "DESC", id: "DESC" },
        take: 1,
      }),
    );
  });

  it.each(["history", "send", "read", "unread"])(
    "rejects outsider %s without reading or writing messages",
    async (action) => {
      const call = () =>
        action === "history"
          ? service.getRoomMessages("room", 50, "outsider")
          : action === "send"
            ? service.sendMessage("room", "outsider", "hello")
            : action === "read"
              ? service.markRoomAsRead("room", "outsider")
              : service.getUnreadCount("room", "outsider");
      await expect(call()).rejects.toBeInstanceOf(ForbiddenException);
      expect(messages.find).not.toHaveBeenCalled();
      expect(messages.save).not.toHaveBeenCalled();
      expect(messages.createQueryBuilder).not.toHaveBeenCalled();
      expect(messages.count).not.toHaveBeenCalled();
    },
  );

  it("persists a participant message and notifies only the other participant", async () => {
    const saved = await service.sendMessage("room", "member", "hello");
    expect(saved).toMatchObject({
      id: "saved",
      sender: { id: "member" },
      content: "hello",
    });
    expect(notifications.create).toHaveBeenCalledTimes(1);
    expect(notifications.create.mock.calls[0][0]).toBe("peer");
    expect(notificationGateway.sendNotificationToUser).toHaveBeenCalledWith(
      "peer",
      { id: "notice" },
    );
  });

  it.each(["", "   ", null, 42])(
    "rejects invalid content %p before persisting",
    async (content) => {
      await expect(
        service.sendMessage("room", "member", content as any),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(messages.save).not.toHaveBeenCalled();
    },
  );
});

describe("authorized service-chat enrollment", () => {
  it("adds only the requested missing participant through the relation", async () => {
    const relation = { of: jest.fn().mockReturnThis(), add: jest.fn() };
    const query = { relation: jest.fn().mockReturnValue(relation) };
    const rooms = {
      findOne: jest.fn().mockResolvedValue({ participants: [{ id: "owner" }] }),
      createQueryBuilder: jest.fn().mockReturnValue(query),
    };
    const service = new ChatService(
      rooms as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );
    await service.ensureParticipant("room", "staff");
    expect(relation.of).toHaveBeenCalledWith("room");
    expect(relation.add).toHaveBeenCalledWith("staff");
  });
  it("does not insert a duplicate membership", async () => {
    const rooms = {
      findOne: jest.fn().mockResolvedValue({ participants: [{ id: "staff" }] }),
      createQueryBuilder: jest.fn(),
    };
    const service = new ChatService(
      rooms as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );
    await service.ensureParticipant("room", "staff");
    expect(rooms.createQueryBuilder).not.toHaveBeenCalled();
  });
});
