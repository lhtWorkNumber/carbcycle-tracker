function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function isPlaceholder(value: string | undefined) {
  if (!value) {
    return true;
  }

  return (
    value.includes("placeholder") ||
    value.includes("your-project") ||
    value.includes("your-anon-key")
  );
}

export function isSupabaseConfigured() {
  return !isPlaceholder(process.env.NEXT_PUBLIC_SUPABASE_URL) && !isPlaceholder(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

export function getSupabaseEnv() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase environment variables are not configured.");
  }

  return {
    url: requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    publishableKey: requireEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")
  };
}
