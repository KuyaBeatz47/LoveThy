"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import IntentModal from "../components/IntentModal";
import AuthModal from "../components/AuthModal";

export default function Home() {
  // 🔹 Core App State
  const [session, setSession] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [intentType, setIntentType] = useState(null);
  const [showAuth, setShowAuth] = useState(false);

  // 🔹 Identity State
  const [firstName, setFirstName] = useState("");
  const [street, setStreet] = useState("");

  // ----------------------------
  // INITIALIZING & AUTH
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

  // 🔹 Identity Update Function
  const updateIdentity = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!firstName || !street) {
      alert("Please enter your name and street.");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: firstName.trim(),
        street_name: street.trim(),
        last_active_at: new Date().toISOString()
      })
      .eq("id", user.id);

    if (error) {
      console.error(error);
      alert("Something went wrong.");
    } else {
      alert("Identity Anchored!");
      console.log("Identity Anchored.");
    }
  };

  // ----------------------------
  // FETCH FEED
  // ----------------------------
  const fetchFeed = useCallback(async () => {
    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const user_lat = position.coords.latitude;
        const user_lng = position.coords.longitude;

        try {
          const { data: { user } } = await supabase.auth.getUser();

          const { data, error } = await supabase.rpc(
            "get_neighborhood_feed_v5",
            {
              user_lat,
              user_lng,
              viewer_id: user?.id
            }
          );

          if (error) {
            console.error("Feed error:", error);
            setEvents([]);
          } else {
            console.log("Feed Data:", data);
            setEvents(Array.isArray(data) ? data : []);
          }

        } catch (err) {
          console.error("Unexpected error:", err);
          setEvents([]);
        }

        setLoading(false);
      },
      (err) => {
        console.error("Location error:", err);
        setEvents([]);
        setLoading(false);
      }
    );
  }, []);              
  const joinRide = async (eventId) => {
    const { data: { user } } = await supabase.auth.getUser();
  
    const { error } = await supabase
      .from("responses")
      .insert({
        event_id: eventId,
        helper_id: user.id
      });
  
    if (error) {
      console.error(error);
      alert("You're already in or something went wrong");
    } else {
      alert("You're in 🚗");
    }
  };
  // ----------------------------
  // REALTIME
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
          fetchFeed();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, fetchFeed]);

  // ----------------------------
  // RENDER LOGIC                                                                                                  
  // ----------------------------
  if (initializing) {
    return <main style={{ padding: 40 }}>Initializing LoveThy...</main>;
  }

  if (!session) {
    return (
      <main style={{ padding: 40, textAlign: "center", fontFamily: "sans-serif" }}>
        <h2 style={{ fontSize: 28, fontWeight: 800 }}>LoveThy</h2>
        <p>Connect with neighbors nearby.</p>
        <button
          onClick={() => setShowAuth(true)}
          style={{ padding: "12px 24px", borderRadius: 8, cursor: "pointer" }}
        >
          Sign In
        </button>
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      </main>
    );
  }

  if (loading) {
    return <main style={{ padding: 40, fontFamily: "sans-serif" }}>Loading nearby activity...</main>;
  }

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 32, fontWeight: 800 }}>LoveThy</h1>
        <button
          onClick={() => supabase.auth.signOut()}
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
          Sign Out
        </button>
      </div>

      {/* ACTION BUTTONS */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15, marginTop: 20 }}>
        <button
          style={{ padding: 20, borderRadius: 12, border: "none", backgroundColor: "#ff4d4d", color: "white", fontWeight: "bold", cursor: "pointer" }}
          onClick={() => setIntentType("request")}
        >
          Request Support
        </button>

        <button
          style={{ padding: 20, borderRadius: 12, border: "none", backgroundColor: "#22c55e", color: "white", fontWeight: "bold", cursor: "pointer" }}
          onClick={() => setIntentType("offer")}
        >
          Offer Support
        </button>
        <button
  style={{
    padding: 20,
    borderRadius: 12,
    backgroundColor: "#3b82f6",
    color: "white"
  }}
  onClick={() => setIntentType("carpool")}
>
  Carpool
</button>
      </div>

      <hr style={{ margin: "30px 0", opacity: 0.2 }} />

      {/* FEED */}
      <h2>Neighborhood Feed</h2>

{events.length === 0 ? (
  <p>All quiet in the neighborhood.</p>
) : (
  events.map((event) => (
    <div
      key={event.id}
      style={{
        border: "1px solid #f0f0f0",
        borderRadius: 12,
        padding: 16,
        marginBottom: 12
      }}
    >
      <small style={{ color: "#2C3E50", fontWeight: 600 }}>
        {event.author_name || "Neighbor"}
        {event.author_street ? ` • ${event.author_street}` : ""}
      </small>
  
      <strong style={{ display: "block", marginTop: 8 }}>
        {event.title}
      </strong>
  
      <p>{event.description}</p>
  
      {event.event_type === "carpool" && ( 
        <div
          style={{
            marginTop: 12,
            padding: "12px",
            backgroundColor: "#fcfcfc",
            borderRadius: "8px",
            border: "1px solid #eee"
          }}
        >
          <div style={{ marginBottom: 8 }}>
            <small style={{ fontWeight: 700, color: "#555" }}>
              {event.join_count > 0
                ? `${event.join_count} neighbors joining`
                : "Be the first to join"}
            </small>
          </div>
          {(() => {
  let neighbors = [];

  try {
    if (Array.isArray(event.neighbors_joining)) {
      neighbors = event.neighbors_joining;
    } else if (typeof event.neighbors_joining === "string") {
      neighbors = JSON.parse(event.neighbors_joining);
    }
  } catch (e) {
    neighbors = [];
  }

  return neighbors.length > 0 && (
    <div style={{ marginTop: 8, marginBottom: 12 }}>
      {neighbors.map((n, i) => (
        <div key={i} style={{ fontSize: "0.85rem", color: "#555" }}>
          🤝 {n.first_name || "Neighbor"}{" "}
          {n.street_name ? `• ${n.street_name}` : ""}
        </div>
      ))}
    </div>
  );
})()}
  
          {Array.isArray(event.neighbors_joining) &&
            event.neighbors_joining.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                {event.neighbors_joining.map((n, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: "0.85rem",
                      color: "#666",
                      marginBottom: 4
                    }}
                  >
                    🤝 {n.first_name || "Neighbor"}{" "}
                    {n.street_name ? `• ${n.street_name}` : ""}
                  </div>
                ))}
              </div>
            )}
  
          <button
            onClick={() => joinRide(event.id)}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: 8,
              border: "none",
              backgroundColor: "#111",
              color: "white",
              fontWeight: "600",
              cursor: "pointer"
            }}
            >
              {event.event_type === "carpool" && (event.overlap_count || 0) > 0 && (
  <div
    style={{
      marginTop: 8,
      marginBottom: 8,
      fontSize: "0.8rem",
      color: "#888",
      fontStyle: "italic"
    }}
  >
    {event.overlap_count} nearby ride
    {event.overlap_count > 1 ? "s" : ""} heading this way
  </div>
)}
            Join Ride
          </button>
        </div>
      )}
      
      </div>
))
)}


      {/* 🔹 IDENTITY SETUP SECTION */}
      <div style={{ marginTop: 50, padding: 20, backgroundColor: "#f9f9f9", borderRadius: 12, border: "1px solid #eee" }}>
        <h4 style={{ margin: "0 0 10px 0" }}>Neighbor Identity</h4>
        <p style={{ fontSize: "0.8rem", color: "#666", marginBottom: 15 }}>Help neighbors recognize you by adding your name and street.</p>
        
        <input
          placeholder="First name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          style={{ width: "100%", padding: 10, marginBottom: 10, borderRadius: 8, border: "1px solid #ccc", boxSizing: "border-box" }}
        />

        <input
          placeholder="Street or nearest cross street"
          value={street}
          onChange={(e) => setStreet(e.target.value)}
          style={{ width: "100%", padding: 10, marginBottom: 10, borderRadius: 8, border: "1px solid #ccc", boxSizing: "border-box" }}
        />

        <button 
          onClick={updateIdentity}
          style={{ width: "100%", padding: 12, backgroundColor: "#333", color: "white", borderRadius: 8, border: "none", cursor: "pointer" }}
        >
          Save Identity
        </button>
      </div>

      {/* MODALS */}
      {intentType && <IntentModal type={intentType} onClose={() => setIntentType(null)} />}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </main>
  );
}