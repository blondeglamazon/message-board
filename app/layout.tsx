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
        backgroundColor: "#000000", // Dark background
        color: "#FFFFFF",           // Ensures global text defaults to white
      }}>
        {/* The Sidebar component manages dynamic user routing */}
        <Sidebar />
        
        {/* Main content area */}
        <main style={{ 
          marginLeft: "75px", 
          flex: 1, 
          padding: "20px", 
          minHeight: "100vh",
          // This line forces all child text elements (like posts) to be visible
          colorScheme: "dark" 
        }}>
          {children}
        </main>
      </body>
    </html>
  );
}