import { ChatGateway } from "./chat.gateway";

describe("chat gateway contracts", () => {
  let gateway: ChatGateway, service: any;
  const socket = (id = "socket-1") =>
    ({
      id,
      data: { user: { id: "member" } },
      join: jest.fn(),
      emit: jest.fn(),
    }) as any;

  beforeEach(() => {
    service = {
      getRoomById: jest
        .fn()
        .mockResolvedValue({ participants: [{ id: "member" }] }),
      sendMessage: jest
        .fn()
        .mockResolvedValue({
          id: "message",
          content: "hello",
          sender: { id: "member", firstName: "Test" },
          createdAt: "2026-11-12T00:00:00Z",
        }),
    };
    gateway = new ChatGateway(service);
    gateway.server = { to: jest.fn().mockReturnThis(), emit: jest.fn() } as any;
  });

  it("joins only a participant to the requested room", async () => {
    const client = socket();
    await gateway.handleJoinRoom(client, { roomId: "room" });
    expect(client.join).toHaveBeenCalledWith("room");
    service.getRoomById.mockResolvedValue({ participants: [{ id: "peer" }] });
    client.join.mockClear();
    await gateway.handleJoinRoom(client, { roomId: "private" });
    expect(client.join).not.toHaveBeenCalled();
    expect(client.emit).toHaveBeenCalledWith(
      "error",
      expect.objectContaining({ message: expect.any(String) }),
    );
  });

  it("ignores spoofed senderId and userId and broadcasts only to the room", async () => {
    const client = socket();
    await gateway.handleSendMessage(client, {
      roomId: "room",
      content: "hello",
      senderId: "victim",
      userId: "victim",
    } as any);
    expect(service.sendMessage).toHaveBeenCalledWith("room", "member", "hello");
    expect(gateway.server.to).toHaveBeenCalledWith("room");
    expect(gateway.server.emit).toHaveBeenCalledWith(
      "receiveMessage",
      expect.objectContaining({
        message: expect.objectContaining({
          id: "message",
          sender: expect.objectContaining({ id: "member" }),
        }),
      }),
    );
  });
});
