import { useState } from "react";
import { supabase } from "../../lib/supabase.js";
import { NAVY, ORANGE, TSEC, BORDER, BG, SERIF, SANS } from "../../lib/constants.js";
import { Shell } from "../../components/layout/index.js";
import { Card, Field, Button, Avatar, SectionLabel, Badge } from "../../components/ui/index.js";

export default function Profile({ data, onSaved, onSignOut, onOpenAdmin }) {
  const { profile, history, churches } = data;
  const [editing, setEditing] = useState(false);
  const [nickname, setNickname] = useState(profile.nickname || "");
  const [phone, setPhone] = useState(profile.phone || "");
  const [ministryRole, setMinistryRole] = useState(profile.ministry_role || "");
  const [churchId, setChurchId] = useState(profile.church_id || "");
  const [photoUrl, setPhotoUrl] = useState(profile.photo_url || "");
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [pwMsg, setPwMsg] = useState("");

  const isStaff =
    profile.platform_role === "admin" ||
    profile.platform_role === "moderator";

  const uploadPhoto = async (file) => {
    if (!file) return;
    setUploading(true);
    setMsg("");
    try {
      const ext = file.name.split(".").pop();
      const path = `${profile.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (error) {
        setMsg("Photo upload failed.");
        setUploading(false);
        return;
      }
      const { data: pub } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);
      setPhotoUrl(pub.publicUrl);
    } catch {
      setMsg("Photo upload failed.");
    }
    setUploading(false);
  };

  const save = async () => {
    setBusy(true);
    setMsg("");
    const { error } = await supabase
      .from("profiles")
      .update({ nickname, phone, ministry_role: ministryRole, church_id: churchId || null, photo_url: photoUrl })
      .eq("id", profile.id);
    setBusy(false);
    if (error) { setMsg("Could not save."); return; }
    setMsg("Saved.");
    await onSaved();
    setEditing(false);
  };

  const changePw = async () => {
    setPwMsg("");
    if (pw1.length < 8) { setPwMsg("At least 8 characters."); return; }
    if (pw1 !== pw2) { setPwMsg("Passwords do not match."); return; }
    const { error } = await supabase.auth.updateUser({ password: pw1 });
    if (error) { setPwMsg("Could not update password."); return; }
    setPw1(""); setPw2(""); setShowPw(false);
    setMsg("Password updated.");
  };

  const churchName = (churches || []).find((c) => c.id === profile.church_id)?.name;

  if (!editing) {
    return (
      <Shell withNav>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.5rem",
          }}
        >
          <div
            style={{ fontFamily: SERIF, fontSize: "26px", fontWeight: 600, color: NAVY }}
          >
            My Profile
          </div>
          <button
            onClick={onSignOut}
            style={{
              background: "none",
              border: "none",
              color: TSEC,
              fontSize: "13px",
              cursor: "pointer",
              fontFamily: SANS,
            }}
          >
            Sign out
          </button>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginBottom: "1.5rem",
          }}
        >
          <Avatar url={profile.photo_url} name={profile.full_name} size={96} />
          <div
            style={{
              fontFamily: SERIF,
              fontSize: "24px",
              fontWeight: 600,
              color: NAVY,
              marginTop: "0.75rem",
            }}
          >
            {profile.full_name}
          </div>
          {profile.nickname && (
            <div style={{ fontSize: "14px", color: TSEC, marginTop: 2 }}>
              "{profile.nickname}"
            </div>
          )}
          <div style={{ marginTop: "0.5rem" }}>
            <Badge variant={profile.platform_role} />
          </div>
        </div>

        <Card style={{ marginBottom: "1rem" }}>
          {[
            ["EMAIL", profile.email],
            ["PHONE", profile.phone],
            ["CHURCH", churchName],
            ["ROLE", profile.ministry_role],
          ].map(([label, val]) => (
            <div
              key={label}
              style={{
                padding: "0.75rem 0",
                borderBottom: `0.5px solid ${BORDER}`,
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: TSEC,
                  letterSpacing: "0.04em",
                  marginBottom: 3,
                  fontFamily: SANS,
                }}
              >
                {label}
              </div>
              <div style={{ fontSize: "15px", color: val ? NAVY : TSEC }}>
                {val || "Not set"}
              </div>
            </div>
          ))}
        </Card>

        <button
          onClick={() => setEditing(true)}
          style={{
            width: "100%",
            background: "#fff",
            border: `1px solid ${ORANGE}`,
            color: ORANGE,
            padding: "12px",
            borderRadius: 10,
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "15px",
            fontFamily: SANS,
            marginBottom: "1rem",
          }}
        >
          Edit profile
        </button>

        {isStaff && (
          <button
            onClick={onOpenAdmin}
            style={{
              width: "100%",
              background: NAVY,
              border: "none",
              color: "#fff",
              padding: "14px",
              borderRadius: 10,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "15px",
              fontFamily: SANS,
              marginBottom: "1.75rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#EFAB25"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Admin Panel
          </button>
        )}

        <SectionLabel>My History</SectionLabel>
        {history && history.length > 0 ? (
          history.map((h, i) => (
            <Card key={i} style={{ marginBottom: "0.875rem" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 4,
                }}
              >
                <div
                  style={{
                    fontFamily: SERIF,
                    fontSize: "18px",
                    fontWeight: 600,
                    color: NAVY,
                  }}
                >
                  {h.events?.name || "Event"}
                </div>
                <Badge variant={h.events?.status} />
              </div>
              <div style={{ fontSize: "13px", color: TSEC }}>
                {h.event_role} · Team {h.team_number}
              </div>
            </Card>
          ))
        ) : (
          <div style={{ fontSize: "14px", color: TSEC }}>
            Your event history will appear here.
          </div>
        )}
      </Shell>
    );
  }

  return (
    <Shell withNav>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}
      >
        <button
          onClick={() => { setEditing(false); setMsg(""); }}
          style={{
            background: "none",
            border: "none",
            color: TSEC,
            fontSize: "13px",
            cursor: "pointer",
            fontFamily: SANS,
            padding: 0,
          }}
        >
          ← Back
        </button>
        <div
          style={{ fontFamily: SERIF, fontSize: "22px", fontWeight: 600, color: NAVY }}
        >
          Edit Profile
        </div>
        <div style={{ width: 40 }} />
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}
      >
        <Avatar url={photoUrl} name={profile.full_name} size={96} />
        <label
          style={{
            marginTop: "0.75rem",
            fontSize: "13px",
            fontWeight: 600,
            color: ORANGE,
            cursor: "pointer",
            fontFamily: SANS,
          }}
        >
          {uploading ? "Uploading..." : photoUrl ? "Change photo" : "Add a photo"}
          <input
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => uploadPhoto(e.target.files[0])}
          />
        </label>
      </div>

      <Card style={{ marginBottom: "1rem" }}>
        <div style={{ marginBottom: "1rem" }}>
          <div
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: TSEC,
              marginBottom: 6,
              letterSpacing: "0.04em",
              fontFamily: SANS,
            }}
          >
            FULL NAME
          </div>
          <div
            style={{
              padding: "12px 14px",
              borderRadius: 10,
              background: "#F0EDE8",
              fontSize: "15px",
              color: TSEC,
            }}
          >
            {profile.full_name}
          </div>
          <div style={{ fontSize: "11px", color: TSEC, marginTop: 4, fontFamily: SANS }}>
            Name and email cannot be changed here.
          </div>
        </div>

        <Field
          label="NICKNAME"
          value={nickname}
          onChange={setNickname}
          placeholder="What should we call you?"
        />
        <Field
          label="PHONE"
          type="tel"
          value={phone}
          onChange={setPhone}
          placeholder="Your phone number"
        />
        <Field
          label="MINISTRY ROLE"
          value={ministryRole}
          onChange={setMinistryRole}
          placeholder="e.g. Youth Pastor, Engineer, Nurse"
        />

        <div style={{ marginBottom: "1rem" }}>
          <label
            style={{
              display: "block",
              fontSize: "12px",
              fontWeight: 600,
              color: TSEC,
              marginBottom: 6,
              letterSpacing: "0.04em",
              fontFamily: SANS,
            }}
          >
            CHURCH
          </label>
          <select
            value={churchId}
            onChange={(e) => setChurchId(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 10,
              border: `1px solid ${BORDER}`,
              fontSize: "15px",
              fontFamily: SANS,
              color: NAVY,
              background: "#fff",
              outline: "none",
            }}
          >
            <option value="">Select your church</option>
            {(churches || []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}{c.city ? ` — ${c.city}` : ""}
              </option>
            ))}
          </select>
        </div>

        {msg && (
          <div
            style={{
              fontSize: "13px",
              color: msg.includes("Saved") || msg.includes("updated") ? "#0A7C42" : "#C0392B",
              marginBottom: "0.5rem",
              fontFamily: SANS,
            }}
          >
            {msg}
          </div>
        )}
        <Button
          label={busy ? "Saving..." : "Save changes"}
          onClick={save}
          disabled={busy}
        />
      </Card>

      <Card>
        {!showPw ? (
          <button
            onClick={() => setShowPw(true)}
            style={{
              background: "none",
              border: "none",
              color: NAVY,
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: SANS,
              padding: 0,
            }}
          >
            Change my password →
          </button>
        ) : (
          <>
            <div
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: NAVY,
                marginBottom: "1rem",
                fontFamily: SANS,
              }}
            >
              Change password
            </div>
            <Field
              label="NEW PASSWORD"
              type="password"
              value={pw1}
              onChange={setPw1}
              placeholder="At least 8 characters"
            />
            <Field
              label="CONFIRM"
              type="password"
              value={pw2}
              onChange={setPw2}
              placeholder="Type it again"
            />
            {pwMsg && (
              <div
                style={{
                  fontSize: "13px",
                  color: "#C0392B",
                  marginBottom: "0.5rem",
                  fontFamily: SANS,
                }}
              >
                {pwMsg}
              </div>
            )}
            <Button label="Update password" onClick={changePw} />
            <button
              onClick={() => { setShowPw(false); setPw1(""); setPw2(""); }}
              style={{
                width: "100%",
                background: "none",
                border: "none",
                color: TSEC,
                fontSize: "13px",
                cursor: "pointer",
                fontFamily: SANS,
                marginTop: "0.75rem",
              }}
            >
              Cancel
            </button>
          </>
        )}
      </Card>
    </Shell>
  );
}
