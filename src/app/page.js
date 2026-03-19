"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import IntentModal from "../components/IntentModal";
import AuthModal from "../components/AuthModal";

export default function Home() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [intentType, setIntentType] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [session, setSession] = useState(null);
  const [initializing, setInitializing] = useState(true);

  // ----------------------------
  // AUTH HANDSHAKE (DO NOT TOUCH)
  // ----------------------------
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setInitializing(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setInitializing(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ----------------------------
  // FETCH FEED
  // ----------------------------
  const fetchFeed = useCallback(async () => {
    const { data, error } = await supabase.rpc("get_neighborhood_feed");

    if (error) {
      console.error("Feed error:", error);
    } else {
      setEvents(data || []);
    }

    setLoading(false);
  }, []);

  // ----------------------------
  // REALTIME (FIXED)
  // ----------------------------
  useEffect(() => {
    if (!session) return;

    fetchFeed();

    const channel = supabase
      .channel("public:neighborhood_events")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "neighborhood_events",
        },
        () => {
          fetchFeed(); // ensures distance is correct
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, fetchFeed]);

  // ----------------------------
  // INITIALIZING
  // ----------------------------
  if (initializing) {
    return <main style={{ padding: 40 }}>Initializing LoveThy...</main>;
  }

  // ----------------------------
  // NOT LOGGED IN
  // ----------------------------
  if (!session) {
    return (
      <main style={{ padding: 40, textAlign: "center" }}>
        <h2 style={{ fontSize: 28, fontWeight: 800 }}>LoveThy</h2>
        <p>Connect with neighbors nearby.</p>

        <button
          onClick={() => setShowAuth(true)}
          style={{
            padding: "12px 24px",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          Sign In
        </button>

        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      </main>
    );
  }

  // ----------------------------
  // LOADING FEED
  // ----------------------------
  if (loading) {
    return <main style={{ padding: 40 }}>Loading nearby activity...</main>;
  }

  // ----------------------------
  // MAIN UI
  // ----------------------------
  return (
    <main
      style={{
        padding: "40px 20px",
        maxWidth: 600,
        margin: "0 auto",
        fontFamily: "sans-serif",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1 style={{ fontSize: 32, fontWeight: 800 }}>LoveThy</h1>

        <button
          onClick={() => {
            if (session) supabase.auth.signOut();
            else setShowAuth(true);
          }}
          style={{
            background: "none",
            border: "1px solid #eee",
            borderRadius: "20px",
            padding: "6px 16px",
            fontSize: "0.8rem",
            cursor: "pointer",
            color: "#555",
          }}
        >
          {session ? "Sign Out" : "Account"}
        </button>
      </div>

      {/* ACTION BUTTONS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 15,
          marginTop: 20,
        }}
      >
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
          Request Support
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
          Offer Support
        </button>
      </div>

      {/* REFRESH */}
      <button
        onClick={() => {
          setLoading(true);
          fetchFeed();
        }}
        style={{
          marginTop: 10,
          border: "none",
          background: "none",
          cursor: "pointer",
          color: "#888",
          fontSize: "0.8rem",
        }}
      >
        Refresh
      </button>

      <hr style={{ margin: "30px 0", opacity: 0.2 }} />

      {/* FEED */}
      <h2>Neighborhood Feed</h2>

      {events.length === 0 ? (
        <p>All quiet in the neighborhood.</p>
      ) : (
        events.map((event) => (
          <div
            key={event.id || Math.random()}
            style={{
              border: "1px solid #f0f0f0",
              borderRadius: 12,
              padding: "16px",
              marginBottom: "12px",
              backgroundColor:
                event.event_type === "request" ? "#FFF9F9" : "#F9FFF9",
              boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <small
                style={{
                  color: "#777",
                  fontWeight: "500",
                  fontFamily: "monospace",
                }}
              >
                👤{" "}
                {event.user_id
                  ? `ID: ${event.user_id.slice(0, 8)}`
                  : "neighbor"}
              </small>

              <span
                style={{
                  fontSize: "0.7rem",
                  padding: "2px 8px",
                  borderRadius: "10px",
                  background:
                    event.event_type === "request" ? "#FFE5E5" : "#E5FFE5",
                  color: "#555",
                  textTransform: "uppercase",
                }}
              >
                {event.event_type}
              </span>
            </div>

            <strong
              style={{
                display: "block",
                marginTop: "8px",
                fontSize: "1.1rem",
              }}
            >
              {event.title}
            </strong>

            <p style={{ margin: "8px 0", color: "#444" }}>
              {event.description}
            </p>

            <small style={{ color: "#888" }}>
              📍{" "}
              {event.fuzzy_distance_meters
                ? `${Math.round(event.fuzzy_distance_meters)}m away`
                : "Nearby"}
            </small>
          </div>
        ))
      )}

      {/* MODALS */}
      {intentType && (
        <IntentModal
          type={intentType}
          onClose={() => setIntentType(null)}
        />
      )}

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </main>
  );
}
