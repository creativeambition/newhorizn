"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Compass, Home } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background overflow-hidden relative">
      {/* Background blobs for depth */}
      <div className="absolute top-1/4 -left-20 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-float" />
      <div
        className="absolute bottom-1/4 -right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float"
        style={{ animationDelay: "-2s" }}
      />

      <div className="relative z-10 w-full max-w-md text-center">
        {/* Logo/Icon area */}
        {/* <div className="mb-8 flex justify-center animate-fade-in">
          <div className="relative">
            <div className="p-6 rounded-3xl bg-primary/5 glass border border-primary/10 animate-float">
              <Compass className="size-16 text-primary" strokeWidth={1.5} />
            </div>
          </div>
        </div> */}

        {/* Text Content */}
        <div className="space-y-4 animate-fade-in-up">
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground text-gradient">
            Destination Not Found
          </h1>
          <p className="text-muted-foreground text-base md:text-lg leading-relaxed max-w-sm mx-auto">
            It seems you've wandered off the map. This page doesn't exist or has
            been moved to a new horizon.
          </p>
        </div>

        {/* Action Buttons */}
        <div
          className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up"
          style={{ animationDelay: "0.2s" }}
        >
          <Link
            className="w-full flex flex-row items-center justify-center sm:w-auto h-12 px-8 rounded-xl glass hover:bg-primary/5 transition-all duration-300 gap-2"
            href="/"
          >
            <ArrowLeft className="size-4" />
            Go Back
          </Link>
        </div>
      </div>
    </main>
  );
}
