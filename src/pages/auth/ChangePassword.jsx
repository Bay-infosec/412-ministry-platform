import { useState, useRef, useEffect } from "react";
import { supabase } from "../../lib/supabase.js";
import { validatePassword } from "../../lib/utils.js";
import { TSEC, BORDER, SANS } from "../../lib/constants.js";
import { Shell } from "../../components/layout/index.js";
import { Card, Field, Button, Avatar } from "../../components/ui/index.js";

const CROP_SIZE = 240;

function PhotoCropModal({ file, onConfirm, onCancel }) {
  const [imgSrc, setImgSrc] = useState(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [minScale, setMinScale] = useState(0.5);
  const [dragging, setDragging] = useState(false);
  const dragOrigin = useRef(null);
  const imgRef = useRef(null);

  useEffect(() => {
    const reader = new FileReader();
    reader.onload = (e) => setImgSrc(e.target.result);
    reader.readAsDataURL(file);
  }, [file]);

  const onImgLoad = () => {
    const img = imgRef.current;
    const fill = Math.max(CROP_SIZE / img.naturalWidth, CROP_SIZE / img.naturalHeight);
    setMinScale(fill);
    setScale(fill);
  };

  const startDrag = (clientX, clientY) => {
    setDragging(true);
    dragOrigin.current = { x: clientX - offset.x, y: clientY - offset.y };
  };
  const moveDrag = (clientX, clientY) => {
    if (!dragging || !dragOrigin.current) return;
    setOffset({ x: clientX - dragOrigin.current.x, y: clientY - dragOrigin.current.y });
  };
  const endDrag = () => setDragging(false);

  const handleConfirm = () => {
    const img = imgRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = 400; canvas.height = 400;
    const ctx = canvas.getContext("2d");
    const srcW = CROP_SIZE / scale;
    const srcH = CROP_SIZE / scale;
    const srcX = (img.naturalWidth - srcW) / 2 - offset.x / scale;
    const srcY = (img.naturalHeight - srcH) / 2 - offset.y / scale;
    ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, 400, 400);
    canvas.toBlob((blob) => onConfirm(blob), "image/jpeg", 0.92);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(0,0,0,0.88)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ color: "#fff", fontFamily: SANS, fontSize: "15px", fontWeight: 600, marginBottom: 20 }}>
        Drag to adjust your photo
      </div>
      <div
        style={{ width: CROP_SIZE, height: CROP_SIZE, borderRadius: "50%", overflow: "hidden", border: "3px solid #fff", position: "relative", cursor: dragging ? "grabbing" : "grab", flexShrink: 0, background: "#111" }}
        onMouseDown={(e) => startDrag(e.clientX, e.clientY)}
        onMouseMove={(e) => moveDrag(e.clientX, e.clientY)}
        onMouseUp={endDrag} onMouseLeave={endDrag}
        onTouchStart={(e) => { const t = e.touches[0]; startDrag(t.clientX, t.clientY); }}
        onTouchMove={(e) => { e.preventDefault(); const t = e.touches[0]; moveDrag(t.clientX, t.clientY); }}
        onTouchEnd={endDrag}
      >
        {imgSrc && (
          <img ref={imgRef} src={imgSrc} alt="crop" onLoad={onImgLoad} draggable={false}
            style={{ position: "absolute", left: "50%", top: "50%", transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${scale})`, transformOrigin: "center", maxWidth: "none", userSelect: "none", pointerEvents: "none" }}
          />
        )}
      </div>
      <input type="range" min={minScale} max={minScale * 3} step={0.01} value={scale} onChange={(e) => setScale(parseFloat(e.target.value))}
        style={{ width: CROP_SIZE, marginTop: 20 }}
      />
      <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
        <button onClick={onCancel} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 10, padding: "12px 28px", color: "#fff", fontFamily: SANS, fontSize: "14px", cursor: "pointer" }}>
          Cancel
        </button>
        <button onClick={handleConfirm} style={{ background: "#FF4D00", border: "none", borderRadius: 12, padding: "12px 28px", color: "#fff", fontFamily: SANS, fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>
          Use this photo
        </button>
      </div>
    </div>
  );
}

// ── Step 1: Set password ───────────────────────────────────────────────────────

function PasswordStep({ onPasswordSaved }) {
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setErr("");
    const pwErr = validatePassword(pw1);
    if (pwErr) { setErr(pwErr); return; }
    if (pw1 !== pw2) { setErr("The two passwords do not match."); return; }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pw1 });
      if (error) { setBusy(false); setErr("Could not update password."); return; }
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("profiles").update({ password_changed: true }).eq("id", user.id);
      setBusy(false);
      onPasswordSaved(user.id);
    } catch {
      setBusy(false);
      setErr("Could not update password.");
    }
  };

  return (
    <Shell>
      <div style={{ marginTop: "3rem", marginBottom: "2rem", textAlign: "center" }}>
        <div style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.14em", color: "#FF4D00", textTransform: "uppercase", marginBottom: "0.75rem", fontFamily: SANS }}>
          Step 1 of 2
        </div>
        <div style={{ fontFamily: SANS, fontSize: "28px", fontWeight: 900, color: "#111111", lineHeight: 1.2, letterSpacing: "-0.02em" }}>
          Set your own password
        </div>
        <div style={{ fontSize: "14px", color: TSEC, marginTop: "0.75rem", lineHeight: 1.6, fontFamily: SANS }}>
          Replace the temporary password
          <br />with one only you know.
        </div>
      </div>
      <Card>
        <Field label="NEW PASSWORD" type="password" value={pw1} onChange={setPw1} placeholder="Min 8 chars, capital, number, symbol" />
        <Field label="CONFIRM NEW PASSWORD" type="password" value={pw2} onChange={setPw2} placeholder="Type it again" />
        {err && <div style={{ color: "#C0392B", fontSize: "13px", marginBottom: "0.75rem", fontFamily: SANS }}>{err}</div>}
        <Button label={busy ? "Saving..." : "Save and continue"} onClick={submit} disabled={busy} />
      </Card>
    </Shell>
  );
}

// ── Step 2: Profile setup ─────────────────────────────────────────────────────

function ProfileSetupStep({ userId, onDone }) {
  const [profile, setProfile] = useState(null);
  const [churchName, setChurchName] = useState("");
  const [nickname, setNickname] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [cropFile, setCropFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("full_name, photo_url, nickname, church_id, church_name_custom, churches(name)")
      .eq("id", userId)
      .single()
      .then(({ data }) => {
        if (!data) return;
        setProfile(data);
        setNickname(data.nickname || "");
        setPhotoUrl(data.photo_url || "");
        setChurchName(data.churches?.name || data.church_name_custom || "");
      });
  }, [userId]);

  const uploadPhoto = async (blob) => {
    setUploading(true);
    try {
      const path = `${userId}/${Date.now()}.jpg`;
      const { error } = await supabase.storage.from("avatars").upload(path, blob, { upsert: true, contentType: "image/jpeg" });
      if (!error) {
        const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
        setPhotoUrl(pub.publicUrl);
      }
    } catch {}
    setUploading(false);
  };

  const save = async () => {
    setSaving(true);
    await supabase.from("profiles").update({ nickname: nickname.trim() || null, photo_url: photoUrl || null }).eq("id", userId);
    setSaving(false);
    onDone();
  };

  if (!profile) {
    return (
      <Shell>
        <div style={{ textAlign: "center", marginTop: "6rem", color: TSEC, fontFamily: SANS, fontSize: "14px" }}>Loading…</div>
      </Shell>
    );
  }

  return (
    <Shell>
      {cropFile && (
        <PhotoCropModal
          file={cropFile}
          onConfirm={(blob) => { setCropFile(null); uploadPhoto(blob); }}
          onCancel={() => setCropFile(null)}
        />
      )}

      <div style={{ marginTop: "2.5rem", marginBottom: "1.5rem", textAlign: "center" }}>
        <div style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.14em", color: "#FF4D00", textTransform: "uppercase", marginBottom: "0.75rem", fontFamily: SANS }}>
          Step 2 of 2
        </div>
        <div style={{ fontFamily: SANS, fontSize: "28px", fontWeight: 900, color: "#111111", lineHeight: 1.2, letterSpacing: "-0.02em" }}>
          Your profile
        </div>
        <div style={{ fontSize: "14px", color: TSEC, marginTop: "0.5rem", fontFamily: SANS }}>
          Add a photo and nickname — both are optional.
        </div>
      </div>

      {/* Photo */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "1.5rem", gap: 12 }}>
        <Avatar url={photoUrl} name={profile.full_name} size={88} />
        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { if (e.target.files[0]) setCropFile(e.target.files[0]); }} />
        <button
          onClick={() => fileRef.current.click()}
          disabled={uploading}
          style={{ background: "none", border: `1.5px solid ${BORDER}`, borderRadius: 10, padding: "8px 20px", fontFamily: SANS, fontSize: "13px", fontWeight: 600, color: "#111111", cursor: "pointer" }}
        >
          {uploading ? "Uploading…" : photoUrl ? "Change photo" : "Add a photo"}
        </button>
      </div>

      {/* Profile info card */}
      <Card style={{ marginBottom: "1rem" }}>
        {/* Name (read-only) */}
        <div style={{ marginBottom: "1rem" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", color: TSEC, textTransform: "uppercase", fontFamily: SANS, marginBottom: 6 }}>Name</div>
          <div style={{ fontSize: "15px", fontWeight: 600, color: "#111111", fontFamily: SANS }}>{profile.full_name}</div>
        </div>

        {/* Church (read-only) */}
        {churchName && (
          <div style={{ marginBottom: "1rem" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", color: TSEC, textTransform: "uppercase", fontFamily: SANS, marginBottom: 6 }}>Church</div>
            <div style={{ fontSize: "15px", color: "#111111", fontFamily: SANS }}>{churchName}</div>
          </div>
        )}

        {/* Nickname */}
        <Field
          label="NICKNAME (OPTIONAL)"
          value={nickname}
          onChange={setNickname}
          placeholder="What do people call you?"
        />
      </Card>

      <Button label={saving ? "Saving…" : "Save and continue"} onClick={save} disabled={saving || uploading} />

      <button
        onClick={onDone}
        style={{ display: "block", width: "100%", marginTop: "0.875rem", background: "none", border: "none", color: TSEC, fontFamily: SANS, fontSize: "13px", cursor: "pointer", padding: "0.5rem" }}
      >
        Skip for now
      </button>
    </Shell>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function ChangePassword({ onDone }) {
  const [step, setStep] = useState("password");
  const [userId, setUserId] = useState(null);

  if (step === "profile" && userId) {
    return <ProfileSetupStep userId={userId} onDone={onDone} />;
  }

  return (
    <PasswordStep
      onPasswordSaved={(uid) => { setUserId(uid); setStep("profile"); }}
    />
  );
}
