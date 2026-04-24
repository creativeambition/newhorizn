"use client";

import { usePathname } from "next/navigation";
import { Toaster as SonnerToaster } from "sonner";
import { useTheme } from "@/components/theme-provider";

export function Toaster() {
  const { resolvedTheme } = useTheme();
  const pathname = usePathname();

  const isAuthPage = pathname?.startsWith("/auth");

  return (
    <SonnerToaster
      position={isAuthPage ? "top-center" : "bottom-right"}
      theme={resolvedTheme}
      richColors
    />
  );
}
