import type { Request } from "express";
import type {
  CorsOptions,
  CorsOptionsDelegate,
} from "@nestjs/common/interfaces/external/cors-options.interface";

const DIGITAL_BROKERAGE_REGEX =
  /^https?:\/\/(?:[a-zA-Z0-9-]+\.)*digitalbrokerage\.sa(?::\d+)?$/;

export function createCorsOptions(
  allowedOrigins: string[],
): CorsOptionsDelegate<Request> {
  const normalizedAllowed = allowedOrigins
    .map((o) => o.replace(/\/+$/, ""))
    .filter(Boolean);

  const isAllowedOrigin = (origin: string): boolean => {
    if (!origin || normalizedAllowed.length === 0) return true;
    const cleanOrigin = origin.replace(/\/+$/, "");
    if (normalizedAllowed.includes(cleanOrigin)) return true;
    if (DIGITAL_BROKERAGE_REGEX.test(cleanOrigin)) return true;
    return false;
  };

  const options: CorsOptions = {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin || "")) {
        callback(null, true);
        return;
      }
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-lang",
      "lang",
      "Accept",
      "Origin",
      "X-Requested-With",
      "Range",
      "Cache-Control",
      "Pragma",
      "If-None-Match",
      "If-Modified-Since",
    ],
  };
  return (request, callback) => {
    const isNafathReturn =
      request.path.replace(/\/+$/, "") === "/api/auth/nafath/callback" &&
      ["GET", "POST"].includes(request.method);
    // Cross-origin form navigation needs no CORS permission to read the response.
    // Skip origin rejection only here; state correlation + signed JWT authenticate
    // the callback. No Access-Control-Allow-Origin header is granted to that origin.
    callback(null, isNafathReturn ? { ...options, origin: false } : options);
  };
}
