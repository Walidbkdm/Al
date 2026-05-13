"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";

const routeMap: Record<string, string> = {
  d: "/",
  p: "/profit",
  r: "/returns",
  a: "/ads",
  l: "/delivery",
  h: "/health"
};

export function KeyboardShortcuts() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const lastKeyRef = React.useRef<{ key: string; ts: number } | null>(null);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (target && target.isContentEditable) return;

      const now = Date.now();
      const key = e.key.toLowerCase();

      if (key === "t" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        setTheme(theme === "dark" ? "light" : "dark");
        return;
      }

      if (key === "g") {
        lastKeyRef.current = { key: "g", ts: now };
        return;
      }

      const last = lastKeyRef.current;
      if (last && last.key === "g" && now - last.ts < 900) {
        const path = routeMap[key];
        if (path) {
          e.preventDefault();
          router.push(path);
          lastKeyRef.current = null;
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [router, theme, setTheme]);

  return null;
}
