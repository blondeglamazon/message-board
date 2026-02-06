import React from "react";
import Sidebar from "./components/Sidebar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ 
        margin: 0, 
        padding: 0, 
        display: "flex", 
        fontFamily: "sans-serif",
        // This is the new light baby blue background
        backgroundColor: "#E0F2FE", 
        minHeight: "100vh"
      }}>
        {/* The Sidebar component */}
        <Sidebar />
        
        <main style={{ 
          marginLeft: "75px", 
          flex: 1, 
          padding: "20px",
          // Ensures content is visible against the light background
          color: "#111827" 
        }}>
          {children}
        </main>
      </body>
    </html>
  );
}