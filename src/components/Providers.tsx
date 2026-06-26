"use client";

import { SessionProvider } from "next-auth/react";
import { useEffect } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  // Register the PWA service worker once on the client.
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      process.env.NODE_ENV === "production"
    ) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* no-op: PWA is progressive enhancement */
      });
    }
  }, []);

  return <SessionProvider>{children}</SessionProvider>;
}
