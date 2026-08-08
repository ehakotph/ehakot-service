import 'dotenv/config';
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum([
    "development",
    "production",
  ]).default("development"),

  PORT: z.coerce
    .number()
    .optional()
    .default(5001)
    .describe('The application port number'),

  PRIVATE_ACCESS_KEY: z.string()
    .describe('The private access key for JWT signing'),

  PUBLIC_ACCESS_KEY: z.string()
    .describe('The public access key for JWT signing'),

  DATABASE_URL: z.url().describe('Database connection URL'),

  DATABASE_USE_SSL: z.enum(["true", "false"]).default("false").transform((val) => val === "true").describe('Use SSL for database connection'),

  SALT_WORK_FACTOR: z.coerce
    .number()
    .optional()
    .default(10)
    .describe('The salt work factor for hashing passwords'),

  JWT_EXPIRES_IN: z.string()
    .default('1d')
    .transform((val) => val as import('jsonwebtoken').SignOptions['expiresIn'])
    .describe('The expiration time for JWT tokens'),

  SMTP_HOST: z.string()
    .optional()
    .default('smtp.gmail.com')
    .describe('The SMTP host'),

  SMTP_PORT: z.coerce
    .number()
    .optional()
    .default(587)
    .describe('The SMTP port'),

  SMTP_USERNAME: z.string()
    .optional()
    .default('')
    .describe('The SMTP username'),

  SMTP_PASSWORD: z.string()
    .optional()
    .default('')
    .describe('The SMTP password'),
});

export type Env = z.infer<typeof envSchema>;

// Docker --env-file does not strip quotes, so we strip them here
const cleanedEnv = Object.fromEntries(
  Object.entries(process.env).map(([key, value]) => {
    if (typeof value === 'string' && value.startsWith('"') && value.endsWith('"')) {
      return [key, value.slice(1, -1)];
    }
    if (typeof value === 'string' && value.startsWith("'") && value.endsWith("'")) {
      return [key, value.slice(1, -1)];
    }
    return [key, value];
  })
);

const result = envSchema.safeParse(cleanedEnv);

if (!result.success) {
  const formattedErrors = z.flattenError(result.error).fieldErrors;
  throw new Error(
    `Invalid environment variables:\n${JSON.stringify(
      formattedErrors,
      null,
      2,
    )}`,
  );
}

export const env: Env = result.data;