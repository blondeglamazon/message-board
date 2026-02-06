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
        backgroundColor: "#000",
        color: "white"
      }}>
        {/* The Sidebar now automatically detects the user session */}
        <Sidebar />
        
        <main style={{ 
          marginLeft: "75px", 
          flex: 1, 
          padding: "20px", 
          minHeight: "100vh" 
        }}>
          {children}
        </main>
      </body>
    </html>
  );
}