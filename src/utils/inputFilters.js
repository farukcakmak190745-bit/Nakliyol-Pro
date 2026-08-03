// Form giriş filtreleri — yönetmeliğe uygun girdi kısıtlamaları
// Sadece harf (Türkçe karakterler, boşluk, . ' -)
export const harfFiltre = (deger, max = 100) =>
  String(deger).replace(/[^A-Za-zÇĞİÖŞÜçğıöşü\s.'\-]/g, "").slice(0, max);

// Sadece rakam
export const rakamFiltre = (deger, max = 20) =>
  String(deger).replace(/\D/g, "").slice(0, max);

// Plaka: harf + rakam + boşluk, büyük harf
export const plakaFiltre = (deger) =>
  String(deger).replace(/[^A-Za-z0-9\s]/g, "").toUpperCase().slice(0, 12);

// Alfa-numerik büyük harf (IBAN gibi)
export const alfanumerikUstFiltre = (deger, max = 50) =>
  String(deger).replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, max);

// Serbest metin: zararlı/tehlikeli karakterleri engelle
export const serbestFiltre = (deger, max = 200) =>
  String(deger).replace(/[<>{}|\\^`]/g, "").slice(0, max);

// Yük adı: harf + rakam + boşluk + nokta + kısa çizgi + eğik çizgi
export const yukFiltre = (deger, max = 80) =>
  String(deger).replace(/[^A-Za-z0-9ÇĞİÖŞÜçğıöşü\s.\-/,%]/g, "").slice(0, max);

// Adres: harf + rakam + yaygın adres karakterleri
export const adresFiltre = (deger, max = 200) =>
  String(deger).replace(/[^A-Za-z0-9ÇĞİÖŞÜçğıöşü\s.,/\\+#-]/g, "").slice(0, max);
