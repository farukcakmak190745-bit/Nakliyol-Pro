import { supabase } from "../supabaseClient";

const VAPID_PUBLIC_KEY = process.env.REACT_APP_VAPID_PUBLIC_KEY || "";

// https://github.com/web-push-libs/web-push#using-vapid-key-for-applicationserverkey
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Service worker'ı kaydet
export async function serviceWorkerKaydet() {
  if (!("serviceWorker" in navigator)) return false;
  try {
    await navigator.serviceWorker.register("/sw.js");
    return true;
  } catch (err) {
    console.warn("Service worker kaydı başarısız:", err);
    return false;
  }
}

// Tarayıcıda push desteği var mı?
export function pushDestegiVar() {
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window &&
    !!VAPID_PUBLIC_KEY
  );
}

// Abonelik oluştur (kullanıcı izniyle)
export async function pushAboneOl() {
  if (!pushDestegiVar()) return null;

  if (Notification.permission !== "granted") {
    const izin = await Notification.requestPermission();
    if (izin !== "granted") return null;
  }

  const kayit = await navigator.serviceWorker.ready;
  let abonelik = await kayit.pushManager.getSubscription();
  if (!abonelik) {
    abonelik = await kayit.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });
  }
  return abonelik;
}

// Aboneliği Supabase'e kaydet
export async function pushAboneligiKaydet(userId) {
  if (!userId || !pushDestegiVar()) return null;

  try {
    const abonelik = await pushAboneOl();
    if (!abonelik) return null;

    const veri = {
      user_id: userId,
      endpoint: abonelik.endpoint,
      p256dh: abonelik.getKey("p256dh") ? btoa(String.fromCharCode(...new Uint8Array(abonelik.getKey("p256dh")))) : "",
      auth: abonelik.getKey("auth") ? btoa(String.fromCharCode(...new Uint8Array(abonelik.getKey("auth")))) : "",
      tarayici: navigator.userAgent || ""
    };

    if (!veri.p256dh || !veri.auth) return null;

    // Aynı endpoint varsa güncelle, yoksa ekle (upsert)
    const { data, error } = await supabase
      .from("push_abonelikleri")
      .upsert(veri, { onConflict: "user_id,endpoint" });

    if (error) {
      console.warn("Push aboneliği Supabase'e kaydedilemedi:", error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn("Push aboneliği oluşturulamadı:", err);
    return null;
  }
}

// Aboneliği iptal et (çıkış yapınca)
export async function pushAbonelikKaldir() {
  try {
    if ("serviceWorker" in navigator) {
      const kayit = await navigator.serviceWorker.ready;
      const abonelik = await kayit.pushManager.getSubscription();
      if (abonelik) {
        // Supabase'den sil
        await supabase
          .from("push_abonelikleri")
          .delete()
          .eq("endpoint", abonelik.endpoint);
        await abonelik.unsubscribe();
      }
    }
  } catch (err) {
    console.warn("Push abonelik kaldırma hatası:", err);
  }
}

// Bildirim tetikle — Vercel fonksiyonunu çağır
// hedef: { hedefKullaniciId } veya { hedefRol }
export async function pushGonder({ hedefKullaniciId, hedefRol, baslik, icerik, url, zorunlu }) {
  try {
    const res = await fetch("/api/push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hedefKullaniciId, hedefRol, baslik, icerik, url, zorunlu })
    });
    const sonuc = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.warn("Push gönderimi başarısız:", sonuc);
      return null;
    }
    return sonuc;
  } catch (err) {
    console.warn("Push gönderim hatası:", err);
    return null;
  }
}
