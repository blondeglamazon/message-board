"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Connecting your account...");

  useEffect(() => {
    // 1. Initialize the client securely on the device
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // 2. Read the URL directly from the window (Bypasses Next.js static build SSR issues)
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");

    if (code) {
      // 3. EXPLICIT PKCE EXCHANGE: Mandatory for Capacitor/Android to establish the session
      supabase.auth.exchangeCodeForSession(code)
        .then(({ error }) => {
          if (error) {
            console.error("Auth exchange error:", error.message);
            setStatus("Login failed. Redirecting...");
            setTimeout(() => router.replace("/login"), 2000);
          } else {
            // Success! Send them to the profile page (using replace to avoid back-button loops)
            router.replace("/profile"); 
          }
        })
        .catch(() => {
          setStatus("An error occurred. Redirecting...");
          setTimeout(() => router.replace("/login"), 2000);
        });
    } else {
      // If there's no code (e.g., standard email/password login that doesn't use OAuth redirects)
      // just send them to the profile safely.
      router.replace("/profile");
    }
  }, [router]);

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <p className="text-lg text-gray-500 animate-pulse">
        {status}
      </p>
    </div>
  );
}