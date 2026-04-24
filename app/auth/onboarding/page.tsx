import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OnboardingContent from "./OnboardingClient";

export default async function OnboardingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Not authenticated — redirect to landing
    redirect("/");
  }

  // Check if this user already has an accommodation profile
  const { data: accommodation, error } = await supabase
    .from("accommodations")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (error) {
    // If there's an error reading the profile, be conservative and redirect to dashboard
    redirect("/dashboard");
  }

  if (accommodation && accommodation.id) {
    // Already onboarded
    redirect("/dashboard");
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}
