"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function IntentModalV2({ coords, onClose }) {
  const [destination, setDestination] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePublish = async () => {
    if (!destination) return;
    setLoading(true);
  
    try {
      const { error } = await supabase.rpc('create_neighborhood_event_v2', {
        _destination: destination,
        _lat: coords.lat,
        _lng: coords.lng
      });
  
      if (error) {
        console.error("RPC ERROR:", error.message);
        alert(error.message);
      } else {
        onClose();
      }
    } catch (err) {
      console.error("SYSTEM ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={overlayStyle}>
      <div style={sheetStyle}>
        <div style={dragHandle} />
        
        <h2 style={modalTitle}>Set Your Intent</h2>
        <p style={modalSub}>Where is your light heading in the neighborhood?</p>

        <input
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="e.g. 47 Infinite, Starbucks, Trader Joes..."
          style={inputStyle}
          autoFocus
        />

        <div style={actionRow}>
          <button 
            onClick={handlePublish} 
            style={publishBtn(loading)}
            disabled={loading}
          >
            {loading ? "Anchoring..." : "Create Intent"}
          </button>
          
          <button onClick={onClose} style={cancelBtn}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// --- 🎨 CALM TECHNOLOGY STYLING ---

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.7)",
  backdropFilter: "blur(8px)",
  display: "flex",
  alignItems: "flex-end",
  zIndex: 1000,
  transition: "all 0.3s ease"
};

const sheetStyle = {
  background: "#fff",
  width: "100%",
  maxWidth: "450px",
  margin: "0 auto",
  padding: "32px 24px 48px 24px",
  borderTopLeftRadius: "32px",
  borderTopRightRadius: "32px",
  boxShadow: "0 -10px 40px rgba(0,0,0,0.2)",
  animation: "slideUp 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)"
};

const dragHandle = {
  width: "40px",
  height: "5px",
  background: "#E5E7EB",
  borderRadius: "10px",
  margin: "0 auto 24px auto"
};

const modalTitle = {
  fontSize: "1.8rem",
  fontWeight: "900",
  marginBottom: "8px",
  color: "#111",
  letterSpacing: "-0.04em"
};

const modalSub = {
  fontSize: "0.95rem",
  color: "#6B7280",
  marginBottom: "24px",
  lineHeight: "1.4"
};

const inputStyle = {
  width: "100%",
  padding: "18px",
  borderRadius: "16px",
  border: "2px solid #F3F4F6",
  fontSize: "1.1rem",
  marginBottom: "20px",
  outline: "none",
  transition: "border-color 0.2s",
  background: "#F9FAFB",
  color: "#000"
};

const actionRow = {
  display: "flex",
  flexDirection: "column",
  gap: "12px"
};

const publishBtn = (loading) => ({
  width: "100%",
  padding: "18px",
  background: loading ? "#9CA3AF" : "#000",
  color: "#fff",
  border: "none",
  borderRadius: "18px",
  fontWeight: "800",
  fontSize: "1.1rem",
  cursor: "pointer",
  transition: "transform 0.1s ease"
});

const cancelBtn = {
  width: "100%",
  padding: "16px",
  background: "transparent",
  color: "#6B7280",
  border: "none",
  fontWeight: "bold",
  cursor: "pointer"
};