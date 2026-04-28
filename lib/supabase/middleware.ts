import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { getSupabaseEnv, isSupabaseConfigured } from "@/lib/supabase/env";

export async function updateAuthSession(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const forwardedHeaders = new Headers(request.headers);
  forwardedHeaders.set("x-request-id", requestId);

  if (!isSupabaseConfigured()) {
    const response = NextResponse.next({
      request: {
        headers: forwardedHeaders
      }
    });
    response.headers.set("x-request-id", requestId);
    return response;
  }

  let response = NextResponse.next({
    request: {
      headers: forwardedHeaders
    }
  });
  const { url, publishableKey } = getSupabaseEnv();

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));

        response = NextResponse.next({
          request: {
            headers: forwardedHeaders
          }
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      }
    }
  });

  await supabase.auth.getUser();
  response.headers.set("x-request-id", requestId);

  return response;
}
