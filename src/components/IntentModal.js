"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const getLocalDateTime = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
};

export default function IntentModal({ type, onClose }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [destination, setDestination] = useState("");
  const [departureTime, setDepartureTime] = useState(() =>
    type === "carpool" ? getLocalDateTime() : ""
  );
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [coords, setCoords] = useState(null);

  // --------------------------------------------------
  // ⚡️ SELF-HEALING SUGGESTION ENGINE (Signal > Noise)
  // --------------------------------------------------
  const loadSuggestions = async () => {
    try {
      const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from("neighborhood_events")
        .select("destination, created_at")
        .eq("event_type", "carpool")
        .gt("created_at", twoWeeksAgo)
        .not("destination", "is", null)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      const counts = {};
      data.forEach((item) => {
        if (!item.destination) return;
        const clean = item.destination.trim().toLowerCase();
        
        // 🛡️ Regex Noise Gate
        if (clean.length < 3) return;
        if (/(yes|test|no|maybe|stuff|ok|hi|nothing|none|hey|oh yes)/i.test(clean)) return;
        if (/\d{3,}/.test(clean)) return;

        counts[clean] = (counts[clean] || 0) + 1;
      });

      const ranked = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([name]) => name.charAt(0).toUpperCase() + name.slice(1));

      const safeFallback = ["Grocery Store", "Work", "School", "Gym", "Airport"];
      setSuggestions(ranked.length > 0 ? ranked : safeFallback);
    } catch (err) {
      console.error("Suggestion Error:", err);
      setSuggestions(["Grocery Store", "Work", "Gym"]);
    }
  };

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      (err) => console.error("Location error:", err),
      { timeout: 10000 }
    );

    if (type === "carpool") {
      loadSuggestions();
    }
  }, [type]);

  const handleSubmit = async () => {
    if (!title) { alert("Please give your post a title."); return; }
    if (type === "carpool" && (!destination || !departureTime)) {
      alert("Destination and time are required."); return;
    }
    if (type !== "carpool" && !description) {
      alert("Please add a description."); return;
    }
    if (!coords) { alert("Location required. Please wait a moment."); return; }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from("neighborhood_events").insert({
      user_id: user.id,
      event_type: type,
      title,
      description,
      destination: type === "carpool" ? destination : null,
      departure_time: type === "carpool" ? departureTime : null,
      location: `POINT(${coords.lng} ${coords.lat})`,
    });

    if (error) { alert("Error creating post."); } else { onClose(); }
    setLoading(false);
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
      backgroundColor: "rgba(0,0,0,0.4)", display: "flex", justifyContent: "center",
      alignItems: "center", zIndex: 1000
    }}>
      <div style={{
        background: "white", padding: 24, borderRadius: 16, width: "90%", maxWidth: 420
      }}>
        <h3 style={{ marginBottom: 16 }}>
          {type === "carpool" ? "Post a Carpool" : `${type} Support`}
        </h3>

        <input
          placeholder="Title (e.g., Coffee Run)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ width: "100%", padding: 12, marginBottom: 10, borderRadius: 8, border: "1px solid #ccc" }}
        />

        {type === "carpool" && (
          <>
            <div style={{ marginBottom: 15 }}>
              <input
                placeholder="Destination"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #ccc" }}
              />

              {/* 🔥 STABLE SUGGESTION ROW */}
              <div style={{ 
                display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap", minHeight: "32px" 
              }}>
                {suggestions.length > 0 ? suggestions.map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => setDestination(loc)}
                    style={{
                      fontSize: "0.75rem", padding: "6px 12px", borderRadius: 20,
                      border: "1px solid #c7d2fe",
                      backgroundColor: destination === loc ? "#eef2ff" : "white",
                      color: "#3730a3", fontWeight: 600, cursor: "pointer"
                    }}
                  >
                    {loc}
                  </button>
                )) : (
                  <div style={{ height: 32 }} />
                )}
              </div>
            </div>

            <input
              type="datetime-local"
              value={departureTime}
              onChange={(e) => setDepartureTime(e.target.value)}
              style={{ width: "100%", padding: 12, marginBottom: 10, borderRadius: 8, border: "1px solid #ccc" }}
            />
          </>
        )}

        <textarea
          placeholder={type === "carpool" ? "Note (Optional)" : "How can neighbors help?"}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ width: "100%", padding: 12, marginBottom: 16, borderRadius: 8, border: "1px solid #ccc", minHeight: 80 }}
        />

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: "100%", padding: 14, backgroundColor: "#111", color: "white",
            borderRadius: 10, border: "none", fontWeight: "600", cursor: "pointer"
          }}
        >
          {loading ? "Posting..." : "Confirm Post"}
        </button>

        <button
          onClick={onClose}
          style={{ marginTop: 10, width: "100%", padding: 10, background: "none", border: "none", color: "#6b7280", cursor: "pointer" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}