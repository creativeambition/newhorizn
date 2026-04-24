"use client";

import { toast as sonnerToast } from "sonner";
import { AlertCircle } from "lucide-react";
import * as React from "react";

type ToastProps = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  icon?: React.ReactNode;
  action?: React.ReactNode;
};

export function toast({ title, description, variant, icon, action }: ToastProps) {
  const options: any = {
    description,
    icon: icon || (variant === "destructive" ? React.createElement(AlertCircle, { className: "h-5 w-5" }) : undefined),
    action: action,
  };

  if (variant === "destructive") {
    return sonnerToast.error(title, options);
  }

  return sonnerToast(title, options);
}

export function useToast() {
  return { toast };
}
