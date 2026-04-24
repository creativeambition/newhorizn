"use client";
import { useAuth } from "@/lib/context/auth-context";
import { Sparkles } from "lucide-react";

export function Logo({ className }: { className?: string }) {
  const { user, accommodationData } = useAuth();
  return (
    <div className="relative active:scale-95 transition-all duration-200">
      <img
        src="/logo.svg"
        alt="Logo"
        width={32}
        height={32}
        className={className}
      />

      {user && accommodationData?.plan === "pro" && (
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3">
          <Sparkles className="text-purple-400 w-4 rotate-8" />
        </div>
      )}
    </div>
  );
}
