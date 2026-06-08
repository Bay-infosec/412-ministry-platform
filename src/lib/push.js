// Public key is safe to hardcode (it's a public key, not a secret)
const VAPID_PUBLIC_KEY =
  import.meta.env.VITE_VAPID_PUBLIC_KEY ||
  "BIyqfG3LF7u1_qDSsSqu4hgjLojQYP5PjOAbqibiFRfAwwhP8J5zOJ01kNf_Dxy_-X47rtUem0yTLuaNw2mmqxU";

function urlBase64ToUint8Array(base64) {
  const pad = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + pad).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

export function pushSupported() {
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function pushPermission() {
  if (!pushSupported()) return "unsupported";
  return Notification.permission; // 'default' | 'granted' | 'denied'
}

export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
    return reg;
  } catch (e) {
    console.warn("SW registration failed:", e);
    return null;
  }
}

export async function subscribeToPush(profileId, supabase) {
  if (!pushSupported()) return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return false;

    const existing = await reg.pushManager.getSubscription();
    const sub =
      existing ||
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      }));

    const json = sub.toJSON();
    await supabase.from("push_subscriptions").upsert(
      {
        profile_id: profileId,
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
      },
      { onConflict: "endpoint" }
    );
    return true;
  } catch (e) {
    console.warn("Push subscribe failed:", e);
    return false;
  }
}

export async function unsubscribeFromPush(profileId, supabase) {
  if (!("serviceWorker" in navigator)) return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      const endpoint = sub.endpoint;
      await sub.unsubscribe();
      await supabase
        .from("push_subscriptions")
        .delete()
        .eq("profile_id", profileId)
        .eq("endpoint", endpoint);
    }
    return true;
  } catch (e) {
    console.warn("Push unsubscribe failed:", e);
    return false;
  }
}
