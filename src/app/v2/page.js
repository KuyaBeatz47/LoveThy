"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import IntentModalV2 from "./IntentModalV2";
import GhostCardV2 from "./GhostCardV2";

export default function V2Page() {
  const [field, setField] = useState({
    formations: [],
    user_state: {},
    vibration: "BALANCED"
  });

  const [coords, setCoords] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(false);

  // 📡 1. Fetch Megazord V4 (Predictive Field)
  const fetchField = async (c) => {
    try {
      const { data, error } = await supabase.rpc("get_megazord_state_v4", {
        user_lat: c.lat,
        user_lng: c.lng
      });

      if (error) {
        console.error("MEGAZORD ERROR:", error);
        return;
      }

      setField(prev => ({
        ...prev,
        formations: data?.formations || [],
        vibration: data?.vibration || "BALANCED"
      }));

    } catch (err) {
      console.error("FETCH ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  // ❤️ 2. Fetch Agape State (Burnout Protection + Role)
  const fetchAgapeState = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
  
      // We add .eq('user_id', user.id) to ensure we get ONLY your row
      const { data, error } = await supabase
        .from("agape_field_state")
        .select("*")
        .eq('user_id', user.id) 
        .maybeSingle(); // maybeSingle is safer than .single() during testing
  
      if (error) {
        console.error("AGAPE ERROR:", error);
        return;
      }
  
      if (data) {
        setField(prev => ({ ...prev, user_state: data }));
      }
    } catch (err) {
      console.error("AGAPE FETCH ERROR:", err);
    }
  };

  // 📍 3. Location Initialization
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(c);
        fetchField(c);
        fetchAgapeState();
      },
      () => {
        const fallback = { lat: 33.916, lng: -118.373 };
        setCoords(fallback);
        fetchField(fallback);
        fetchAgapeState();
      }
    );
  }, []);

  // 🔄 4. Heartbeat Sync (30s)
  useEffect(() => {
    if (!coords) return;
    const interval = setInterval(() => {
      fetchField(coords);
      fetchAgapeState();
    }, 30000);
    return () => clearInterval(interval);
  }, [coords]);

  return (
    <div style={containerStyle(field.vibration)}>
      <h1 style={titleStyle}>LoveThy V2</h1>

      {/* 🌐 Vibration Status */}
      <div style={vibeBadgeStyle}>
        {field.vibration} FIELD
      </div>

      {/* 👤 Sovereign Role */}
      {field.user_state?.role && (
        <div style={roleBadgeStyle}>
          Role: <strong>{field.user_state.role}</strong>
          <span style={{ fontSize: '0.7rem', display: 'block', opacity: 0.7 }}>
            Readiness: {field.user_state.readiness}
          </span>
        </div>
      )}

      {loading && <p style={{ textAlign: 'center' }}>Sensing the field...</p>}

      {/* ⚡ RESONANT FORMATIONS */}
      <div style={scrollArea}>
        {field.formations?.length > 0 ? (
          field.formations.map((f, i) => (
            <GhostCardV2
              key={i}
              ghost={{
                destination: f.destination,
                member_count: f.members || 1,
                intent_strength: f.intent_strength || 0.5,
                is_verified: f.is_verified || false
              }}
              onSync={() => fetchField(coords)}
            />
          ))
        ) : (
          !loading && <p style={emptyText}>The field is quiet. Be the first light.</p>
        )}
      </div>

      {/* ➕ Intent Trigger */}
      <button onClick={() => setActiveModal(true)} style={mainBtnStyle}>
        Open Intent
      </button>

      {/* 🧠 Intent Modal with Forced Re-Sync */}
{activeModal && coords && (
  <IntentModalV2
    coords={coords}
    onClose={async () => {
      setActiveModal(false);
      setLoading(true);

      setTimeout(async () => {
        if (coords) {
          await fetchField(coords);
          await fetchAgapeState();
        }
        setLoading(false);
      }, 800);
    }}
  />
)}
    </div>
  );
}

// --- 🎨 HIGHEST TIMELINE STYLING ---

const containerStyle = (vibration) => ({
  padding: 20,
  maxWidth: 420,
  margin: "0 auto",
  fontFamily: "Inter, sans-serif",
  minHeight: "100vh",
  transition: "background 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
  backgroundColor: 
    vibration === "EXPANSIVE" ? "#064e3b" : 
    vibration === "ABUNDANT" ? "#ECFDF5" : 
    vibration === "RESTORATIVE" ? "#FFFBEB" : "#FFF",
  color: vibration === "EXPANSIVE" ? "#fff" : "#000"
});

const titleStyle = {
  fontSize: "2.5rem",
  fontWeight: "900",
  letterSpacing: "-0.05em",
  marginBottom: 20,
  textAlign: "center"
};

const vibeBadgeStyle = {
  padding: "8px 16px",
  borderRadius: "20px",
  background: "#000",
  color: "#fff",
  fontSize: "0.75rem",
  fontWeight: "bold",
  width: "fit-content",
  margin: "0 auto 12px auto",
  textTransform: "uppercase"
};

const roleBadgeStyle = {
  padding: 16,
  borderRadius: "16px",
  background: "rgba(238, 242, 255, 0.8)",
  color: "#312E81",
  marginBottom: 24,
  textAlign: "center",
  backdropFilter: "blur(4px)",
  border: "1px solid rgba(255,255,255,0.3)"
};

const scrollArea = {
  display: "flex",
  flexDirection: "column",
  gap: "16px",
  marginBottom: "100px"
};

const mainBtnStyle = {
  position: "fixed",
  bottom: "30px",
  left: "50%",
  transform: "translateX(-50%)",
  width: "calc(100% - 40px)",
  maxWidth: "380px",
  padding: "18px",
  background: "#000",
  color: "#fff",
  border: "none",
  borderRadius: "18px",
  fontWeight: "900",
  fontSize: "1.1rem",
  cursor: "pointer",
  boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
  zIndex: 10
};

const emptyText = {
  textAlign: "center",
  opacity: 0.5,
  marginTop: 40,
  fontSize: "0.9rem"
};