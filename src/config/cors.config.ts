import type { Request } from 'express';
import type { CorsOptions, CorsOptionsDelegate } from '@nestjs/common/interfaces/external/cors-options.interface';

export function createCorsOptions(allowedOrigins: string[]): CorsOptionsDelegate<Request> {
  const options: CorsOptions = {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-lang', 'lang'],
  };
  return (request, callback) => {
    const isNafathReturn = request.path.replace(/\/+$/, '') === '/api/auth/nafath/callback' && ['GET', 'POST'].includes(request.method);
    // Cross-origin form navigation needs no CORS permission to read the response.
    // Skip origin rejection only here; state correlation + signed JWT authenticate
    // the callback. No Access-Control-Allow-Origin header is granted to that origin.
    callback(null, isNafathReturn ? { ...options, origin: false } : options);
  };
}
