import { Reflector } from '@nestjs/core';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';
import { UserController } from '../../user/user.controller';
import { UserService } from '../../user/user.service';
import { SubscriptionGuard } from '../../common/guards/subscription.guard';
import { ChatService } from '../../chat/chat.service';

describe('profile identity boundaries', () => {
  it('requires platform login for Nafath start, status and completion', () => {
    for (const handler of [AuthController.prototype.startNafath, AuthController.prototype.nafathStatus, AuthController.prototype.completeNafath]) {
      expect(new Reflector().getAllAndOverride(IS_PUBLIC_KEY, [handler, AuthController])).not.toBe(true);
    }
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, AuthController.prototype.nafathCallback)).toBe(true);
    expect(Reflect.getMetadata('__httpCode__', AuthController.prototype.nafathCallback)).toBe(200);
  });
  it('acknowledges API callbacks and returns browser form callbacks to the profile', async () => {
    const nafath = { handleCallback: jest.fn(), getReturnUrl: jest.fn(() => 'https://site.example/profile') };
    const controller = new AuthController({} as any, nafath as any);
    const response = { status: jest.fn().mockReturnThis(), location: jest.fn() };
    expect(await controller.nafathCallback({ state: 'provider-state' }, { headers: { accept: '*/*' } } as any, response as any)).toBe(true);
    expect(response.status).not.toHaveBeenCalled();
    await controller.nafathCallback({ state: 'provider-state' }, { headers: { accept: 'text/html,application/xhtml+xml' } } as any, response as any);
    expect(response.status).toHaveBeenCalledWith(303);
    expect(response.location).toHaveBeenCalledWith('https://site.example/profile?nafath=returned');
    nafath.handleCallback.mockRejectedValueOnce(new Error('Invalid token') as never);
    await controller.nafathCallback({ state: 'bad' }, { headers: { accept: 'text/html' } } as any, response as any);
    expect(response.location).toHaveBeenCalledWith('https://site.example/profile?nafath=error');
  });
  it('cannot assign Nafath identities through profile updates', async () => {
    const users = { updateUserDetails: jest.fn() };
    const controller = new UserController(users as any, {} as any);
    await controller.updateProfile({ user: { id: 'owner' } }, { firstName: 'Name', nationalId: '1000000000' } as any);
    expect(users.updateUserDetails).toHaveBeenCalledWith('owner', { firstName: 'Name' });
  });
  it('does not mark identity verified when a name is edited', async () => {
    const service: any = Object.create(UserService.prototype);
    const user = { id: 'owner', email: 'test@example.test', isVerified: false, nafathVerifiedAt: null };
    service.findOne = jest.fn(async () => user);
    service.userRepository = { save: jest.fn(async v => v) };
    await service.updateUserDetails('owner', { firstName: 'New name' });
    expect(user.isVerified).toBe(false);
    expect(user.nafathVerifiedAt).toBeNull();
  });
  it('does not leave identity proof attached to an edited national ID', async () => {
    const service: any = Object.create(UserService.prototype);
    service.findOne = jest.fn(async () => ({ id: 'owner', nationalId: '1000000000', nafathVerifiedAt: new Date() }));
    await expect(service.updateUserDetails('owner', { nationalId: '2000000000' })).rejects.toThrow('cannot be edited');
  });
  it('cannot forge Nafath verification when creating an account through employee management', async () => {
    const service: any = Object.create(UserService.prototype);
    service.findOneByEmail = jest.fn(async () => null);
    service.userRepository = { create: jest.fn(v => v), save: jest.fn(async v => v) };
    const result = await service.createUser({ email: 'new@example.test', role: 'user', nationalId: '1000000000', nafathVerifiedAt: new Date() });
    expect(result.nafathVerifiedAt).toBeFalsy();
  });
  it('cannot bypass verification by assigning admin or an identity during registration', async () => {
    const users = { createUserByemail: jest.fn(), findOneByEmail: jest.fn() };
    const service = new AuthService(users as any, {} as any, {} as any, {} as any, {} as any);
    jest.spyOn(service, 'generateAndSendOtp').mockResolvedValue('123456');
    await service.register({ email: 'test@example.test', role: 'admin', nationalId: '1000000000', departmentPermissions: { finance: 'manage' } } as any);
    expect(users.createUserByemail).toHaveBeenCalledWith(expect.objectContaining({ role: 'viewer' }), expect.any(String));
    expect(users.createUserByemail.mock.calls[0][0].nationalId).toBeUndefined();
    expect(users.createUserByemail.mock.calls[0][0].departmentPermissions).toBeUndefined();
  });
  it('rejects messages from unverified room members before persistence, including WebSocket calls', async () => {
    const service: any = Object.create(ChatService.prototype);
    service.chatRoomRepository = { findOne: jest.fn(async () => ({ participants: [{ id: 'owner' }] })) };
    service.userRepository = { findOne: jest.fn(async () => ({ id: 'owner', role: 'user', isVerified: true })) };
    service.messageRepository = { create: jest.fn() };
    await expect(service.sendMessage('room', 'owner', 'hello')).rejects.toThrow('Verify your identity');
    expect(service.messageRepository.create).not.toHaveBeenCalled();
  });
  it('lets an unverified signed-in viewer browse without a subscription', async () => {
    const subscriptions = { getSubscriptionStatus: jest.fn(async () => ({ active: false })) };
    const settings = { findOne: jest.fn(async () => null) };
    const guard = new SubscriptionGuard(new Reflector(), subscriptions as any, settings as any);
    const context = { getHandler: () => () => {}, getClass: () => class Controller {},
      switchToHttp: () => ({ getRequest: () => ({ method: 'GET', user: { id: 'owner', role: 'viewer' } }) }) } as any;
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(subscriptions.getSubscriptionStatus).not.toHaveBeenCalled();
  });

});
