"use client";

import { useState } from "react";
import { Mail, MessageCircle, Phone, X } from "lucide-react";
import Link from "next/link";

interface HelpFabProps {
  href?: string;
}

export function HelpFab({ href }: HelpFabProps) {
  const [open, setOpen] = useState(false);

  if (href) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Link
          href={href}
          aria-label="Get help"
          className="flex items-center justify-center h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <MessageCircle className="h-5 w-5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <a
            href="mailto:chrysayita@gmail.com"
            className="flex items-center gap-3 rounded-full bg-background border border-border shadow-lg px-4 py-2.5 text-sm font-medium hover:bg-accent transition-colors"
          >
            <Mail className="h-4 w-4 text-primary shrink-0" />
            Email us
          </a>
          <a
            href="tel:+233504288305"
            className="flex items-center gap-3 rounded-full bg-background border border-border shadow-lg px-4 py-2.5 text-sm font-medium hover:bg-accent transition-colors"
          >
            <Phone className="h-4 w-4 text-primary shrink-0" />
            Call us
          </a>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close help menu" : "Get help"}
        className="flex items-center justify-center h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all duration-200 hover:scale-105 active:scale-95"
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </button>
    </div>
  );
}
