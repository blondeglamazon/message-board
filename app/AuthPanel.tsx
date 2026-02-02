"use client";

import { useState } from "react";

type User = {
  id: string;
  username: string;
};

type Props = {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
};

export default function AuthPanel({
  currentUser,
  setCurrentUser,
}: Props) {
  const [username, setUsername] = useState("");

  function handleLogin() {
    if (!username.trim()) return;

    const user: User = {
      id: crypto.randomUUID(),
      username,
    };

    localStorage.setItem("currentUser", JSON.stringify(user));
    setCurrentUser(user);
    setUsername("");
  }

  function handleLogout() {
    localStorage.removeItem("currentUser");
    setCurrentUser(null);
  }

  if (currentUser) {
    return (
      <div
        style={{
          background: "#fff",
          padding: 12,
          borderRadius: 10,
          marginBottom: 20,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>👋 Logged in as <strong>{currentUser.username}</strong></span>
        <button onClick={handleLogout}>Logout</button>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#fff",
        padding: 12,
        borderRadius: 10,
        marginBottom: 20,
      }}
    >
      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Enter username"
        style={{ padding: 8, marginRight: 8 }}
      />
      <button onClick={handleLogin}>Login</button>
    </div>
  );
}