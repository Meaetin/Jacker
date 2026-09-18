import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

function backToLogin(request: NextRequest, reason: string) {
  return NextResponse.redirect(new URL(`/login?error=${reason}`, request.url));
}

/**
 * `next` arrives on the query string, and `new URL()` resolves an absolute or
 * protocol-relative value against a different origin — which would make this
 * route an open redirect. Only same-origin paths get through.
 */
function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/dashboard";
  return raw;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNext(searchParams.get("next"));

  // A refused or cancelled consent comes back as an `error` param with the code
  // still absent, so this has to be checked before anything else.
  const providerError = searchParams.get("error");
  if (providerError) {
    const detail = searchParams.get("error_description") ?? "no description";
    console.error(`[auth] Provider returned "${providerError}": ${detail}`);
    return backToLogin(
      request,
      providerError === "access_denied" ? "oauth_denied" : "oauth_failed"
    );
  }

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error(`[auth] Code exchange failed: ${error.message}`);
      return backToLogin(request, "oauth_failed");
    }
    return NextResponse.redirect(new URL(next, request.url));
  }

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    if (error) {
      console.error(`[auth] OTP verification failed: ${error.message}`);
      return backToLogin(request, "link_expired");
    }
    return NextResponse.redirect(new URL(next, request.url));
  }

  console.error("[auth] Callback hit with neither a code nor a token hash");
  return backToLogin(request, "missing_code");
}
