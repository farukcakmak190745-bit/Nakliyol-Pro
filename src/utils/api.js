// ============================================================
// NakliYol Pro — Supabase veri katmanı (saf fonksiyonlar)
// ============================================================
// React state'inden bağımsız tüm DB erişimleri burada toplanır.
// Böylece AppContext yalnızca state orkestrasyonu yapar ve bu
// fonksiyonlar sahte (mock) supabase ile birim test edilebilir.
// Her fonksiyon `sb` (supabase istemcisi) parametresi alır.

// ---------- Kullanıcılar ----------
export const kullanicilariGetir = (sb) => sb.from('users').select('*');

export const kullaniciGetir = (sb, id) =>
  sb.from('users').select('*').eq('id', id).maybeSingle();

export const kullaniciTelefonlaGetir = (sb, telefon) =>
  sb.from('users').select('*').eq('telefon', telefon).maybeSingle();

export const kullaniciEmailleGetir = (sb, email) =>
  sb.from('users').select('*').eq('email', email).maybeSingle();

export const kullaniciKaydet = (sb, veri) =>
  sb.from('users').insert([veri]).select().single();

export const kullaniciGuncelle = (sb, id, veri) =>
  sb.from('users').update(veri).eq('id', id);

export const kullaniciSil = (sb, id) => sb.from('users').delete().eq('id', id);

// ---------- İlanlar ----------
export const ilanlariGetir = (sb, limit = 50) =>
  sb.from('ilanlar').select('*').order('tarih', { ascending: false }).limit(limit);

export const ilanEkle = (sb, ilan) => sb.from('ilanlar').insert([ilan]).select().single();

export const ilanSoftSil = (sb, id) =>
  sb.from('ilanlar').update({ durum: 'silindi' }).eq('id', id);

export const ilanDurumuGuncelle = (sb, id, durum) =>
  sb.from('ilanlar').update({ durum }).eq('id', id);

// ---------- Seferler ----------
export const seferleriGetir = (sb, limit = 50) =>
  sb.from('seferler').select('*').order('tarih', { ascending: false }).limit(limit);

export const seferEkle = (sb, sefer) => sb.from('seferler').insert([sefer]);

export const seferGuncelle = (sb, id, veri) =>
  sb.from('seferler').update(veri).eq('id', id);

// ---------- Teklifler ----------
export const teklifleriGetir = (sb) => sb.from('teklifler').select('*');

export const teklifEkle = (sb, veri) =>
  sb.from('teklifler').insert([veri]).select().single();

export const teklifGuncelle = (sb, id, durum) =>
  sb.from('teklifler').update({ durum }).eq('id', id);

// ---------- Bildirimler ----------
export const bildirimEkle = (sb, veri) => sb.from('bildirimler').insert(veri);

export const bildirimleriGetir = (sb, kullaniciId, limit = 100) =>
  sb.from('bildirimler')
    .select('*')
    .eq('kullanici_id', kullaniciId)
    .order('olusturma_zamani', { ascending: false })
    .limit(limit);

export const bildirimOkundu = (sb, id) =>
  sb.from('bildirimler').update({ okundu: true }).eq('id', id);

export const tumBildirimleriOkundu = (sb, kullaniciId) =>
  sb.from('bildirimler')
    .update({ okundu: true })
    .eq('kullanici_id', kullaniciId)
    .is('okundu', false);

// ---------- İhtilaflar ----------
export const ihtilaflariGetir = (sb) =>
  sb.from('ihtilaflar').select('*').order('olusturma_zamani', { ascending: false });

export const ihtilafEkle = (sb, veri) => sb.from('ihtilaflar').insert([veri]);

export const ihtilafGuncelle = (sb, id, veri) =>
  sb.from('ihtilaflar').update(veri).eq('id', id);

export const ihtilaflariKapat = (sb, seferId) =>
  sb.from('ihtilaflar')
    .update({ durum: "cozuldu", admin_notu: "Ödeme onaylandı" })
    .eq('sefer_id', seferId)
    .eq('durum', 'acik');

// ---------- Kamyoncu iptal takibi ----------
export const kamyoncuIptalEkle = (sb, veri) => sb.from('kamyoncu_iptaller').insert(veri);

export const son24SaatIptalleri = (sb, kullaniciId, sonZamanISO) =>
  sb.from('kamyoncu_iptaller')
    .select('id')
    .eq('kullanici_id', kullaniciId)
    .gte('zaman', sonZamanISO);

// ---------- Profil fotoğrafları ----------
export const profilFotograflariGetir = (sb) =>
  sb.from('belgeler')
    .select('kullanici_id, url')
    .eq('dosya_adi', 'profil_fotografi')
    .order('olusturulma_tarihi', { ascending: false });

// ---------- Değerlendirme ----------
export const benimDegerlendirmelerimGetir = (sb, kullaniciId) =>
  sb.from('degerlendirmeler')
    .select('id, sefer_id, hedef_kullanici_id, puan')
    .eq('degerlendiren_id', kullaniciId);

export const degerlendirmeleriGetir = (sb, hedefId) =>
  sb.from('degerlendirmeler')
    .select('id, puan, yorum, olusturma_zamani, degerlendiren_id, hedef_kullanici_id')
    .eq('hedef_kullanici_id', hedefId)
    .order('olusturma_zamani', { ascending: false })
    .limit(50);

export const degerlendirmeGonder = (sb, { hedefId, seferId, puan, yorum }) =>
  sb.rpc('degerlendirme_ekle', {
    p_hedef: hedefId,
    p_sefer: seferId,
    p_puan: puan,
    p_yorum: yorum || null
  });

// ---------- Anti-spam ----------
/**
 * Kullanıcının son p_dakika içinde yaptığı işlem sayısı limitte mi?
 * @returns {Promise<boolean>} true ise istek engellenmelidir
 */
export async function hizSiniriAsildiMi(sb, { tablo, sutun, deger, dakika = 60, limit = 10 }) {
  if (!sb || !deger) return false;
  try {
    const { data, error } = await sb.rpc('hiz_siniri_asildi_mi', {
      p_tablo: tablo,
      p_sutun: sutun,
      p_deger: deger,
      p_dakika: dakika,
      p_limit: limit
    });
    if (error || data === null || data === undefined) return false;
    return data === true;
  } catch (e) {
    console.warn('Hız sınırı kontrolü yapılamadı:', e?.message || e);
    return false;
  }
}
