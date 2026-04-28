"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const ROTATING_WORDS = ["Hostel", "Apartment", "Guest House", "Hotel", "Lodge"];

const ROTATE_INTERVAL_MS = 2800;

export function HeroCaption() {
  const [index, setIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState<number | undefined>(
    undefined,
  );
  const measureRef = useRef<HTMLSpanElement>(null);

  const measureWidth = useCallback(() => {
    if (measureRef.current) {
      const width = measureRef.current.offsetWidth;
      setContainerWidth(width);
    }
  }, []);

  useEffect(() => {
    // Measure initial width
    measureWidth();
  }, [measureWidth]);

  useEffect(() => {
    // Measure again whenever the word changes
    requestAnimationFrame(measureWidth);
  }, [index, measureWidth]);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % ROTATING_WORDS.length);
    }, ROTATE_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  const currentWord = ROTATING_WORDS[index];

  return (
    <>
      {/* Screen-reader-friendly label — crawlers read this, not the animated spans */}
      <h1
        className="text-5xl text-transparent font-bold tracking-tighter sm:text-4xl md:text-6xl lg:text-7xl bg-linear-to-b from-foreground to-foreground/70 bg-clip-text max-w-6xl animate-fade-in pb-1 md:pb-2"
        aria-label={`Effortless ${currentWord} Management`}
      >
        Effortless <br className="flex lg:hidden" />
        <span
          className="text-foreground inline-flex px-5 align-baseline rounded-full min-h-[1.5em] items-center justify-center overflow-hidden border-2 border-border"
          style={{
            width: containerWidth ? `${containerWidth + 45}px` : "fit-content",
            transition: "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
          aria-hidden="true"
        >
          {/* Hidden measurer: invisible span used only for width calculation */}
          <span
            ref={measureRef}
            className="absolute invisible whitespace-nowrap py-3"
          >
            {currentWord}
          </span>
          <span
            key={index}
            className="inline-block animate-word-rotate-in text-gradient py-3 text-center whitespace-nowrap"
          >
            {currentWord}
          </span>
        </span>{" "}
        <br />
        Management
      </h1>
    </>
  );
}
