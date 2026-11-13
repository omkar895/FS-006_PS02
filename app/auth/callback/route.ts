import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/passenger";

  if (code) {
    try {
      const supabase = await createServerSupabaseClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`);
      }
    } catch {
      // Session exchange failed
    }
  }

  // Fallback to target URL or login
  return NextResponse.redirect(`${origin}/login?error=oauth_exchange_failed`);
}
