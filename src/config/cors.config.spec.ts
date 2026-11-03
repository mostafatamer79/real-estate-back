import { createCorsOptions } from './cors.config';
import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

describe('Nafath callback CORS transport', () => {
  const delegate = createCorsOptions(['https://site.example']);
  const optionsFor = (path: string, method = 'POST') => {
    let options: CorsOptions = {};
    delegate({ path, method } as any, (_error, value) => { options = value; });
    return options;
  };
  it('does not reject cross-origin form POST navigation to the public callback', () => {
    expect(optionsFor('/api/auth/nafath/callback').origin).toBe(false);
    expect(optionsFor('/api/auth/nafath/callback/').origin).toBe(false);
  });
  it('keeps the existing origin restrictions on ordinary API requests', () => {
    const options = optionsFor('/api/offers');
    const callback = jest.fn();
    if (typeof options.origin !== 'function') throw new Error('Expected origin policy');
    options.origin('https://attacker.example', callback);
    expect(callback).toHaveBeenCalledWith(expect.any(Error));
    options.origin('https://site.example', callback);
    expect(callback).toHaveBeenLastCalledWith(null, true);
    expect(typeof optionsFor('/api/auth/nafath/callback/other').origin).toBe('function');
  });
});
