"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Home() {

  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);

  // ----------------------------
  // Load neighborhood feed
  // ----------------------------
  const fetchFeed = async () => {
    console.log("📡 Fetching neighborhood feed...");

    const { data, error } = await supabase.rpc("get_neighborhood_feed");

    if (error) {
      console.error("Feed error:", error);
      return;
    }

    setFeed(data || []);
    setLoading(false);
  };

  // ----------------------------
  // Initial load + realtime listener
  // ----------------------------
  useEffect(() => {

    fetchFeed();

    console.log("👂 Feed is now listening for neighbors...");

    const channel = supabase
      .channel("realtime-neighborhood")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "neighborhood_events"
        },
        (payload) => {
          console.log("🚀 LIVE UPDATE DETECTED", payload);

          // refresh feed instantly
          fetchFeed();
        }
      )
      .subscribe((status) => {
        console.log("Subscription Status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };

  }, []);

  // ----------------------------
  // UI
  // ----------------------------
  return (
    <main style={{ padding: "40px", fontFamily: "sans-serif" }}>

      <h1>LoveThy</h1>

      <div style={{ marginBottom: "20px" }}>
        <button style={{ marginRight: "10px" }}>
          I could use a hand
        </button>

        <button>
          I'm here to help
        </button>
      </div>

      <h2>Neighborhood Feed</h2>

      {loading && <p>Loading...</p>}

      {!loading && feed.length === 0 && (
        <p>No nearby requests yet.</p>
      )}

      {feed.map((item) => (
        <div
          key={item.id}
          style={{
            border: "1px solid #ddd",
            borderRadius: "8px",
            padding: "12px",
            marginBottom: "12px"
          }}
        >
          <strong>{item.title}</strong>

          {item.description && (
            <p>{item.description}</p>
          )}

          <small>
            {item.fuzzy_distance_meters} meters away
          </small>
        </div>
      ))}

    </main>
  );
}