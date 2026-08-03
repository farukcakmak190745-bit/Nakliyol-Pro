// Paylaşılan istatistik/iş kuralı yardımcıları.
// AdminPanel, ProfilKart ve ileride başka bileşenler ortak kullanır.
// "tamamlandı" / "tamamlandi" / "odendi" karışıklığı tek yerde çözülür.

export const TAMAMLANMIS_DURUMLAR = ["odendi", "tamamlandi", "tamamlandı"];

export function seferTamamlandiMi(sefer) {
  return !!sefer && TAMAMLANMIS_DURUMLAR.includes(sefer.durum);
}

/**
 * Bir kullanıcının ilan/sefer/ihtilaf özeti (AdminPanel kullanıcı satırı için).
 */
export function kullaniciIstatistik(kullanici, { ilanlar = [], seferler = [], ihtilaflar = [] } = {}) {
  const id = kullanici?.id;
  if (!id) return { ilanSayisi: 0, seferSayisi: 0, tamamlanan: 0, ihtilafSayisi: 0 };

  const kullaniciSeferleri = seferler.filter(s =>
    s.kamyoncu_user_id === id || s.olusturan_id === id
  );

  return {
    ilanSayisi: ilanlar.filter(i => i.olusturan_id === id).length,
    seferSayisi: kullaniciSeferleri.length,
    tamamlanan: kullaniciSeferleri.filter(seferTamamlandiMi).length,
    ihtilafSayisi: ihtilaflar.filter(i => i.acan_id === id).length
  };
}

/**
 * Profil kartı için kullanıcı sefer/başarı özeti.
 */
export function kullaniciSeferOzeti(seferler, kullaniciId, isKamyoncu) {
  const seferListesi = (seferler || []).filter(s =>
    isKamyoncu ? s.kamyoncu_user_id === kullaniciId : s.olusturan_id === kullaniciId
  );
  const tamamlanan = seferListesi.filter(seferTamamlandiMi).length;
  return {
    seferler: seferListesi,
    tamamlanan,
    basariOrani: seferListesi.length > 0 ? Math.round((tamamlanan / seferListesi.length) * 100) : 0
  };
}

/**
 * Yorum listesinden puan dağılımı + ortalama.
 */
export function yorumDagilimi(yorumListesi = [], varsayilanPuan = 0) {
  const dagilim = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  (yorumListesi || []).forEach(y => {
    if (dagilim[y.puan] !== undefined) dagilim[y.puan]++;
  });

  let ortalama;
  if (yorumListesi && yorumListesi.length > 0) {
    ortalama = yorumListesi.reduce((t, y) => t + Number(y.puan), 0) / yorumListesi.length;
  } else {
    ortalama = Number(varsayilanPuan) || 0;
  }

  return {
    dagilim,
    ortalama,
    oySayisi: yorumListesi?.length || 0
  };
}

/**
 * Gelir raporu (AdminPanel) — ödenen/bekleyen seferler, komisyon, top kamyoncular, aylık ciro.
 */
export function gelirVerisi(seferler = []) {
  const odendiler = seferler.filter(seferTamamlandiMi);
  const bekleyenler = seferler.filter(s => s.durum === "teslima_bekleniyor");

  const toplam = odendiler.reduce((t, s) => t + Number(s.ucret || 0), 0);
  const bekleyenToplam = bekleyenler.reduce((t, s) => t + Number(s.ucret || 0), 0);
  const komisyon = toplam * 0.03;

  const kamyoncuGelir = {};
  odendiler.forEach(s => {
    const ad = s.kamyoncu || "Bilinmeyen";
    kamyoncuGelir[ad] = (kamyoncuGelir[ad] || 0) + Number(s.ucret || 0);
  });
  const topKamyoncular = Object.entries(kamyoncuGelir)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const aylik = {};
  odendiler.forEach(s => {
    const d = s.odeme_tarihi ? new Date(s.odeme_tarihi) : null;
    if (!d || isNaN(d.getTime())) return;
    const anahtar = `${d.getMonth() + 1}.${d.getFullYear()}`;
    aylik[anahtar] = (aylik[anahtar] || 0) + Number(s.ucret || 0);
  });
  const aylikListe = Object.entries(aylik)
    .sort((a, b) => {
      const [ay1, yil1] = a[0].split(".").map(Number);
      const [ay2, yil2] = b[0].split(".").map(Number);
      return (yil2 - yil1) || (ay2 - ay1);
    })
    .slice(0, 6);

  return { odendiler, bekleyenler, toplam, bekleyenToplam, komisyon, topKamyoncular, aylikListe };
}

/**
 * Rol etiketi ("kamyoncu" → "Kamyoncu", "issiz" → "İşveren", "admin" → "Admin").
 */
export function rolEtiketi(rol) {
  const map = { kamyoncu: "Kamyoncu", issiz: "İşveren", admin: "Admin" };
  return map[rol] || "Kamyoncu";
}

/**
 * Rol bul: users satırında bazen `role` bazen `rol` alanı kullanılır.
 */
export function rolBul(kullanici, varsayilan = "kamyoncu") {
  return kullanici?.role || kullanici?.rol || varsayilan;
}
