"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import IntentModal from "./components/IntentModal";
import AuthModal from "./components/AuthModal";

export default function Home() {
  const [session, setSession] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [intentType, setIntentType] = useState(null);
  const [showAuth, setShowAuth] = useState(false);

  // ----------------------------
  // AUTH
  // ----------------------------
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setInitializing(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ----------------------------
  // FETCH FEED
  // ----------------------------
  const fetchFeed = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const user_lat = position.coords.latitude;
        const user_lng = position.coords.longitude;

        try {
          const { data, error } = await supabase.rpc(
            "get_neighborhood_feed_v5",
            { user_lat, user_lng }
          );

          if (error) {
            console.error("Feed error:", error);
            setEvents([]);
          } else {
            setEvents(Array.isArray(data) ? data : []);
          }

        } catch (err) {
          console.error("Unexpected error:", err);
          setEvents([]);
        }

        if (isInitial) setLoading(false);
      },
      (err) => {
        console.error("Location error:", err);
        setEvents([]);
        if (isInitial) setLoading(false);
      },
      { timeout: 10000 }
    );
  }, []);

  // ----------------------------
  // REALTIME
  // ----------------------------
  useEffect(() => {
    if (!session) return;

    fetchFeed(true);

    const eventChannel = supabase
      .channel("public:neighborhood_events")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "neighborhood_events",
      }, () => fetchFeed())
      .subscribe();

    const responseChannel = supabase
      .channel("public:responses")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "responses",
      }, () => fetchFeed())
      .subscribe();

    return () => {
      supabase.removeChannel(eventChannel);
      supabase.removeChannel(responseChannel);
    };
  }, [session, fetchFeed]);

  // ----------------------------
  // JOIN RIDE
  // ----------------------------
  const joinRide = async (eventId) => {
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("responses")
      .insert({
        event_id: eventId,
        helper_id: user.id
      });

    if (error) {
      alert("You're already in or something went wrong");
    } else {
      alert("You're in 🚗");
    }
  };

  // ----------------------------
  // LOADING STATES
  // ----------------------------
  if (initializing) {
    return <main style={{ padding: 40 }}>Initializing LoveThy...</main>;
  }

  if (!session) {
    return (
      <main style={{ padding: 40, textAlign: "center" }}>
        <h2>LoveThy</h2>
        <button onClick={() => setShowAuth(true)}>Sign In</button>
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      </main>
    );
  }

  if (loading) {
    return <main style={{ padding: 40 }}>Loading nearby activity...</main>;
  }

  // ----------------------------
  // UI
  // ----------------------------
  return (
    <main style={{
      padding: "40px 20px",
      maxWidth: 600,
      margin: "0 auto",
      fontFamily: "system-ui, -apple-system, sans-serif"
    }}>

      {/* HEADER */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 30
      }}>
        <h1 style={{
          fontSize: 32,
          fontWeight: 800,
          margin: 0,
          letterSpacing: "-0.02em"
        }}>
          LoveThy
        </h1>

        <button
          onClick={() => supabase.auth.signOut()}
          style={{
            background: "none",
            border: "1px solid #eee",
            borderRadius: 20,
            padding: "6px 14px",
            fontSize: "0.75rem",
            color: "#666",
            cursor: "pointer"
          }}
        >
          Sign Out
        </button>
      </div>

      {/* ACTION BUTTONS */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 12,
        marginBottom: 40
      }}>
        <button
          onClick={() => setIntentType("request")}
          style={{
            padding: 18,
            borderRadius: 12,
            border: "none",
            backgroundColor: "#ef4444",
            color: "white",
            fontWeight: "700",
            cursor: "pointer"
          }}
        >
          Request Support
        </button>

        <button
          onClick={() => setIntentType("offer")}
          style={{
            padding: 18,
            borderRadius: 12,
            border: "none",
            backgroundColor: "#22c55e",
            color: "white",
            fontWeight: "700",
            cursor: "pointer"
          }}
        >
          Offer Support
        </button>

        <button
          onClick={() => setIntentType("carpool")}
          style={{
            gridColumn: "span 2",
            padding: 18,
            borderRadius: 12,
            border: "none",
            backgroundColor: "#3b82f6",
            color: "white",
            fontWeight: "700",
            cursor: "pointer"
          }}
        >
          🚗 Post a Carpool
        </button>
      </div>

      {/* FEED */}
      <h2 style={{ marginBottom: 12 }}>Neighborhood Feed</h2>

      {events.length === 0 ? (
        <p style={{ color: "#888", fontStyle: "italic" }}>
          All quiet in the neighborhood.
        </p>
      ) : (
        events.map((event) => (
          <div
            key={event.id}
            style={{
              border: "1px solid #f0f0f0",
              borderLeft: event.event_type === "carpool" ? "4px solid #2563eb" : "1px solid #f0f0f0",
              borderRadius: 16,
              padding: 20,
              marginBottom: 16,
              backgroundColor: "white",
              boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
            }}
          >
            <small style={{ color: "#374151", fontWeight: 600 }}>
              {event.author_name || "Neighbor"}
              {event.author_street ? ` • ${event.author_street}` : ""}
            </small>

            <div style={{ fontWeight: 700, marginTop: 6 }}>
              {event.title}
            </div>

            <p style={{ color: "#444" }}>{event.description}</p>
            {/* --- DEVELOPER TRUTH LAYER (TEMP) --- */}
{event.event_type === "carpool" && (
  <div style={{ 
    marginTop: 8, 
    padding: "8px 12px", 
    backgroundColor: "#f9fafb", 
    borderRadius: 8,
    border: "1px dashed #d1d5db",
    fontSize: "0.8rem",
    color: "#6b7280"
  }}>
    <div style={{ marginBottom: 4 }}>
      📍 Dest: <strong style={{ color: "#374151" }}>
        {event.destination || "MISSING"}
      </strong>
    </div>
    <div>
      🕒 Time: <strong style={{ color: "#374151" }}>
        {event.departure_time 
          ? new Date(event.departure_time).toLocaleString() 
          : "MISSING"}
      </strong>
    </div>
  </div>
)}

            {event.event_type === "carpool" && (
              <div style={{ marginTop: 12 }}>

<div
  style={{
    fontWeight: 800,
    color: "#111",
    marginBottom: 1,
    fontSize: "0.85rem"
  }}
>
  {event.join_count > 0
    ? `${event.join_count} neighbor${event.join_count > 1 ? "s" : ""} joining`

    : "Be the first to join"}
</div>

                {/* SAFE NEIGHBORS */}
                {(() => {
                  let neighbors = [];
                  try {
                    if (Array.isArray(event.neighbors_joining)) {
                      neighbors = event.neighbors_joining;
                    } else if (typeof event.neighbors_joining === "string") {
                      neighbors = JSON.parse(event.neighbors_joining);
                    }
                  } catch (e) {}

                  return neighbors.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      {neighbors.map((n, i) => (
                        <div key={i} style={{ fontSize: "0.85rem", color: "#666" }}>
                          🤝 {n.first_name || "Neighbor"} {n.street_name ? `• ${n.street_name}` : ""}
                        </div>
                      ))}
                    </div>
                  );
                })()}

                {/* OVERLAP SIGNAL */}
{(event.overlap_count || 0) > 0 && (
  <div
    style={{
      fontSize: "0.85rem",
      color: "#3730a3",
      backgroundColor: "#eef2ff",
      border: "1px solid #c7d2fe",
      padding: "8px 12px",
      borderRadius: 10,
      display: "flex",
      alignItems: "center",
      gap: 6,
      marginTop: 10,
      marginBottom: 12,
      fontWeight: 600
    }}
  >
    <span>🚗</span>
    {event.overlap_count} nearby ride
    {event.overlap_count > 1 ? "s" : ""} heading this way
  </div>
)}

<button
  onClick={() => joinRide(event.id)}
  style={{
    width: "100%",
    padding: 12,
    marginTop: 12,
    borderRadius: 10,
    border: "none",
    backgroundColor: "#111",
    color: "white",
    fontWeight: "600",
    cursor: "pointer"
  }}
>
  Join Ride
</button>
              </div>
            )}
          </div>
        ))
      )}

      {intentType && <IntentModal type={intentType} onClose={() => setIntentType(null)} />}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </main>
  );
}