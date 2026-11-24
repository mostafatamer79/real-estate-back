import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { JwtModule, JwtService } from "@nestjs/jwt";
import { getRepositoryToken } from "@nestjs/typeorm";
import { ChatGateway } from "./chat.gateway";
import { ChatService } from "./chat.service";
import { WsJwtStrategy } from "../common/guards/ws-auth.strategy";
import { WsAuthGuard } from "../common/guards/ws-jwt.guard";
import { User } from "../user/user-entity";

// Use the installed frontend client against a synthetic, loopback-only Nest server.
const {
  io,
} = require("../../../real-estate-front/node_modules/socket.io-client");

function once(socket: any, event: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Timed out waiting for ${event}`)),
      3000,
    );
    socket.once(event, (value: unknown) => {
      clearTimeout(timer);
      resolve(value);
    });
  });
}

describe("isolated chat Socket.IO authentication and delivery", () => {
  let app: INestApplication, jwt: JwtService, url: string;
  let gateway: ChatGateway;
  const clients: any[] = [];
  const service = {
    getRoomById: jest.fn(async () => ({
      participants: [{ id: "member" }, { id: "peer" }],
    })),
    sendMessage: jest.fn(
      async (roomId: string, senderId: string, content: string) => ({
        id: "saved-message",
        content,
        sender: { id: senderId, firstName: "Synthetic" },
        createdAt: new Date(),
      }),
    ),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        JwtModule.register({ secret: "isolated-chat-socket-test-key" }),
      ],
      providers: [
        ChatGateway,
        WsAuthGuard,
        WsJwtStrategy,
        { provide: ChatService, useValue: service },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(async ({ where }) =>
              ["member", "peer", "outsider"].includes(where.id)
                ? { id: where.id, isActive: true, role: "user" }
                : null,
            ),
          },
        },
      ],
    }).compile();
    app = module.createNestApplication({ logger: false });
    await app.listen(0, "127.0.0.1");
    jwt = module.get(JwtService);
    gateway = module.get(ChatGateway);
    url = `${await app.getUrl()}/chat`;
  });

  afterEach(() => {
    clients.splice(0).forEach((client) => client.disconnect());
    jest.clearAllMocks();
  });
  afterAll(async () => {
    if (app) await app.close();
  });

  async function connect(auth: object, query = {}) {
    const client = io(url, {
      auth,
      query,
      transports: ["websocket"],
      reconnection: false,
      autoConnect: false,
    });
    clients.push(client);
    const connected = once(client, "connect");
    client.connect();
    await connected;
    return client;
  }

  it.each(["missing", "tampered", "expired", "missing-subject"])(
    "denies %s credentials despite client identity claims",
    async (kind) => {
      const token =
        kind === "missing"
          ? undefined
          : kind === "tampered"
            ? "invalid-token"
            : kind === "expired"
              ? jwt.sign({ sub: "member" }, { expiresIn: -1 })
              : jwt.sign({ userId: "member" });
      const client = await connect(
        { token, userId: "member" },
        { userId: "member" },
      );
      const rejected = once(client, "exception");
      client.emit("joinRoom", { roomId: "room", userId: "member" });
      expect(await rejected).toMatchObject({ message: "Unauthorized" });
      expect(service.getRoomById).not.toHaveBeenCalled();
      expect(gateway.server.sockets.get(client.id)?.rooms.has("room")).toBe(
        false,
      );
      const sendRejected = once(client, "exception");
      client.emit("sendMessage", {
        roomId: "room",
        senderId: "member",
        content: "forbidden",
      });
      expect(await sendRejected).toMatchObject({ message: "Unauthorized" });
      expect(service.sendMessage).not.toHaveBeenCalled();
    },
  );

  it("denies outsider room membership even when a participant identity is claimed", async () => {
    const outsider = await connect({
      token: jwt.sign({ sub: "outsider" }),
      userId: "member",
    });
    const rejected = once(outsider, "error");
    outsider.emit("joinRoom", { roomId: "room", userId: "member" });
    expect(await rejected).toMatchObject({
      message: "Not authorized to join this room",
    });
    expect(gateway.server.sockets.get(outsider.id)?.rooms.has("room")).toBe(
      false,
    );
  });

  it("delivers to joined participants with token-derived sender identity and excludes an outsider", async () => {
    const member = await connect({
      token: jwt.sign({ sub: "member" }),
      userId: "outsider",
    });
    const peer = await connect({ token: jwt.sign({ sub: "peer" }) });
    const outsider = await connect({ token: jwt.sign({ sub: "outsider" }) });
    // Wait for adapter membership rather than an arbitrary delay.
    async function join(client: any) {
      const joined = new Promise<void>((resolve) => {
        const adapter = gateway.server.adapter;
        const listener = (room: string, socketId: string) => {
          if (room === "room" && socketId === client.id) {
            adapter.off("join-room", listener);
            resolve();
          }
        };
        adapter.on("join-room", listener);
      });
      client.emit("joinRoom", { roomId: "room" });
      await joined;
    }
    await join(member);
    await join(peer);
    const excluded = jest.fn();
    outsider.on("receiveMessage", excluded);
    const echo = once(member, "receiveMessage"),
      received = once(peer, "receiveMessage");
    member.emit("sendMessage", {
      roomId: "room",
      senderId: "outsider",
      userId: "outsider",
      content: "local test",
    });
    const [senderMessage, peerMessage] = await Promise.all([echo, received]);
    expect(service.sendMessage).toHaveBeenCalledWith(
      "room",
      "member",
      "local test",
    );
    expect(peerMessage).toMatchObject({
      type: "receiveMessage",
      message: {
        id: "saved-message",
        sender: { id: "member" },
        content: "local test",
      },
    });
    expect(senderMessage).toEqual(peerMessage);
    expect(excluded).not.toHaveBeenCalled();
    expect(gateway.server.sockets.get(outsider.id)?.rooms.has("room")).toBe(
      false,
    );
  });
});
