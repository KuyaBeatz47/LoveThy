"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase"; // Use your project's correct path
import IntentModal from "../components/IntentModal";

export default function Home() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [intentType, setIntentType] = useState(null);

  // 1. Fetch function (the "Source of Truth")
  async function fetchFeed() {
    console.log("📡 Fetching neighborhood feed...");
    const { data, error } = await supabase.rpc("get_neighborhood_feed");

    if (!error && data) {
      setEvents(data);
    }
    setLoading(false);
  }

  // 2. Realtime Listener (The "Pulse")
  useEffect(() => {
    fetchFeed();

    const channel = supabase
  .channel("realtime-neighborhood")
  .on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "neighborhood_events",
    },
    (payload) => {
      console.log("🚀 LIVE UPDATE DETECTED", payload);
      fetchFeed();
    }
  )
  .subscribe((status) => {
    console.log("📡 Subscription Status:", status);
  });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) return <main style={{ padding: 40 }}>Loading neighborhood...</main>;

  return (
    <main style={{ padding: "40px 20px", maxWidth: 600, margin: "0 auto", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 32, fontWeight: 800 }}>LoveThy</h1>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15, marginTop: 20 }}>
        <button
          style={{
            padding: 20,
            borderRadius: 12,
            border: "none",
            backgroundColor: "#ff4d4d",
            color: "white",
            fontWeight: "bold",
            cursor: "pointer",
          }}
          onClick={() => setIntentType("request")}
        >
          I could use a hand
        </button>

        <button
          style={{
            padding: 20,
            borderRadius: 12,
            border: "none",
            backgroundColor: "#22c55e",
            color: "white",
            fontWeight: "bold",
            cursor: "pointer",
          }}
          onClick={() => setIntentType("offer")}
        >
          I'm here to help
        </button>
      </div>

      <hr style={{ margin: "30px 0" }} />

      <h2>Neighborhood Feed</h2>

      {events.length === 0 ? (
        <p>No nearby requests yet.</p>
      ) : (
        events.map((event) => (
          <div
            key={event.id}
            style={{
              border: "1px solid #eee",
              borderRadius: 10,
              padding: 15,
              marginBottom: 15,
              backgroundColor: event.event_type === "request" ? "#fffafa" : "#fafffa",
            }}
          >
            <strong>{event.title}</strong>
            <p>{event.description}</p>
            <small>{event.fuzzy_distance_meters || 0} meters away</small>
          </div>
        ))
      )}

      {intentType && (
        <IntentModal 
          type={intentType} 
          onClose={() => setIntentType(null)} 
        />
      )}
    </main>
  );
}