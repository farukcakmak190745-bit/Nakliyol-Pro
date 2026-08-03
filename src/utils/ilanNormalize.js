// İlan verisi normalize etme — snake_case DB satırından camelCase UI nesnesine.
// AppContext içinde 3 farklı yerde tekrarlanan bu dönüşüm tek yerde toplandı.

const ILAN_ALANLARI = {
  aracTip: "arac_tip",
  odemeTuru: "odeme_turu",
  odemeGun: "odeme_gun",
  kdvOrani: "kdv_orani",
  kdvTutari: "kdv_tutari",
  toplamUcret: "toplam_ucret",
  yuklemeKonum: "yukleme_konum",
  bosaltmaKonum: "bosaltma_konum",
  yuklemeSaatBas: "yukleme_saat_bas",
  yuklemeSaatBit: "yukleme_saat_bit",
  bosaltmaSaatBas: "bosaltma_saat_bas",
  bosaltmaSaatBit: "bosaltma_saat_bit",
  faturaBaslik: "fatura_baslik"
};

export const ILAN_VARSAYILANLAR = {
  aciklama: "",
  yuklemeKonum: "",
  bosaltmaKonum: "",
  yuklemeSaatBas: "",
  yuklemeSaatBit: "",
  bosaltmaSaatBas: "",
  bosaltmaSaatBit: "",
  faturaBaslik: "",
  faturaDosya: null
};

/**
 * Tek bir ilanı UI formatına çevirir.
 * @param {object} ilan  Supabase'den gelen ham ilan satırı
 * @param {object} [opsiyonlar]
 * @param {Array}  [opsiyonlar.usersData]  ilan sahibi kullanıcı bilgisi için
 * @param {object} [opsiyonlar.fotoMap]    kullanici_id → profil foto URL
 * @returns {object} camelCase alanlar eklenmiş ilan
 */
export function ilanNormalize(ilan, { usersData, fotoMap } = {}) {
  if (!ilan) return ilan;
  const out = { ...ilan };

  Object.entries(ILAN_ALANLARI).forEach(([ui, db]) => {
    out[ui] = ilan[db];
  });

  Object.entries(ILAN_VARSAYILANLAR).forEach(([key, deger]) => {
    if (out[key] === undefined || out[key] === null) out[key] = deger;
  });

  const olusturanUser = usersData
    ? usersData.find(u => u.id === ilan.olusturan_id || u.email === ilan.olusturan)
    : null;

  if (olusturanUser) {
    out.firmaAdi = olusturanUser.firma_adi || null;
    out.telefon = olusturanUser.telefon || null;
    out.olusturanPuan = olusturanUser.puan ?? ilan.olusturanPuan ?? 5.0;
    out.olusturanOySayisi = olusturanUser.oy_sayisi ?? 0;
  } else {
    out.olusturanPuan = ilan.olusturanPuan ?? 5.0;
    out.olusturanOySayisi = ilan.olusturanOySayisi ?? 0;
  }

  if (fotoMap) {
    out.profilFoto = olusturanUser?.fotograf || fotoMap[String(ilan.olusturan_id)] || null;
  }

  return out;
}

/**
 * Birden fazla ilanı toplu normalize eder.
 */
export function ilanListesiNormalize(ilanlar, { usersData, fotoMap } = {}) {
  return (ilanlar || []).map(ilan => ilanNormalize(ilan, { usersData, fotoMap }));
}
