import { z } from "zod";

const productionSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(60),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  DATABASE_URL: z.string().startsWith("postgresql://").or(z.string().startsWith("postgres://")),
  DIRECT_URL: z.string().startsWith("postgresql://").or(z.string().startsWith("postgres://")),
  PRISMA_SCHEMA_PATH: z.string().min(1)
});

const developmentSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(60),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().default("https://placeholder-project.supabase.co"),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1).default("placeholder-anon-key"),
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().optional(),
  PRISMA_SCHEMA_PATH: z.string().optional()
});

function placeholderStrings() {
  return ["placeholder", "your-project", "your-anon-key", "your-domain", "password"];
}

function containsPlaceholder(value: string | undefined) {
  if (!value) {
    return true;
  }

  return placeholderStrings().some((needle) => value.includes(needle));
}

export function validateServerEnv(mode: "development" | "production") {
  const schema = mode === "production" ? productionSchema : developmentSchema;
  const parsed = schema.safeParse(process.env);

  if (!parsed.success) {
    return {
      success: false as const,
      message: parsed.error.flatten()
    };
  }

  if (mode === "production") {
    if (containsPlaceholder(parsed.data.NEXT_PUBLIC_SUPABASE_URL) || containsPlaceholder(parsed.data.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)) {
      return {
        success: false as const,
        message: "Supabase 环境变量仍为占位值，请替换成真实配置。"
      };
    }

    if (containsPlaceholder(parsed.data.DATABASE_URL) || containsPlaceholder(parsed.data.DIRECT_URL)) {
      return {
        success: false as const,
        message: "生产数据库连接串仍为占位值，请替换成真实 PostgreSQL 连接。"
      };
    }
  }

  return {
    success: true as const,
    data: parsed.data
  };
}

export function resolveServerEnvMode(): "development" | "production" {
  if (process.env.APP_ENV === "production" || process.env.APP_ENV === "staging") {
    return "production";
  }

  if (process.env.APP_ENV === "development") {
    return "development";
  }

  if (process.env.NODE_ENV !== "production") {
    return "development";
  }

  const databaseUrl = process.env.DATABASE_URL ?? "";
  return databaseUrl.startsWith("postgresql://") || databaseUrl.startsWith("postgres://") ? "production" : "development";
}
