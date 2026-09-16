import { NafathService } from './nafath.service';
import { JwtService } from '@nestjs/jwt';

describe('NafathService', () => {
  it('declares JwtService as an injectable dependency', () => {
    const dependencies = Reflect.getMetadata('design:paramtypes', NafathService);
    expect(dependencies[3]).toBe(JwtService);
  });

  it('creates a server-side Nafath request and persists the matching number', async () => {
    const repository = {
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
    };
    const config = {
      get: jest.fn(() => ({
        baseUrl: 'https://nafath.example.test',
        appId: 'server-app-id',
        appKey: 'server-app-key',
        audience: 'realestate',
        callbackSecret: 'callback-secret',
      })),
    };
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ transId: 'nafath-transaction', random: '80' }),
    });
    global.fetch = fetchMock as any;
    const service = new NafathService(repository as any, config as any, {} as any, {} as any);

    const result = await service.startAuthentication('1000000000', '198.51.100.10', 'ar');

    expect(fetchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/api/v1/mfa/request',
        search: expect.stringContaining('requestId='),
      }),
      expect.objectContaining({
        headers: expect.objectContaining({
          'APP-ID': 'server-app-id',
          'APP-KEY': 'server-app-key',
          'X-Forwarded-For': expect.stringContaining('198.51.100.10'),
        }),
      }),
    );
    expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({
      transId: 'nafath-transaction',
      random: '80',
      nationalId: '1000000000',
      status: 'WAITING',
    }));
    expect(result).toEqual(expect.objectContaining({
      transId: 'nafath-transaction',
      random: '80',
      clientSecret: expect.any(String),
    }));
  });
});
