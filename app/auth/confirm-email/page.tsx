import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import ConfirmEmailClient from "./confirm-email-client";

export default async function ConfirmEmailPage() {
  const cookieStore = await cookies();
  const email = cookieStore.get("sb-pending-email")?.value;

  if (!email) {
    // If no secure cookie, we can't verify. Redirect to register is safest.
    redirect("/auth/register");
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <ConfirmEmailClient email={email} />
    </Suspense>
  );
}
