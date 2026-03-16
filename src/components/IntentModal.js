"use client"

import { useState } from "react"
import { supabase } from "../lib/supabase"

export default function IntentModal({ type, onClose }) {

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
  
      const { error } = await supabase.rpc("create_neighborhood_event", {
        p_title: title,
        p_description: description,
        p_event_type: type,
        lat: latitude,
        lon: longitude,
      });
  
      if (error) {
        console.error("Error creating event:", error.message);
      } else {
        console.log("Event created successfully");
        window.location.reload();
      }
    });
  }

  return (
    <div style={styles.overlay}>

      <div style={styles.modal}>

        <h2>{type === "request" ? "I could use a hand" : "I'm here to help"}</h2>

        <input
          placeholder="Title"
          style={styles.input}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          placeholder="Add details (optional)"
          style={styles.textarea}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div style={styles.actions}>

          <button style={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>

          <button
            style={type === "request" ? styles.requestBtn : styles.offerBtn}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Posting..." : "Post to Neighborhood"}
          </button>

        </div>

      </div>

    </div>
  )
}

const styles = {

  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000
  },

  modal: {
    backgroundColor: "#fff",
    padding: "30px",
    borderRadius: "16px",
    width: "90%",
    maxWidth: "400px"
  },

  input: {
    width: "100%",
    padding: "12px",
    marginBottom: "15px",
    borderRadius: "8px",
    border: "1px solid #ddd"
  },

  textarea: {
    width: "100%",
    padding: "12px",
    marginBottom: "20px",
    borderRadius: "8px",
    border: "1px solid #ddd"
  },

  actions: {
    display: "flex",
    gap: "10px"
  },

  cancelBtn: {
    flex: 1,
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    backgroundColor: "#fff"
  },

  requestBtn: {
    flex: 2,
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#e63946",
    color: "#fff"
  },

  offerBtn: {
    flex: 2,
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#2a9d8f",
    color: "#fff"
  }

}
