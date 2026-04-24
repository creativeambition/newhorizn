"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CircularProgressProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  label?: string;
  showText?: boolean;
}

export function CircularProgress({
  value,
  max,
  size = 40,
  strokeWidth = 4,
  className,
  label,
  showText = true,
}: CircularProgressProps) {
  const [open, setOpen] = useState(false);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const offset = circumference - (percentage / 100) * circumference;

  const content = (
    <div
      className={cn(
        "relative inline-flex items-center justify-center cursor-help",
        className,
      )}
      onClick={() => setOpen(!open)}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-muted/20"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-primary transition-all duration-500 ease-in-out"
        />
      </svg>
      {showText && (
        <div className="absolute flex flex-col items-center justify-center text-[10px] font-bold leading-none">
          <span className="text-foreground">{Math.round(value)}</span>
        </div>
      )}
    </div>
  );

  if (!label) return content;

  return (
    <TooltipProvider>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-center text-primary">
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
