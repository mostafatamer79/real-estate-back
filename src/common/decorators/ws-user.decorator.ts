// src/decorators/ws-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';

export const WsUser = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const client = ctx.switchToWs().getClient();
    const user = client.data?.user;

    if (!user) {
      throw new WsException('User not found');
    }

    return data ? user[data] : user;
  },
);