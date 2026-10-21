import { CorsOptions } from "cors";

// Read allowed origins from CORS_WHITELIST
// Accepts "http://a.com,http://b.com" or "['http://a.com', 'http://b.com']"
export const getCorsWhitelist = (): string[] => {
  return process.env.CORS_WHITELIST?.match(/https?:\/\/[^\s'",\]]+/g) ?? [];
};

export const isOriginAllowed = (origin: string | undefined): boolean => {
  // Requests without an origin (Postman, curl, server to server) are allowed
  if (!origin) return true;
  return getCorsWhitelist().includes(origin);
};

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    callback(null, isOriginAllowed(origin));
  },
};
