"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function IntentModal({ type, onClose }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title || !description) {
      alert("Please fill in all fields.");
      return;
    }

    setLoading(true);

    // 1. Capture Real GPS
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const user_lat = position.coords.latitude;
        const user_lng = position.coords.longitude;

        try {
          // 2. Get Authenticated User
          const { data: { user }, error: authError } = await supabase.auth.getUser();
          
          if (authError || !user) {
            alert("You must be logged in to post.");
            setLoading(false);
            return;
          }

          // 3. Insert into neighborhood_events
          const { error: insertError } = await supabase
            .from("neighborhood_events")
            .insert({
              title,
              description,
              event_type: type, // 'request' or 'offer'
              user_id: user.id,
              // PostGIS helper: Longitude then Latitude
              location: `POINT(${user_lng} ${user_lat})`
            });

          if (insertError) {
            console.error("Insert Error:", insertError);
            alert(`Error: ${insertError.message}`);
          } else {
            console.log("✅ Post Created Successfully");
            onClose(); // Close modal on success
          }
        } catch (err) {
          console.error("Unexpected Error:", err);
        } finally {
          setLoading(false);
        }
      },
      (geoError) => {
        console.error("Geolocation Error:", geoError);
        alert("Location access is required to post to your neighborhood.");
        setLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <div style={modalOverlayStyle}>
      <div style={modalContentStyle}>
        <h2 style={{ marginTop: 0 }}>
          {type === "request" ? "Request Support" : "Offer Support"}
        </h2>
        
        <p style={{ fontSize: "0.9rem", color: "#2C3E50" }}>
          This will be visible to neighbors within 0.75 miles.
        </p>

        <input
          placeholder="What do you need/offer?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={inputStyle}
        />

        <textarea
          placeholder="Add some details..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ ...inputStyle, height: "100px", resize: "none" }}
        />

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={submitButtonStyle}
        >
          {loading ? "Posting..." : "Broadcast to Neighborhood"}
        </button>

        <button
          onClick={onClose}
          style={cancelButtonStyle}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// --- Minimalist "Calm" Styling ---

const modalOverlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};

const modalContentStyle = {
  background: "white",
  padding: "24px",
  borderRadius: "16px",
  width: "90%",
  maxWidth: "420px",
  boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
};

const inputStyle = {
  width: "100%",
  padding: "12px",
  marginBottom: "16px",
  borderRadius: "8px",
  border: "1px solid #ddd",
  fontSize: "1rem",
  boxSizing: "border-box",
};

const submitButtonStyle = {
  width: "100%",
  padding: "14px",
  background: "#1a1a1a",
  color: "white",
  borderRadius: "8px",
  border: "none",
  fontSize: "1rem",
  fontWeight: "600",
  cursor: "pointer",
};

const cancelButtonStyle = {
  width: "100%",
  marginTop: "12px",
  padding: "10px",
  background: "transparent",
  border: "none",
  color: "#2C3E50",
  cursor: "pointer",
};