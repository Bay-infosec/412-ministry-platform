import { useState } from "react";
import { NAVY, TSEC, SERIF, SANS, ORANGE, BORDER } from "../../lib/constants.js";
import Button from "../ui/Button.jsx";
import Field from "../ui/Field.jsx";

export default function ContactForm({ profile, onClose }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");

  const send = async () => {
    setErr("");
    if (!subject.trim() || !message.trim()) {
      setErr("Please fill in both subject and message.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: import.meta.env.VITE_EMAILJS_SERVICE_ID,
          template_id: import.meta.env.VITE_EMAILJS_INVITE_TEMPLATE_ID,
          user_id: import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
          template_params: {
            from_name: profile.full_name || "",
            from_email: profile.email || "",
            subject: subject.trim(),
            message: message.trim(),
            to_email: "tsekvv.tb@gmail.com",
            to_name: "Tsenguun",
            temp_password: "",
            platform_url: window.location.origin,
          },
        }),
      });
      setBusy(false);
      if (res.ok) setSent(true);
      else setErr("Could not send. Please try again.");
    } catch {
      setBusy(false);
      setErr("Could not connect.");
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(22,32,56,0.55)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        zIndex: 300,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "20px 20px 0 0",
          padding: "2rem 1.5rem 2.5rem",
          width: "100%",
          maxWidth: 460,
        }}
      >
        {sent ? (
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <div style={{ fontSize: "40px", marginBottom: "0.75rem" }}>✉️</div>
            <div
              style={{
                fontFamily: SERIF,
                fontSize: "22px",
                fontWeight: 600,
                color: NAVY,
                marginBottom: "0.5rem",
              }}
            >
              Message sent
            </div>
            <div
              style={{
                fontSize: "14px",
                color: TSEC,
                lineHeight: 1.6,
                marginBottom: "1.5rem",
              }}
            >
              We will get back to you soon.
            </div>
            <Button label="Close" onClick={onClose} />
          </div>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.5rem",
              }}
            >
              <div
                style={{
                  fontFamily: SERIF,
                  fontSize: "22px",
                  fontWeight: 600,
                  color: NAVY,
                }}
              >
                Contact Us
              </div>
              <button
                onClick={onClose}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "22px",
                  color: TSEC,
                  cursor: "pointer",
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
            <div
              style={{
                fontSize: "13px",
                color: TSEC,
                marginBottom: "1.25rem",
                lineHeight: 1.6,
              }}
            >
              Sending as{" "}
              <strong style={{ color: NAVY }}>{profile.full_name}</strong>
            </div>
            <Field
              label="SUBJECT"
              value={subject}
              onChange={setSubject}
              placeholder="e.g. Question about the conference"
            />
            <Field
              label="MESSAGE"
              value={message}
              onChange={setMessage}
              placeholder="Write your message here..."
              multiline
              rows={5}
            />
            {err && (
              <div
                style={{
                  fontSize: "13px",
                  color: "#C0392B",
                  marginBottom: "0.75rem",
                }}
              >
                {err}
              </div>
            )}
            <Button
              label={busy ? "Sending..." : "Send message"}
              onClick={send}
              disabled={busy}
            />
          </>
        )}
      </div>
    </div>
  );
}
