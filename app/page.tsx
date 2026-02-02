"use client";

import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";

/* ---------- TYPES ---------- */
type Post = {
  username: string;
  message: string;
  time: string;
};

type User = {
  id: string;
  email: string;
};

export default function Page() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  /* 🔑 AUTH SESSION LISTENER */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setCurrentUser({ id: data.session.user.id, email: data.session.user.email! });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ? { id: session.user.id, email: session.user.email! } : null);
    });

    return () => subscription.unsubscribe();
  }, []);

  /* 📥 FETCH & LISTEN TO POSTS (REALTIME) */
  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from("posts")
        .select(`content, created_at, author_id, profiles(email)`)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching:", error.message);
      } else if (data) {
        const formatted = data.map((p: any) => ({
          username: p.profiles?.email || "User",
          message: p.content,
          time: new Date(p.created_at).toLocaleTimeString(),
        }));
        setPosts(formatted);
      }
    };

    fetchPosts();

    const channel = supabase
      .channel('realtime-posts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, 
      (payload) => {
        const newPost = {
          username: "User", // Will refresh on reload to show real email
          message: payload.new.content,
          time: new Date(payload.new.created_at).toLocaleTimeString(),
        };
        setPosts((prev) => [newPost, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  /* 🛡️ ACTIONS */
  const handleSignUp = async () => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert(error.message);
    else alert("Check your email for a confirmation link!");
  };

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
  };

  const handlePost = async () => {
    if (!currentUser || !message.trim()) return;
    const { error } = await supabase
      .from("posts")
      .insert([{ content: message, author_id: currentUser.id }]);
    if (error) alert(error.message);
    else setMessage("");
  };

  /* 🎨 UI RENDER */
  return (
    <main style={{ maxWidth: 600, margin: "40px auto", fontFamily: "sans-serif", padding: "20px" }}>
      <h1>🧵 Message Board</h1>

      {!currentUser ? (
        <div style={{ 
          border: "2px solid #007bff", 
          padding: "20px", 
          borderRadius: "8px", 
          marginBottom: "20px", 
          backgroundColor: "#fff",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)" 
        }}>
          <h3 style={{ marginTop: 0, color: "#333" }}>Login or Sign Up</h3>
          
          <input 
            placeholder="Email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            style={{ 
              display: "block", 
              marginBottom: "10px", 
              width: "100%", 
              padding: "10px", 
              border: "1px solid #ccc", 
              borderRadius: "4px",
              boxSizing: "border-box" 
            }} 
          />
          
          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            style={{ 
              display: "block", 
              marginBottom: "20px", 
              width: "100%", 
              padding: "10px", 
              border: "1px solid #ccc", 
              borderRadius: "4px",
              boxSizing: "border-box" 
            }} 
          />
          
          <div style={{ display: "flex", gap: "10px" }}>
            <button 
              onClick={handleLogin} 
              style={{ flex: 1, padding: "10px", cursor: "pointer", backgroundColor: "#f0f0f0", border: "1px solid #ccc", borderRadius: "4px" }}
            >
              Login
            </button>
            <button 
              onClick={handleSignUp} 
              style={{ flex: 1, padding: "10px", cursor: "pointer", backgroundColor: "#f0f0f0", border: "1px solid #ccc", borderRadius: "4px" }}
            >
              Sign Up
            </button>
          </div>
        </div>
      ) : (
        <div style={{ background: "#e8f5ff", padding: "15px", borderRadius: "8px", marginBottom: "20px", border: "1px solid #b3d7ff" }}>
          <span>✅ Logged in as: <strong>{currentUser.email}</strong></span>
          <button onClick={() => supabase.auth.signOut()} style={{ marginLeft: "15px", padding: "5px 10px", cursor: "pointer" }}>Logout</button>
        </div>
      )}

      <div style={{ marginBottom: "20px" }}>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write a message..."
          style={{ width: "100%", height: "80px", padding: "10px", borderRadius: "4px", border: "1px solid #ccc" }}
        />
        <button onClick={handlePost} style={{ marginTop: "10px", width: "100%", padding: "10px", background: "#007bff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
          Post
        </button>
      </div>

      {posts.map((post, index) => (
        <div key={index} style={{ background: "#f9f9f9", padding: "15px", borderRadius: "8px", marginBottom: "10px", border: "1px solid #eee" }}>
          <strong>{post.username}</strong>
          <div style={{ margin: "5px 0" }}>{post.message}</div>
          <small style={{ color: "#888" }}>{post.time}</small>
        </div>
      ))}
    </main>
  );
}