"use client";

import { Dispatch, SetStateAction, useEffect } from "react";
import { WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

export function OfflineStatus({
  isOnline,
  setIsOnline,
}: {
  isOnline: boolean;
  setIsOnline: Dispatch<SetStateAction<boolean>>;
}) {
  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
    }

    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline) {
    return;
  }

  return (
    <div
      className={cn(
        "h-6",
        "flex items-center justify-center gap-2 px-2 py-1 text-xs font-medium",
        "text-orange-600 bg-red-100",
        "animate-pulse"
      )}
    >
      <WifiOff className="h-4 w-4" />
      <span>Offline - Changes will sync when online</span>
    </div>
  );
}
