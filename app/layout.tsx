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
        backgroundColor: "#000000", // Global page background
        color: "#FFFFFF",           // Default text color
      }}>
        <Sidebar />
        
        <main style={{ 
          marginLeft: "75px", 
          flex: 1, 
          padding: "20px", 
          minHeight: "100vh",
          // The following line ensures that browser-default 
          // elements (like scrollbars and inputs) use dark mode.
          colorScheme: "dark" 
        }}>
          {children}
        </main>
      </body>
    </html>
  );
}