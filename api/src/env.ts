import { loadEnv } from "@codexsun/framework/env";
import { z } from "zod";

const envSchema = z.object({
  API_HOST: z.string().min(1).optional(),
  API_PORT: z.coerce.number().int().positive().optional(),
  PLATFORM_API_URL: z.string().url("PLATFORM_API_URL must be a valid URL").optional(),
  DB_HOST: z.string().default("127.0.0.1"),
  DB_MASTER_NAME: z.string().min(1, "DB_MASTER_NAME is required").optional(),
  DB_NAME: z.string().min(1, "DB_NAME is required").optional(),
  DB_PASSWORD: z.string(),
  DB_PORT: z.coerce.number().int().positive(),
  DB_USER: z.string().min(1, "DB_USER is required"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  NODE_ENV: z.enum(["development", "test", "staging", "production"]).default("development")
});

const loaded = loadEnv(envSchema);
const platformApiUrl =
  loaded.PLATFORM_API_URL ??
  (loaded.API_HOST && loaded.API_PORT
    ? `http://${loaded.API_HOST === "0.0.0.0" ? "127.0.0.1" : loaded.API_HOST}:${loaded.API_PORT}`
    : "");
const masterDatabaseName = loaded.DB_MASTER_NAME ?? loaded.DB_NAME ?? "";

if (!platformApiUrl) {
  throw new Error("PLATFORM_API_URL or API_HOST and API_PORT are required.");
}
if (!masterDatabaseName) {
  throw new Error("DB_MASTER_NAME or DB_NAME is required.");
}

export const env = {
  ...loaded,
  DB_MASTER_NAME: masterDatabaseName,
  PLATFORM_API_URL: platformApiUrl
};
