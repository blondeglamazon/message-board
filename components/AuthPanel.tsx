"use client";

import { useState } from "react";
import { supabase } from "../app/lib/supabase/client";

export type User = {
  id: string;
  email: string;
};

type Props = {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
};

export default function AuthPanel({
  currentUser,
  setCurrentUser,
}: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin() {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    setCurrentUser({
      id: data.user.id,
      email: data.user.email!,
    });
  }

  async function handleSignup() {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert("Check your email to confirm your account");
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setCurrentUser(null);
  }

  if (currentUser) {
    return (
      <div style={{ background: "#fff", padding: 12, borderRadius: 10 }}>
        👋 {currentUser.email}
        <button onClick={handleLogout} style={{ marginLeft: 10 }}>
          Logout
        </button>
      </div>
    );
  }

  return (
    <div style={{ background: "#fff", padding: 12, borderRadius: 10 }}>
      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <div style={{ marginTop: 10 }}>
        <button onClick={handleLogin}>Login</button>
        <button onClick={handleSignup} style={{ marginLeft: 10 }}>
          Sign Up
        </button>
      </div>
    </div>
  );
}