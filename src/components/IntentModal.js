"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function IntentModal({ type, onClose }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title || !description) {
      alert("Fill everything");
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const user_lat = position.coords.latitude;
        const user_lng = position.coords.longitude;

        const { data: { user } } = await supabase.auth.getUser();

        const { error } = await supabase
          .from("neighborhood_events")
          .insert({
            title,
            description,
            event_type: type,
            user_id: user.id,
            location: `SRID=4326;POINT(${user_lng} ${user_lat})`
          });

        if (error) {
          console.error("Insert error:", error);
          alert("Error creating post");
        } else {
          console.log("Post created");
          onClose();
        }

        setLoading(false);
      },
      (err) => {
        console.error("Location error:", err);
        alert("Location required to post");
        setLoading(false);
      }
    );
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      background: "rgba(0,0,0,0.4)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center"
    }}>
      <div style={{
        background: "white",
        padding: 20,
        borderRadius: 12,
        width: "90%",
        maxWidth: 400
      }}>
        <h3>{type === "request" ? "Request Support" : "Offer Support"}</h3>

        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ width: "100%", marginBottom: 10 }}
        />

        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ width: "100%", marginBottom: 10 }}
        />

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: "100%",
            padding: 10,
            background: "#333",
            color: "white",
            borderRadius: 8,
            border: "none"
          }}
        >
          {loading ? "Posting..." : "Submit"}
        </button>

        <button
          onClick={onClose}
          style={{
            marginTop: 10,
            width: "100%",
            padding: 10
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}