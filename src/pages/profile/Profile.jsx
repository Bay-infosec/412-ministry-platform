import { useState, useRef, useEffect } from "react";
import { supabase } from "../../lib/supabase.js";
import { formatPhoneInput, validatePassword } from "../../lib/utils.js";
import { pushSupported, pushPermission, subscribeToPush, unsubscribeFromPush } from "../../lib/push.js";
import { TSEC, BORDER, SANS } from "../../lib/constants.js";
import { Shell } from "../../components/layout/index.js";
import { Card, Field, Button, Avatar, SectionLabel, Badge, ProfileTags } from "../../components/ui/index.js";

const CROP_SIZE = 270;

// ── Photo crop modal ────────────────────────────────────────────────────────

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
    canvas.width = 400;
    canvas.height = 400;
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
        style={{ width: CROP_SIZE, height: CROP_SIZE, borderRadius: "50%", overflow: "hidden", border: "3px solid #fff", position: "relative", cursor: dragging ? "grabbing" : "grab", flexShrink: 0, background: "#1B2A4A" }}
        onMouseDown={(e) => startDrag(e.clientX, e.clientY)}
        onMouseMove={(e) => moveDrag(e.clientX, e.clientY)}
        onMouseUp={endDrag} onMouseLeave={endDrag}
        onTouchStart={(e) => { const t = e.touches[0]; startDrag(t.clientX, t.clientY); }}
        onTouchMove={(e) => { e.preventDefault(); const t = e.touches[0]; moveDrag(t.clientX, t.clientY); }}
        onTouchEnd={endDrag}
      >
        {imgSrc && (
          <img ref={imgRef} src={imgSrc} alt="crop preview" onLoad={onImgLoad} draggable={false}
            style={{ position: "absolute", left: "50%", top: "50%", transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${scale})`, transformOrigin: "center", maxWidth: "none", userSelect: "none", pointerEvents: "none" }}
          />
        )}
      </div>
      <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => setScale((s) => Math.max(minScale, +(s - 0.1).toFixed(2)))} style={{ color: "#fff", background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontSize: 18, fontFamily: SANS }}>−</button>
        <input type="range" min={minScale} max={minScale * 3} step="0.01" value={scale} onChange={(e) => setScale(Number(e.target.value))} style={{ width: 130, accentColor: "#FF4D00" }} />
        <button onClick={() => setScale((s) => Math.min(minScale * 3, +(s + 0.1).toFixed(2)))} style={{ color: "#fff", background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontSize: 18, fontFamily: SANS }}>+</button>
      </div>
      <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
        <button onClick={onCancel} style={{ padding: "12px 22px", borderRadius: 10, background: "rgba(255,255,255,0.14)", color: "#fff", border: "none", fontFamily: SANS, fontSize: "14px", cursor: "pointer" }}>Cancel</button>
        <button onClick={handleConfirm} style={{ padding: "12px 28px", borderRadius: 10, background: "#FF4D00", color: "#fff", border: "none", fontFamily: SANS, fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>Use this photo</button>
      </div>
    </div>
  );
}

// ── Install App modal ────────────────────────────────────────────────────────

function InstallAppModal({ onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 998, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div
        style={{ background: "#1B2A4A", borderRadius: "20px 20px 0 0", padding: "1.5rem 1.5rem 2.5rem", width: "100%", maxWidth: 460, maxHeight: "85vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <div style={{ fontSize: "9px", fontWeight: 800, letterSpacing: "0.14em", color: "#FF4D00", textTransform: "uppercase", fontFamily: SANS }}>Install the App</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", fontSize: 22, cursor: "pointer", lineHeight: 1, padding: 0 }}>×</button>
        </div>
        <div style={{ fontSize: "18px", fontWeight: 800, color: "#fff", fontFamily: SANS, marginBottom: "1.25rem", letterSpacing: "-0.02em" }}>
          Add to your home screen
        </div>

        {[
          { platform: "iPhone (Safari)", steps: ["Open this page in Safari", "Tap the Share icon at the bottom", "Scroll down and tap \"Add to Home Screen\"", "Tap Add — done!"] },
          { platform: "Android (Chrome)", steps: ["Open this page in Chrome", "Tap the three-dot menu (⋮) in the top right", "Tap \"Add to Home Screen\" or \"Install app\"", "Tap Install — done!"] },
        ].map(({ platform, steps }) => (
          <div key={platform} style={{ marginBottom: "1.25rem" }}>
            <div style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.1em", color: "#FF4D00", textTransform: "uppercase", fontFamily: SANS, marginBottom: "0.625rem" }}>
              {platform}
            </div>
            {steps.map((step, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#FF4D00", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "10px", fontWeight: 800, color: "#fff", fontFamily: SANS }}>
                  {i + 1}
                </div>
                <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", fontFamily: SANS, lineHeight: 1.55, paddingTop: 2 }}>{step}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Change password modal ────────────────────────────────────────────────────

function ChangePasswordModal({ onClose, onSuccess }) {
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setMsg("");
    const err = validatePassword(pw1);
    if (err) { setMsg(err); return; }
    if (pw1 !== pw2) { setMsg("Passwords do not match."); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw1 });
    setBusy(false);
    if (error) { setMsg("Could not update password."); return; }
    onSuccess();
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 998, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div
        style={{ background: "#fff", borderRadius: "20px 20px 0 0", padding: "1.5rem 1.5rem 2.5rem", width: "100%", maxWidth: 460 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <div style={{ fontSize: "18px", fontWeight: 800, color: "#1B2A4A", fontFamily: SANS, letterSpacing: "-0.02em" }}>Change Password</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: TSEC, fontSize: 22, cursor: "pointer", lineHeight: 1, padding: 0 }}>×</button>
        </div>
        <Field label="NEW PASSWORD" type="password" value={pw1} onChange={setPw1} placeholder="Min 8 chars, capital, number, symbol" />
        <Field label="CONFIRM PASSWORD" type="password" value={pw2} onChange={setPw2} placeholder="Type it again" />
        {msg && <div style={{ fontSize: "13px", color: "#C0392B", marginBottom: "0.75rem", fontFamily: SANS }}>{msg}</div>}
        <Button label={busy ? "Updating…" : "Update password"} onClick={submit} disabled={busy} />
      </div>
    </div>
  );
}

// ── Delete account modal ─────────────────────────────────────────────────────

function DeleteAccountModal({ onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 998, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div
        style={{ background: "#fff", borderRadius: "20px 20px 0 0", padding: "1.5rem 1.5rem 2.5rem", width: "100%", maxWidth: 460 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div style={{ fontSize: "18px", fontWeight: 800, color: "#1B2A4A", fontFamily: SANS, letterSpacing: "-0.02em" }}>Delete Account</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: TSEC, fontSize: 22, cursor: "pointer", lineHeight: 1, padding: 0 }}>×</button>
        </div>
        <div style={{ fontSize: "14px", color: TSEC, fontFamily: SANS, lineHeight: 1.65, marginBottom: "1.25rem" }}>
          Account deletion is handled by an admin to preserve your event history and team records. Contact your admin to request deletion.
        </div>
        <div style={{ background: "#FFF5F0", border: "1px solid #FFD5C0", borderRadius: 12, padding: "0.875rem 1rem", fontSize: "14px", fontWeight: 600, color: "#1B2A4A", fontFamily: SANS }}>
          tsekvv.tb@gmail.com
        </div>
        <div style={{ fontSize: "11px", color: TSEC, fontFamily: SANS, marginTop: 6 }}>Send an email to the admin above and they'll take care of it.</div>
      </div>
    </div>
  );
}

// ── Settings row helper ──────────────────────────────────────────────────────

function SettingsRow({ icon, label, sub, onClick, right, danger }) {
  return (
    <button
      onClick={onClick}
      style={{ width: "100%", background: "none", border: "none", padding: "0.75rem 0", display: "flex", alignItems: "center", gap: 14, cursor: "pointer", borderBottom: `0.5px solid ${BORDER}`, textAlign: "left" }}
    >
      <div style={{ width: 36, height: 36, borderRadius: 10, background: danger ? "#FEF2F2" : "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "14px", fontWeight: 600, color: danger ? "#DC2626" : "#1B2A4A", fontFamily: SANS }}>{label}</div>
        {sub && <div style={{ fontSize: "12px", color: TSEC, fontFamily: SANS, marginTop: 1 }}>{sub}</div>}
      </div>
      {right || (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={TSEC} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6" />
        </svg>
      )}
    </button>
  );
}

// ── Main Profile component ───────────────────────────────────────────────────

export default function Profile({ data, onSaved, onSignOut, onOpenAdmin, onBack }) {
  const { profile, history, churches } = data;
  const [editing, setEditing] = useState(false);
  const [nickname, setNickname] = useState(profile.nickname || "");
  const [phone, setPhone] = useState(profile.phone || "");
  const [ministryRole, setMinistryRole] = useState(profile.ministry_role || "");
  const [hobby, setHobby] = useState(profile.hobby || "");
  const [churchId, setChurchId] = useState(
    profile.church_id ? profile.church_id : (profile.church_name_custom ? "other" : "")
  );
  const [customChurch, setCustomChurch] = useState(profile.church_name_custom || "");
  const [photoUrl, setPhotoUrl] = useState(profile.photo_url || "");
  const [cropFile, setCropFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  // Settings modals
  const [showInstall, setShowInstall] = useState(false);
  const [showChangePw, setShowChangePw] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);

  // Notifications
  const [notifPerm, setNotifPerm] = useState(() => pushPermission());
  const [notifBusy, setNotifBusy] = useState(false);

  const isStaff = profile.platform_role === "admin" || profile.platform_role === "moderator";

  async function toggleNotifications() {
    setNotifBusy(true);
    if (notifPerm === "granted") {
      await unsubscribeFromPush(profile.id, supabase);
    } else {
      await subscribeToPush(profile.id, supabase);
    }
    setNotifPerm(pushPermission());
    setNotifBusy(false);
  }

  const uploadPhoto = async (blob) => {
    if (!blob) return;
    setUploading(true);
    setMsg("");
    try {
      const path = `${profile.id}/${Date.now()}.jpg`;
      const { error } = await supabase.storage.from("avatars").upload(path, blob, { upsert: true, contentType: "image/jpeg" });
      if (error) { setMsg("Photo upload failed."); setUploading(false); return; }
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      setPhotoUrl(pub.publicUrl);
    } catch {
      setMsg("Photo upload failed.");
    }
    setUploading(false);
  };

  const save = async () => {
    setMsg("");
    const phoneDigits = phone.replace(/\D/g, "");
    if (phone && phoneDigits.length !== 10) { setMsg("Please enter a valid 10-digit phone number, e.g. (619)555-1234."); return; }
    if (churchId === "other" && !customChurch.trim()) { setMsg("Please enter your church name."); return; }
    setBusy(true);
    const { error } = await supabase.from("profiles").update({
      nickname, phone, ministry_role: ministryRole, hobby, photo_url: photoUrl,
      church_id: churchId && churchId !== "other" ? churchId : null,
      church_name_custom: churchId === "other" ? customChurch.trim() : null,
    }).eq("id", profile.id);
    setBusy(false);
    if (error) { setMsg("Could not save."); return; }
    setMsg("Saved.");
    await onSaved();
    setEditing(false);
  };

  const churchName = profile.church_id
    ? (churches || []).find((c) => c.id === profile.church_id)?.name
    : profile.church_name_custom ? `${profile.church_name_custom} (pending)` : null;

  // ── View mode ──────────────────────────────────────────────────────────────
  if (!editing) {
    return (
      <Shell withNav>
        {/* Modals */}
        {showInstall && <InstallAppModal onClose={() => setShowInstall(false)} />}
        {showChangePw && (
          <ChangePasswordModal
            onClose={() => setShowChangePw(false)}
            onSuccess={() => { setShowChangePw(false); setMsg("Password updated."); }}
          />
        )}
        {showDeleteAccount && <DeleteAccountModal onClose={() => setShowDeleteAccount(false)} />}

        {onBack && (
          <button onClick={onBack} style={{ background: "none", border: "none", color: TSEC, fontSize: "14px", cursor: "pointer", padding: "0 0 1rem 0", fontFamily: SANS, display: "block" }}>
            ‹ Back to Messages
          </button>
        )}

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <div style={{ fontFamily: SANS, fontSize: "26px", fontWeight: 900, color: "#1B2A4A", letterSpacing: "-0.02em" }}>My Profile</div>
          <button onClick={onSignOut} style={{ background: "none", border: "none", color: TSEC, fontSize: "13px", cursor: "pointer", fontFamily: SANS }}>
            Sign out
          </button>
        </div>

        {/* Avatar */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "1.5rem" }}>
          <Avatar url={profile.photo_url} name={profile.full_name} size={96} />
          <div style={{ fontFamily: SANS, fontSize: "24px", fontWeight: 900, color: "#1B2A4A", marginTop: "0.75rem" }}>
            {profile.full_name}
          </div>
          {profile.nickname && <div style={{ fontSize: "14px", color: TSEC, marginTop: 2 }}>"{profile.nickname}"</div>}
          <div style={{ marginTop: "0.625rem", display: "flex", justifyContent: "center" }}>
            <ProfileTags profile={profile} />
          </div>
        </div>

        {/* Info card */}
        <Card style={{ marginBottom: "1rem" }}>
          {[["EMAIL", profile.email], ["PHONE", profile.phone], ["CHURCH", churchName], ["ROLE", profile.ministry_role]].map(([label, val]) => (
            <div key={label} style={{ padding: "0.75rem 0", borderBottom: `0.5px solid ${BORDER}` }}>
              <div style={{ fontSize: "11px", fontWeight: 600, color: TSEC, letterSpacing: "0.04em", marginBottom: 3, fontFamily: SANS }}>{label}</div>
              <div style={{ fontSize: "15px", color: val ? "#1B2A4A" : "#6B7280" }}>{val || "Not set"}</div>
            </div>
          ))}
        </Card>

        {/* Edit profile */}
        <button
          onClick={() => setEditing(true)}
          style={{ width: "100%", background: "#fff", border: "1px solid #E5E5E5", color: "#FF4D00", padding: "12px", borderRadius: 10, cursor: "pointer", fontWeight: 600, fontSize: "15px", fontFamily: SANS, marginBottom: "1rem" }}
        >
          Edit profile
        </button>

        {/* Admin panel */}
        {isStaff && (
          <button
            onClick={onOpenAdmin}
            style={{ width: "100%", background: "#FF4D00", border: "none", color: "#fff", padding: "14px", borderRadius: 10, cursor: "pointer", fontWeight: 600, fontSize: "15px", fontFamily: SANS, marginBottom: "1rem", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Admin Panel
          </button>
        )}

        {/* Settings */}
        <SectionLabel style={{ marginBottom: "0.5rem" }}>Settings</SectionLabel>
        <Card style={{ marginBottom: "1.5rem", padding: "0 1rem" }}>
          {/* Notifications */}
          {pushSupported() ? (
            <SettingsRow
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={notifPerm === "granted" ? "#FF4D00" : "#6B7280"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
                </svg>
              }
              label="Notifications"
              sub={notifPerm === "denied" ? "Blocked in browser settings" : notifPerm === "granted" ? "Enabled" : "Get notified about announcements"}
              onClick={notifPerm !== "denied" ? toggleNotifications : undefined}
              right={
                pushSupported() && notifPerm !== "denied" ? (
                  <div style={{ width: 44, height: 26, borderRadius: 13, background: notifPerm === "granted" ? "#FF4D00" : "#E5E5E5", position: "relative", transition: "background 0.2s", flexShrink: 0, opacity: notifBusy ? 0.5 : 1 }}>
                    <div style={{ position: "absolute", top: 3, left: notifPerm === "granted" ? 21 : 3, width: 20, height: 20, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "left 0.2s" }} />
                  </div>
                ) : null
              }
            />
          ) : null}

          {/* Change password */}
          <SettingsRow
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
            }
            label="Change Password"
            sub="Update your login password"
            onClick={() => setShowChangePw(true)}
          />

          {/* Install app */}
          <SettingsRow
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12" y2="18" strokeWidth="3" />
              </svg>
            }
            label="Install App"
            sub="Add to your home screen"
            onClick={() => setShowInstall(true)}
          />

          {/* Delete account */}
          <SettingsRow
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
              </svg>
            }
            label="Delete Account"
            sub="Contact admin to remove your account"
            onClick={() => setShowDeleteAccount(true)}
            danger
          />
        </Card>

        {/* History */}
        <SectionLabel>My History</SectionLabel>
        {history && history.length > 0 ? (
          history.map((h, i) => (
            <Card key={i} style={{ marginBottom: "0.875rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <div style={{ fontFamily: SANS, fontSize: "18px", fontWeight: 600, color: "#1B2A4A" }}>{h.events?.name || "Event"}</div>
                <Badge variant={h.events?.status} />
              </div>
              <div style={{ fontSize: "13px", color: TSEC }}>
                {h.event_role === "leader" ? "Team leader" : h.event_role} · Team {h.team_number}
              </div>
            </Card>
          ))
        ) : (
          <div style={{ fontSize: "14px", color: TSEC }}>Your event history will appear here.</div>
        )}

        {msg && <div style={{ fontSize: "13px", color: "#0A7C42", marginTop: "0.5rem", fontFamily: SANS, textAlign: "center" }}>{msg}</div>}
      </Shell>
    );
  }

  // ── Edit mode ──────────────────────────────────────────────────────────────
  return (
    <Shell withNav>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <button onClick={() => { setEditing(false); setMsg(""); }} style={{ background: "none", border: "none", color: TSEC, fontSize: "13px", cursor: "pointer", fontFamily: SANS, padding: 0 }}>
          ← Back
        </button>
        <div style={{ fontFamily: SANS, fontSize: "22px", fontWeight: 900, color: "#1B2A4A", letterSpacing: "-0.02em" }}>Edit Profile</div>
        <div style={{ width: 40 }} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "1.5rem" }}>
        <Avatar url={photoUrl} name={profile.full_name} size={96} />
        <label style={{ marginTop: "0.75rem", fontSize: "13px", fontWeight: 600, color: "#FF4D00", cursor: "pointer", fontFamily: SANS }}>
          {uploading ? "Uploading..." : photoUrl ? "Change photo" : "Add a photo"}
          <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { if (e.target.files[0]) setCropFile(e.target.files[0]); e.target.value = ""; }} />
        </label>
      </div>

      {cropFile && (
        <PhotoCropModal file={cropFile} onConfirm={(blob) => { setCropFile(null); uploadPhoto(blob); }} onCancel={() => setCropFile(null)} />
      )}

      <Card style={{ marginBottom: "1rem" }}>
        <div style={{ marginBottom: "1rem" }}>
          <div style={{ fontSize: "12px", fontWeight: 600, color: TSEC, marginBottom: 6, letterSpacing: "0.04em", fontFamily: SANS }}>FULL NAME</div>
          <div style={{ padding: "12px 14px", borderRadius: 10, background: "#F3F4F6", fontSize: "15px", color: TSEC }}>{profile.full_name}</div>
          <div style={{ fontSize: "11px", color: TSEC, marginTop: 4, fontFamily: SANS }}>Name and email cannot be changed here.</div>
        </div>

        <Field label="NICKNAME" value={nickname} onChange={setNickname} placeholder="What should we call you?" />
        <Field label="PHONE" type="tel" value={phone} onChange={(val) => setPhone(formatPhoneInput(val))} placeholder="(xxx)xxx-xxxx" />
        <Field label="MINISTRY ROLE" value={ministryRole} onChange={setMinistryRole} placeholder="e.g. Youth Pastor, Engineer, Nurse" />
        <Field label="HOBBY" value={hobby} onChange={setHobby} placeholder="e.g. Hiking, Photography, Basketball" />

        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: TSEC, marginBottom: 6, letterSpacing: "0.04em", fontFamily: SANS }}>CHURCH</label>
          <select value={churchId} onChange={(e) => setChurchId(e.target.value)} style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid ${BORDER}`, fontSize: "15px", fontFamily: SANS, color: "#1B2A4A", background: "#fff", outline: "none" }}>
            <option value="">Select your church</option>
            {(churches || []).map((c) => (
              <option key={c.id} value={c.id}>{c.name}{c.city ? ` — ${c.city}` : ""}</option>
            ))}
            <option value="other">Other (not listed)</option>
          </select>
          {churchId === "other" && (
            <div style={{ marginTop: 8 }}>
              <input
                type="text" value={customChurch} onChange={(e) => setCustomChurch(e.target.value)}
                placeholder="Enter your church name"
                style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid ${BORDER}`, fontSize: "15px", fontFamily: SANS, color: "#1B2A4A", background: "#fff", outline: "none", boxSizing: "border-box" }}
              />
              <div style={{ fontSize: "11px", color: TSEC, marginTop: 4, fontFamily: SANS }}>Your church will be listed as pending until an admin adds it.</div>
            </div>
          )}
        </div>

        {msg && <div style={{ fontSize: "13px", color: msg.includes("Saved") ? "#0A7C42" : "#C0392B", marginBottom: "0.5rem", fontFamily: SANS }}>{msg}</div>}
        <Button label={busy ? "Saving..." : "Save changes"} onClick={save} disabled={busy} />
      </Card>
    </Shell>
  );
}
