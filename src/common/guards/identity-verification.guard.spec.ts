import { Reflector } from '@nestjs/core';
import { IdentityVerificationGuard } from './identity-verification.guard';
import { AllowUnverified } from '../decorators/allow-unverified.decorator';

function context(method: string, user?: object, handler = () => {}) {
  return { getHandler: () => handler, getClass: () => class Controller {},
    switchToHttp: () => ({ getRequest: () => ({ method, user }) }) } as any;
}
describe('IdentityVerificationGuard', () => {
  const guard = new IdentityVerificationGuard(new Reflector());
  it.each(['GET', 'HEAD', 'OPTIONS'])('allows %s for unverified accounts', method => {
    expect(guard.canActivate(context(method, { role: 'user' }))).toBe(true);
  });
  it.each(['POST', 'PUT', 'PATCH', 'DELETE'])('blocks %s even with the legacy verified flag', method => {
    expect(() => guard.canActivate(context(method, { role: 'owner', isVerified: true }))).toThrow('Verify your identity');
  });
  it('allows provider callbacks without an authenticated user', () => {
    expect(guard.canActivate(context('POST'))).toBe(true);
  });
  it('allows actual verified users and administrators', () => {
    expect(guard.canActivate(context('POST', { role: 'user', nafathVerifiedAt: new Date() }))).toBe(true);
    expect(guard.canActivate(context('POST', { role: 'admin' }))).toBe(true);
  });
  it('allows explicit profile maintenance exemptions', () => {
    class Profile { @AllowUnverified() update() {} }
    expect(guard.canActivate(context('PUT', { role: 'user' }, Profile.prototype.update))).toBe(true);
  });  it('supports an explicit temporary rollout bypass while keeping enforcement enabled by default', () => {
    const previous = process.env.NAFATH_ENFORCE_VERIFICATION;
    try {
      process.env.NAFATH_ENFORCE_VERIFICATION = 'false';
      expect(guard.canActivate(context('POST', { role: 'user' }))).toBe(true);
      delete process.env.NAFATH_ENFORCE_VERIFICATION;
      expect(() => guard.canActivate(context('POST', { role: 'user' }))).toThrow('Verify your identity');
    } finally {
      if (previous === undefined) delete process.env.NAFATH_ENFORCE_VERIFICATION;
      else process.env.NAFATH_ENFORCE_VERIFICATION = previous;
    }
  });

});
