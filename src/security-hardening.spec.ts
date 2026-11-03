import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './common/guards/roles.guard';
import { Role, User } from './user/user-entity';
import { JwtStrategy } from './common/guards/jwt.strategy';
import { FileUploadService } from './document/file-upload.service';

describe('security hardening boundaries', () => {
  it('denies role-protected requests when authentication produced no user', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue([Role.ADMIN]),
    } as unknown as Reflector;
    const request = { user: undefined };
    const context = {
      getHandler: () => undefined,
      getClass: () => undefined,
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;

    expect(new RolesGuard(reflector).canActivate(context)).toBe(false);
  });

  it('rejects deleted or inactive users during JWT validation', async () => {
    const repository = {
      findOne: jest.fn().mockResolvedValue(null),
    } as any;
    const strategy = Object.create(JwtStrategy.prototype) as JwtStrategy;
    (strategy as any).userRepository = repository;

    await expect(strategy.validate({ sub: 'missing-user' })).rejects.toThrow(
      'User is no longer active',
    );
    repository.findOne.mockResolvedValue({ id: 'inactive-user', isActive: false });
    await expect(strategy.validate({ sub: 'inactive-user' })).rejects.toThrow(
      'User is no longer active',
    );
  });

  it('rejects chat messages from users who are not room participants', async () => {
    const roomRepository = {
      findOne: jest.fn().mockResolvedValue({
        id: 'room-1',
        participants: [{ id: 'owner-1' }],
      }),
    };
    const userRepository = { findOne: jest.fn() };
    const service = Object.create((require('./chat/chat.service') as typeof import('./chat/chat.service')).ChatService.prototype);
    (service as any).chatRoomRepository = roomRepository;
    (service as any).userRepository = userRepository;

    await expect(service.sendMessage('room-1', 'attacker-1', 'forged')).rejects.toThrow(
      'not a room participant',
    );
  });

  it('rejects upload folders that escape the upload root', async () => {
    const service = new FileUploadService();
    await expect(
      service.uploadFile(
        {
          originalname: 'note.txt',
          mimetype: 'text/plain',
          size: 4,
          buffer: Buffer.from('test'),
        } as Express.Multer.File,
        '../../outside',
      ),
    ).rejects.toThrow('Invalid upload folder');
  });
});
