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

    try {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          const {
            data: { user },
          } = await supabase.auth.getUser();

          const { error } = await supabase
            .from("neighborhood_events")
            .insert({
              user_id: user.id,
              event_type: type,
              title,
              description,
              location: `POINT(${lng} ${lat})`, // ✅ CORRECT FORMAT
            });

          if (error) {
            console.error(error);
            alert("Error creating post.");
          } else {
            alert("Posted successfully!");
            onClose();
          }

          setLoading(false);
        },
        (err) => {
          console.error("Location error:", err);
          alert("Location required to post.");
          setLoading(false);
        }
      );
    } catch (err) {
      console.error("Unexpected error:", err);
      alert("Something went wrong.");
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "white",
          padding: 20,
          borderRadius: 12,
          width: "90%",
          maxWidth: 400,
        }}
      >
        <h3 style={{ marginBottom: 10 }}>
          {type === "request" ? "Request Help" : "Offer Help"}
        </h3>

        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            width: "100%",
            padding: 10,
            marginBottom: 10,
            borderRadius: 8,
            border: "1px solid #ccc",
          }}
        />

        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{
            width: "100%",
            padding: 10,
            marginBottom: 10,
            borderRadius: 8,
            border: "1px solid #ccc",
          }}
        />

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: "100%",
            padding: 12,
            backgroundColor: "#2C3E50",
            color: "white",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
          }}
        >
          {loading ? "Posting..." : "Post"}
        </button>

        <button
          onClick={onClose}
          style={{
            marginTop: 10,
            width: "100%",
            padding: 10,
            background: "#eee",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}