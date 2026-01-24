// src/auth/ws-auth.guard.ts
import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { WsJwtStrategy } from './ws-auth.strategy';

@Injectable()
export class WsAuthGuard implements CanActivate {
  private logger = new Logger(WsAuthGuard.name);

  constructor(private wsJwtStrategy: WsJwtStrategy) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient();

    try {
      // Extract token from handshake
      const token = this.extractToken(client);

      if (!token) {
        throw new WsException('No token provided');
      }

      // Validate token
      const user = await this.wsJwtStrategy.validate(token);

      if (!user) {
        throw new WsException('Invalid token');
      }

      // Attach user to socket
      client.data.user = user;
      return true;

    } catch (error) {
      this.logger.error(`Authentication error: ${error.message}`);
      throw new WsException('Unauthorized');
    }
  }

  private extractToken(client: Socket): string | null {
    const auth = client.handshake.auth;
    const headers = client.handshake.headers;

    // Try to get token from auth object first
    if (auth?.token) {
      return auth.token;
    }

    // Try to get from Authorization header
    const authHeader = headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.split(' ')[1];
    }

    return null;
  }
}