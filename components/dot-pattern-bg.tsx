"use client";

import { useEffect, useRef } from "react";

export function DotPatternBg() {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      wrapperRef.current?.style.setProperty("--mx", `${e.clientX}px`);
      wrapperRef.current?.style.setProperty("--my", `${e.clientY}px`);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div ref={wrapperRef} className="fixed inset-0 pointer-events-none z-0">
      {/* dimmed base dots */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--muted-foreground),transparent_1px)] bg-size-[24px_24px] opacity-30" />
      {/* lit spotlight layer */}
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--muted-foreground),transparent_1px)] bg-size-[24px_24px] opacity-100"
        style={{
          WebkitMaskImage:
            "radial-gradient(circle 180px at var(--mx, -999px) var(--my, -999px), black 0%, transparent 100%)",
          maskImage:
            "radial-gradient(circle 180px at var(--mx, -999px) var(--my, -999px), black 0%, transparent 100%)",
        }}
      />
    </div>
  );
}
