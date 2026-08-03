const webpush = require('web-push');

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;
const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:destek@nakliyol.com';

let supabaseClient = null;
function getSupabase() {
  if (!supabaseClient) {
    const { createClient } = require('@supabase/supabase-js');
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabaseClient;
}

// RLS sıkılaştırması sonrası push_abonelikleri anon ile okunamaz.
// Önce SECURITY DEFINER RPC'yi dener, fonksiyon henüz yoksa (SQL çalıştırılmadıysa)
// eski doğrudan okuma yoluna düşer — böylece kod, SQL'den önce ve sonra çalışır.
async function abonelikleriGetir(supabase, hedefKullaniciId, hedefRol) {
  // 1) Yeni güvenli yol: RPC (varsa)
  if (hedefKullaniciId || hedefRol) {
    const { data, error } = await supabase.rpc('push_abonelikleri_getir', {
      p_kullanici_id: hedefKullaniciId || null,
      p_rol: hedefRol || null
    });
    if (!error && Array.isArray(data)) {
      return data;
    }
  }

  // 2) Eski yol (SQL çalıştırılmadan önceki durum)
  if (hedefKullaniciId) {
    const { data, error } = await supabase
      .from('push_abonelikleri')
      .select('*')
      .eq('user_id', hedefKullaniciId);
    if (error) throw error;
    return data || [];
  }

  if (hedefRol) {
    // Rol bazlı: önce o rolün kullanıcı ID'lerini bul
    const { data: kullanicilar, error: kullaniciHata } = await supabase
      .from('users')
      .select('id')
      .eq('role', hedefRol);
    if (kullaniciHata) throw kullaniciHata;

    const idler = (kullanicilar || []).map(k => k.id);
    if (idler.length > 0) {
      const { data, error } = await supabase
        .from('push_abonelikleri')
        .select('*')
        .in('user_id', idler);
      if (error) throw error;
      return data || [];
    }
  }

  return [];
}

// Bozuk abonelikleri temizle — RPC yoksa eski doğrudan silme yolunu kullan.
async function abonelikleriSil(supabase, idler) {
  if (!idler || idler.length === 0) return;
  const { error } = await supabase.rpc('push_abonelikleri_sil', { p_idler: idler });
  if (!error) return;
  await supabase.from('push_abonelikleri').delete().in('id', idler).catch(() => {});
}

module.exports = async (req, res) => {
  // Sadece POST kabul et
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Sadece POST kabul edilir' });
  }

  const { hedefKullaniciId, hedefRol, baslik, icerik, url, zorunlu } = req.body || {};

  if (!baslik || !icerik) {
    return res.status(400).json({ ok: false, error: 'baslik ve icerik zorunlu' });
  }

  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    return res.status(500).json({ ok: false, error: 'VAPID anahtarları tanımlı değil' });
  }

  try {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

    const supabase = getSupabase();

    // Hedef kullanıcıya / role göre abonelikleri çek
    const abonelikler = await abonelikleriGetir(supabase, hedefKullaniciId, hedefRol);

    const payload = JSON.stringify({ baslik, icerik, url: url || '/#/app', zorunlu: zorunlu !== false });

    const sonuclar = await Promise.allSettled(
      abonelikler.map(a => {
        const abonelik = {
          endpoint: a.endpoint,
          keys: { p256dh: a.p256dh, auth: a.auth }
        };
        return webpush.sendNotification(abonelik, payload);
      })
    );

    const basarili = sonuclar.filter(s => s.status === 'fulfilled').length;

    // Eski/bozuk abonelikleri temizle
    const silinecekler = [];
    sonuclar.forEach((s, i) => {
      if (s.status === 'rejected' && s.reason && (s.reason.statusCode === 404 || s.reason.statusCode === 410)) {
        silinecekler.push(abonelikler[i].id);
      }
    });
    if (silinecekler.length > 0) {
      await abonelikleriSil(supabase, silinecekler);
    }

    return res.json({ ok: true, gonderilen: basarili, toplam: abonelikler.length, temizlenen: silinecekler.length });
  } catch (err) {
    console.error('Push gönderim hatası:', err);
    return res.status(500).json({ ok: false, error: String(err.message || err) });
  }
};
