import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "./utils/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  const { data: assuranceData, error: assuranceError } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (assuranceError || assuranceData.currentLevel !== "aal2") {
    const mfaUrl = request.nextUrl.clone();
    mfaUrl.pathname = "/login/mfa";
    mfaUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(mfaUrl);
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
