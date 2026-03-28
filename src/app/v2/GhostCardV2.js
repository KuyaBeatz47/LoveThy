"use client";

import { useMemo } from "react";

export default function GhostCardV2({ ghost, onSync }) {
  // 🧬 BRAINIAC LOGIC: Calculate glow intensity based on field pulse (0.0 to 1.0)
  const glowIntensity = useMemo(() => {
    const strength = ghost.intent_strength || 0.5;
    return Math.min(strength * 20, 40); // Scales the blur radius
  }, [ghost.intent_strength]);

  const isMerchant = ghost.is_verified;
  const isHighUnity = ghost.member_count > 1;

  return (
    <div style={cardStyle(glowIntensity, isMerchant, ghost.intent_strength)}>
      {/* 🌊 THE RESONANCE SHIMMER (Only for Unity Formations) */}
      {isHighUnity && <div style={shimmerStyle} />}

      <div style={contentWrapper}>
        <header style={headerStyle}>
          <div style={pulseDot(ghost.intent_strength)} />
          <span style={categoryLabel}>
            {isMerchant ? "⭐ MERCY HUB" : "NEIGHBORHOOD INTENT"}
          </span>
        </header>

        <h2 style={destinationStyle(isMerchant)}>{ghost.destination}</h2>

        <div style={statsRow}>
          <div style={statGroup}>
            <span style={statValue}>{ghost.member_count}</span>
            <span style={statLabel}>SOULS SYNCED</span>
          </div>
          <div style={statGroup}>
            <span style={statValue}>{Math.round((ghost.intent_strength || 0.5) * 100)}%</span>
            <span style={statLabel}>FIELD PULSE</span>
          </div>
        </div>

        <button 
          onClick={onSync} 
          style={isMerchant ? merchantBtn : syncBtn}
          onMouseEnter={(e) => e.target.style.transform = "scale(1.02)"}
          onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
        >
          {isMerchant ? "Enter the Blessing" : "Align with Flow"}
        </button>
      </div>
    </div>
  );
}

// --- 🎨 HIGHEST TIMELINE STYLING ---

const cardStyle = (glow, isMerchant, strength) => ({
  position: "relative",
  padding: "24px",
  borderRadius: "24px",
  background: isMerchant 
    ? "linear-gradient(145deg, #1e1b4b, #451a03)" // Midnight Gold
    : "#FFFFFF",
  border: isMerchant ? "2px solid #F59E0B" : "1px solid rgba(0,0,0,0.05)",
  boxShadow: isMerchant 
    ? `0 10px 30px rgba(245, 158, 11, 0.3)`
    : `0 10px ${glow}px rgba(16, 185, 129, ${strength * 0.2})`,
  transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
  overflow: "hidden",
  width: "100%"
});

const contentWrapper = {
  position: "relative",
  zIndex: 2
};

const shimmerStyle = {
  position: "absolute",
  top: 0, left: 0, right: 0, bottom: 0,
  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)",
  animation: "shimmer 3s infinite linear",
  zIndex: 1
};

const headerStyle = {
  display: "flex",
  alignItems: "center",
  marginBottom: "8px"
};

const pulseDot = (strength) => ({
  width: "8px",
  height: "8px",
  borderRadius: "50%",
  background: "#10B981",
  boxShadow: `0 0 ${strength * 12}px #10B981`,
  marginRight: "10px"
});

const categoryLabel = {
  fontSize: "0.7rem",
  fontWeight: "900",
  color: "#6B7280",
  letterSpacing: "0.05em"
};

const destinationStyle = (isMerchant) => ({
  fontSize: "1.6rem",
  fontWeight: "900",
  color: isMerchant ? "#FEF3C7" : "#111",
  margin: "8px 0",
  letterSpacing: "-0.03em"
});

const statsRow = {
  display: "flex",
  gap: "24px",
  marginTop: "16px",
  paddingTop: "16px",
  borderTop: "1px solid rgba(0,0,0,0.05)"
};

const statGroup = {
  display: "flex",
  flexDirection: "column"
};

const statValue = {
  fontSize: "1.1rem",
  fontWeight: "900",
  color: "#111"
};

const statLabel = {
  fontSize: "0.6rem",
  fontWeight: "bold",
  color: "#9CA3AF",
  textTransform: "uppercase"
};

const syncBtn = {
  width: "100%",
  padding: "16px",
  borderRadius: "16px",
  background: "#000",
  color: "#fff",
  border: "none",
  fontWeight: "bold",
  marginTop: "20px",
  cursor: "pointer",
  transition: "transform 0.2s ease"
};

const merchantBtn = {
  ...syncBtn,
  background: "linear-gradient(90deg, #F59E0B, #D97706)",
  color: "#FFF"
};


