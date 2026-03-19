"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthModal({ onClose }) {
  const [loading, setLoading] = useState(false);

  async function handleDevLogin() {
    setLoading(true);
    // Signs the user in anonymously - triggers the session in page.js
    const { error } = await supabase.auth.signInAnonymously();

    if (error) {
      console.error("Auth error:", error.message);
      alert("Entrance failed: " + error.message);
    } else {
      onClose(); // Close modal -> page.js sees the session -> Feed Loads!
    }
    setLoading(false);
  }

  return (
    <div style={overlay}>
      <div style={modal}>
        <h2 style={{ marginBottom: 12, fontSize: 22, fontWeight: 700, color: '#2D3748' }}>
          Enter Neighborhood
        </h2>
        <p style={{ color: '#718096', fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
          Welcome to the LoveThy trust radius. <br/> 
          Continuing will create a temporary local session.
        </p>

        <button 
          onClick={handleDevLogin} 
          disabled={loading} 
          style={buttonStyle}
        >
          {loading ? "Opening Door..." : "Continue to Feed"}
        </button>

        <button 
          onClick={onClose} 
          style={{ 
            marginTop: 15, 
            background: 'none', 
            border: 'none', 
            color: '#A0AEC0', 
            cursor: 'pointer',
            fontSize: 14 
          }}
        >
          Nevermind
        </button>
      </div>
    </div>
  );
}

// --- Styles (Matching page.js Palette) ---
const overlay = {
  position: "fixed",
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: "rgba(0,0,0,0.4)",
  display: "flex", justifyContent: "center", alignItems: "center",
  zIndex: 1000,
  backdropFilter: "blur(2px)",
};

const modal = {
  background: "white",
  padding: "40px 30px",
  borderRadius: 20,
  width: "100%",
  maxWidth: 340,
  textAlign: 'center',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
};

const buttonStyle = {
  width: "100%",
  padding: "14px",
  backgroundColor: "#2D3748",
  color: "white",
  border: "none",
  borderRadius: 10,
  fontWeight: "bold",
  fontSize: 16,
  cursor: "pointer",
  transition: "opacity 0.2s",
};