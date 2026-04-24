import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  let next = searchParams.get("next") ?? "/dashboard";
  if (!next.startsWith("/")) next = "/dashboard";

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("Exchange error:", error);
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
  }

  // After exchange, check if the user has completed onboarding.
  // If not, send them there regardless of the intended `next` destination.
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: accommodation } = await supabase
      .from("accommodations")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (!accommodation) {
      return NextResponse.redirect(`${origin}/auth/onboarding`);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
