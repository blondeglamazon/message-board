import React from "react";
import Sidebar from "./components/Sidebar"; // Matches the Capital S

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Mock user for the sidebar to link to your profile
  const mockUser = { 
    username: "blondeglamazon", 
    avatar_url: null 
  };

  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, display: "flex", fontFamily: "sans-serif" }}>
        {/* The Sidebar is now global */}
        <Sidebar currentUser={mockUser} />
        
        <main style={{ marginLeft: "75px", flex: 1, padding: "20px", minHeight: "100vh" }}>
          {children}
        </main>
      </body>
    </html>
  );
}