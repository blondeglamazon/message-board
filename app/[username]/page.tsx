import { supabase } from "../lib/supabaseClient";
import { notFound } from "next/navigation";
import React from "react";

interface ProfilePageProps {
  params: {
    username: string;
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = params;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (error || !profile) {
    notFound();
  }

  return (
    <div style={{ padding: "40px", maxWidth: "800px", margin: "0 auto" }}>
      <header style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        <div style={{ 
          width: "80px", 
          height: "80px", 
          borderRadius: "50%", 
          backgroundColor: "#6366f1", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          color: "white",
          fontSize: "30px",
          fontWeight: "bold"
        }}>
          {profile.username[0].toUpperCase()}
        </div>
        <div>
          <h1 style={{ margin: 0 }}>{profile.display_name || profile.username}</h1>
          <p style={{ color: "#666" }}>@{profile.username}</p>
        </div>
      </header>
      <hr style={{ margin: "20px 0", border: "0", borderTop: "1px solid #eee" }} />
      <p>{profile.bio || "No bio yet."}</p>
    </div>
  );
}