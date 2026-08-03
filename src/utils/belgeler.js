// Belge (belgeler tablosu) veri erişimi — AdminPanel ve ProfilKart ortak kullanır.

/**
 * Belgeleri getir.
 * @param {object}  sb   supabase istemcisi
 * @param {object}  [opt]
 * @param {string}  [opt.kullaniciId]  belirli bir kullanıcının belgeleri
 * @param {string}  [opt.rol]          'kamyoncu' | 'issiz'
 * @param {number}  [opt.limit]        satır limiti (varsayılan 200)
 * @returns {Promise<{ data: Array, error: object|null }>}
 */
export async function belgeleriGetir(sb, { kullaniciId, rol, limit = 200 } = {}) {
  if (!sb) return { data: [], error: null };
  try {
    let sorgu = sb.from('belgeler').select('*');
    if (kullaniciId) sorgu = sorgu.eq('kullanici_id', kullaniciId);
    if (rol) sorgu = sorgu.eq('rol', rol);
    return await sorgu.order('olusturulma_tarihi', { ascending: false }).limit(limit);
  } catch (err) {
    console.error('Belgeler yüklenemedi:', err);
    return { data: [], error: err };
  }
}

/**
 * Belgenin onay durumunu güncelle.
 * @returns {Promise<{ data, error }>}
 */
export function belgeOnayla(sb, id, onayliMi) {
  return sb.from('belgeler').update({ onaylandi: onayliMi }).eq('id', id);
}
