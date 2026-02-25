"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // Supabase automatically processes the secure login tokens in the background.
    // We just need to forward the user to their profile!
    router.push("/profile");
  }, [router]);

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <p className="text-lg text-gray-500 animate-pulse">
        Connecting your account...
      </p>
    </div>
  );
}