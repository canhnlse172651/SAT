import { z } from 'zod';

// Every variable is documented in /.env.example. Invalid configuration fails at startup, not at first use.
const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
  MONGODB_URI: z.string().min(1).default('mongodb://127.0.0.1:27017/sat'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  WEB_DIST_DIR: z.string().min(1).optional(),
  // Public origin of the app (scheme://host[:port]); the Origin check and cookie `Secure` derive from it.
  APP_ORIGIN: z.url().optional(),
  SESSION_TTL_GV_HOURS: z.coerce.number().int().positive().default(8),
  SESSION_TTL_HV_DAYS: z.coerce.number().int().positive().default(30),
  // Dev FileStorage root (relative to the process cwd).
  UPLOADS_DIR: z.string().min(1).default('var/uploads'),
  // Max bytes per stored file (default 20 MiB).
  UPLOAD_MAX_BYTES: z.coerce
    .number()
    .int()
    .positive()
    .default(20 * 1024 * 1024),
  // Dev e-mail outbox: how long a simulated send takes, so "Đang gửi email" is visible (0 in API tests).
  DEV_EMAIL_DELAY_MS: z.coerce.number().int().min(0).max(60_000).default(1_500),
  // Overrides cookie `Secure` outside production only (hermetic e2e over http).
  COOKIE_SECURE: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
});

const DEV_APP_ORIGIN = 'http://localhost:5173';

const ConfigSchema = EnvSchema.refine((env) => env.NODE_ENV !== 'production' || env.APP_ORIGIN, {
  path: ['APP_ORIGIN'],
  error: 'APP_ORIGIN is required in production',
}).transform((env) => ({
  ...env,
  APP_ORIGIN: new URL(env.APP_ORIGIN ?? DEV_APP_ORIGIN).origin,
}));

export type Config = z.infer<typeof ConfigSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = ConfigSchema.safeParse(env);
  if (!parsed.success) {
    throw new Error(`Invalid environment configuration:\n${z.prettifyError(parsed.error)}`);
  }
  return parsed.data;
}
