import { useState, useRef, useEffect } from "react";
import { supabase } from "../../lib/supabase.js";
import { validatePassword } from "../../lib/utils.js";
import { SANS } from "../../lib/constants.js";
import { Avatar } from "../../components/ui/index.js";

const CROP_SIZE = 240;

// ── Shared orange-page wrapper ─────────────────────────────────────────────────

function OrangePage({ children, style = {} }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "#FF4D00", overflowY: "auto",
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "max(2rem, env(safe-area-inset-top)) 1.5rem max(2rem, env(safe-area-inset-bottom))",
      fontFamily: SANS, ...style,
    }}>
      <style>{`.cp-input::placeholder{color:rgba(255,255,255,0.45)}`}</style>
      {children}
    </div>
  );
}

const frostedInput = {
  width: "100%", padding: "13px 16px", borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.15)",
  fontSize: "15px", fontFamily: SANS, color: "#fff", outline: "none",
  boxSizing: "border-box", WebkitTextFillColor: "#fff",
};

const fieldLabel = {
  display: "block", fontSize: "11px", fontWeight: 700,
  color: "rgba(255,255,255,0.7)", letterSpacing: "0.1em",
  textTransform: "uppercase", fontFamily: SANS, marginBottom: 8,
};

const whiteBtn = {
  width: "100%", padding: "15px", background: "#fff", color: "#FF4D00",
  border: "none", borderRadius: 12, fontSize: "15px", fontWeight: 800,
  fontFamily: SANS, cursor: "pointer",
};

const LogoImg = ({ size = 100, style = {} }) => (
  <img
    src="/logo.png"
    alt="412 Ministry"
    style={{
      width: size, height: size, borderRadius: size * 0.29,
      clipPath: `inset(0 round ${size * 0.29}px)`,
      objectFit: "cover",
      border: "3px solid rgba(255,255,255,0.55)",
      boxShadow: "0 0 0 6px rgba(255,255,255,0.15), 0 16px 40px rgba(0,0,0,0.2)",
      ...style,
    }}
  />
);

// ── Photo crop modal ──────────────────────────────────────────────────────────

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
    setMinScale(fill); setScale(fill);
  };

  const startDrag = (x, y) => { setDragging(true); dragOrigin.current = { x: x - offset.x, y: y - offset.y }; };
  const moveDrag = (x, y) => { if (!dragging || !dragOrigin.current) return; setOffset({ x: x - dragOrigin.current.x, y: y - dragOrigin.current.y }); };
  const endDrag = () => setDragging(false);

  const handleConfirm = () => {
    const img = imgRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = 400; canvas.height = 400;
    const ctx = canvas.getContext("2d");
    const srcW = CROP_SIZE / scale, srcH = CROP_SIZE / scale;
    const srcX = (img.naturalWidth - srcW) / 2 - offset.x / scale;
    const srcY = (img.naturalHeight - srcH) / 2 - offset.y / scale;
    ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, 400, 400);
    canvas.toBlob((blob) => onConfirm(blob), "image/jpeg", 0.92);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(0,0,0,0.88)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ color: "#fff", fontFamily: SANS, fontSize: "15px", fontWeight: 600, marginBottom: 20 }}>Drag to adjust your photo</div>
      <div
        style={{ width: CROP_SIZE, height: CROP_SIZE, borderRadius: "50%", overflow: "hidden", border: "3px solid #fff", position: "relative", cursor: dragging ? "grabbing" : "grab", flexShrink: 0, background: "#1B2A4A" }}
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
      <input type="range" min={minScale} max={minScale * 3} step={0.01} value={scale} onChange={(e) => setScale(parseFloat(e.target.value))} style={{ width: CROP_SIZE, marginTop: 20 }} />
      <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
        <button onClick={onCancel} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 10, padding: "12px 28px", color: "#fff", fontFamily: SANS, fontSize: "14px", cursor: "pointer" }}>Cancel</button>
        <button onClick={handleConfirm} style={{ background: "#fff", border: "none", borderRadius: 12, padding: "12px 28px", color: "#FF4D00", fontFamily: SANS, fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>Use this photo</button>
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
    <OrangePage style={{ justifyContent: "center" }}>
      <LogoImg size={90} style={{ marginBottom: "1.75rem" }} />

      <div style={{ textAlign: "center", marginBottom: "2.25rem" }}>
        <div style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "0.14em", color: "rgba(255,255,255,0.7)", textTransform: "uppercase", marginBottom: "0.75rem" }}>Step 1 of 2</div>
        <div style={{ fontSize: "32px", fontWeight: 900, color: "#fff", lineHeight: 1.1, letterSpacing: "-0.03em" }}>Set your password.</div>
        <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.65)", marginTop: "0.5rem", lineHeight: 1.6 }}>
          Replace the temporary password<br />with one only you know.
        </div>
      </div>

      <div style={{ width: "100%", maxWidth: 380 }} onKeyDown={(e) => { if (e.key === "Enter") submit(); }}>
        <div style={{ marginBottom: "1.25rem" }}>
          <label style={fieldLabel}>New password</label>
          <input className="cp-input" type="password" value={pw1} onChange={(e) => setPw1(e.target.value)} placeholder="Min 8 chars, capital, number, symbol" style={frostedInput} />
        </div>
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={fieldLabel}>Confirm password</label>
          <input className="cp-input" type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="Type it again" style={frostedInput} />
        </div>
        {err && <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 8, padding: "8px 12px", fontSize: "13px", color: "#fff", marginBottom: "1rem" }}>{err}</div>}
        <button onClick={submit} disabled={busy} style={{ ...whiteBtn, opacity: busy ? 0.7 : 1 }}>
          {busy ? "Saving…" : "Save and continue →"}
        </button>
      </div>
    </OrangePage>
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
      .eq("id", userId).single()
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
    onDone("welcome");
  };

  if (!profile) {
    return (
      <OrangePage style={{ justifyContent: "center" }}>
        <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px" }}>Loading…</div>
      </OrangePage>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "#FAFAFA", overflowY: "auto", fontFamily: SANS }}>
      {cropFile && (
        <PhotoCropModal
          file={cropFile}
          onConfirm={(blob) => { setCropFile(null); uploadPhoto(blob); }}
          onCancel={() => setCropFile(null)}
        />
      )}

      {/* Orange header */}
      <div style={{ background: "#FF4D00", padding: "max(2rem, env(safe-area-inset-top)) 1.5rem 2rem", textAlign: "center" }}>
        <div style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "0.14em", color: "rgba(255,255,255,0.7)", textTransform: "uppercase", marginBottom: "0.75rem" }}>Step 2 of 2</div>
        <div style={{ fontSize: "30px", fontWeight: 900, color: "#fff", lineHeight: 1.1, letterSpacing: "-0.03em" }}>Your profile.</div>
        <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.65)", marginTop: "0.5rem" }}>Add a photo and nickname — both optional.</div>
      </div>

      {/* White content */}
      <div style={{ padding: "1.75rem 1.5rem max(2rem, env(safe-area-inset-bottom))", maxWidth: 460, margin: "0 auto" }}>

        {/* Photo */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "1.5rem", gap: 12 }}>
          <Avatar url={photoUrl} name={profile.full_name} size={88} />
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { if (e.target.files[0]) setCropFile(e.target.files[0]); }} />
          <button
            onClick={() => fileRef.current.click()}
            disabled={uploading}
            style={{ background: "none", border: "1.5px solid #E5E5E5", borderRadius: 10, padding: "8px 20px", fontFamily: SANS, fontSize: "13px", fontWeight: 600, color: "#1B2A4A", cursor: "pointer" }}
          >
            {uploading ? "Uploading…" : photoUrl ? "Change photo" : "Add a photo"}
          </button>
        </div>

        {/* Info card */}
        <div style={{ background: "#fff", border: "1px solid #E5E5E5", borderRadius: 14, padding: "1.25rem", marginBottom: "1rem" }}>
          <div style={{ marginBottom: "1rem" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", color: "#6B7280", textTransform: "uppercase", marginBottom: 6 }}>Name</div>
            <div style={{ fontSize: "15px", fontWeight: 600, color: "#1B2A4A" }}>{profile.full_name}</div>
          </div>
          {churchName && (
            <div style={{ marginBottom: "1rem" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", color: "#6B7280", textTransform: "uppercase", marginBottom: 6 }}>Church</div>
              <div style={{ fontSize: "15px", color: "#1B2A4A" }}>{churchName}</div>
            </div>
          )}
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", color: "#6B7280", textTransform: "uppercase", marginBottom: 8 }}>Nickname (optional)</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="What do people call you?"
              style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #E5E5E5", background: "#F5F5F5", fontSize: "15px", fontFamily: SANS, color: "#1B2A4A", outline: "none", boxSizing: "border-box" }}
            />
          </div>
        </div>

        {/* PWA install card */}
        <div style={{ background: "#1B2A4A", borderRadius: 14, padding: "1.25rem", marginBottom: "1.25rem" }}>
          <div style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.14em", color: "#FF4D00", textTransform: "uppercase", marginBottom: "0.5rem" }}>Add to Your Home Screen</div>
          <div style={{ fontSize: "13px", color: "#B8C0D0", lineHeight: 1.6, marginBottom: "1rem" }}>
            Install the 412 Ministry app on your phone so you can open it like any other app — no browser needed.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#fff", marginBottom: 3 }}>iPhone (Safari)</div>
              <div style={{ fontSize: "12px", color: "#8A9BB0", lineHeight: 1.6 }}>
                Tap the <span style={{ color: "#FF4D00", fontWeight: 700 }}>Share</span> button at the bottom → scroll down → tap <span style={{ color: "#FF4D00", fontWeight: 700 }}>"Add to Home Screen"</span> → tap Add.
              </div>
            </div>
            <div>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#fff", marginBottom: 3 }}>Android (Chrome)</div>
              <div style={{ fontSize: "12px", color: "#8A9BB0", lineHeight: 1.6 }}>
                Tap the <span style={{ color: "#FF4D00", fontWeight: 700 }}>⋮ menu</span> in the top-right → tap <span style={{ color: "#FF4D00", fontWeight: 700 }}>"Add to Home Screen"</span> → tap Add.
              </div>
            </div>
          </div>
        </div>

        <button onClick={save} disabled={saving || uploading} style={{ width: "100%", padding: "15px", background: "#FF4D00", color: "#fff", border: "none", borderRadius: 12, fontSize: "15px", fontWeight: 800, fontFamily: SANS, cursor: saving ? "default" : "pointer", opacity: (saving || uploading) ? 0.7 : 1, marginBottom: "0.875rem" }}>
          {saving ? "Saving…" : "Save and continue →"}
        </button>
        <button onClick={() => onDone("welcome")} style={{ display: "block", width: "100%", background: "none", border: "none", color: "#6B7280", fontFamily: SANS, fontSize: "13px", cursor: "pointer", padding: "0.5rem" }}>
          Skip for now
        </button>
      </div>
    </div>
  );
}

// ── Welcome screen ────────────────────────────────────────────────────────────

function WelcomeScreen({ onEnter }) {
  return (
    <OrangePage style={{ justifyContent: "center", textAlign: "center" }}>
      <LogoImg size={120} style={{ marginBottom: "2rem" }} />
      <div style={{ fontSize: "13px", fontWeight: 800, letterSpacing: "0.16em", color: "rgba(255,255,255,0.65)", textTransform: "uppercase", marginBottom: "0.75rem" }}>
        Welcome to
      </div>
      <div style={{ fontSize: "38px", fontWeight: 900, color: "#fff", lineHeight: 1.1, letterSpacing: "-0.03em", marginBottom: "0.25rem" }}>
        412 Ministry
      </div>
      <div style={{ fontSize: "38px", fontWeight: 900, color: "#fff", lineHeight: 1.1, letterSpacing: "-0.03em", marginBottom: "1.5rem" }}>
        Platform.
      </div>
      <div style={{ fontSize: "15px", color: "rgba(255,255,255,0.65)", lineHeight: 1.7, marginBottom: "2.5rem", maxWidth: 300 }}>
        You're all set. Your profile is ready and your account is secure.
      </div>
      <button onClick={onEnter} style={{ ...whiteBtn, maxWidth: 340 }}>
        Let's go →
      </button>
    </OrangePage>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function ChangePassword({ onDone }) {
  const [step, setStep] = useState("password");
  const [userId, setUserId] = useState(null);

  if (step === "welcome") return <WelcomeScreen onEnter={onDone} />;
  if (step === "profile" && userId) return <ProfileSetupStep userId={userId} onDone={(next) => setStep(next)} />;

  return <PasswordStep onPasswordSaved={(uid) => { setUserId(uid); setStep("profile"); }} />;
}
