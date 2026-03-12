"use client";

import { useMemo } from "react";

interface Star {
  top: string;
  left: string;
}

export function StarField({ count = 40 }: { count?: number }) {
  const stars = useMemo<Star[]>(
    () =>
      Array.from({ length: count }, () => ({
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
      })),
    [count],
  );

  return (
    <div className="pointer-events-none absolute inset-0">
      {stars.map((star, i) => (
        <div
          key={i}
          className="absolute h-px w-px rounded-full bg-white opacity-40"
          style={{ top: star.top, left: star.left }}
        />
      ))}
    </div>
  );
}
