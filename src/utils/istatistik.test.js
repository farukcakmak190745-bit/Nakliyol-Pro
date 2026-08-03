import {
  TAMAMLANMIS_DURUMLAR,
  seferTamamlandiMi,
  kullaniciIstatistik,
  kullaniciSeferOzeti,
  yorumDagilimi,
  gelirVerisi,
  rolEtiketi,
  rolBul
} from "./istatistik";

const sefer = (id, durum, ek = {}) => ({ id, durum, ucret: "1000", ...ek });

describe("seferTamamlandiMi", () => {
  it("tamamlanmış durumları tanır", () => {
    TAMAMLANMIS_DURUMLAR.forEach(d => expect(seferTamamlandiMi({ durum: d })).toBe(true));
  });

  it("tamamlanmamış durumları reddeder", () => {
    expect(seferTamamlandiMi({ durum: "yolda" })).toBe(false);
    expect(seferTamamlandiMi({ durum: "bekliyor" })).toBe(false);
  });

  it("null/undefined güvenli", () => {
    expect(seferTamamlandiMi(null)).toBe(false);
    expect(seferTamamlandiMi(undefined)).toBe(false);
  });
});

describe("kullaniciIstatistik", () => {
  const ilanlar = [
    { id: "i1", olusturan_id: "u1" },
    { id: "i2", olusturan_id: "u2" }
  ];
  const seferler = [
    sefer("s1", "odendi", { kamyoncu_user_id: "u1", olusturan_id: "u2" }),
    sefer("s2", "yolda", { kamyoncu_user_id: "u1", olusturan_id: "u3" }),
    sefer("s3", "tamamlandı", { olusturan_id: "u1" })
  ];
  const ihtilaflar = [{ id: "k1", acan_id: "u1" }];

  it("kullanıcı özetini doğru hesaplar", () => {
    const sonuc = kullaniciIstatistik({ id: "u1" }, { ilanlar, seferler, ihtilaflar });
    expect(sonuc.ilanSayisi).toBe(1);
    expect(sonuc.seferSayisi).toBe(3); // s1, s2 (kamyoncu) + s3 (işveren)
    expect(sonuc.tamamlanan).toBe(2); // s1 odendi + s3 tamamlandı
    expect(sonuc.ihtilafSayisi).toBe(1);
  });

  it("id'siz kullanıcı için sıfır döner", () => {
    const sonuc = kullaniciIstatistik({}, { ilanlar, seferler, ihtilaflar });
    expect(sonuc).toEqual({ ilanSayisi: 0, seferSayisi: 0, tamamlanan: 0, ihtilafSayisi: 0 });
  });
});

describe("kullaniciSeferOzeti", () => {
  const seferler = [
    sefer("s1", "odendi", { kamyoncu_user_id: "u1" }),
    sefer("s2", "yolda", { kamyoncu_user_id: "u1" }),
    sefer("s3", "tamamlandi", { kamyoncu_user_id: "u1" })
  ];

  it("kamyoncu için sefer/basari oranı hesaplar", () => {
    const sonuc = kullaniciSeferOzeti(seferler, "u1", true);
    expect(sonuc.seferler).toHaveLength(3);
    expect(sonuc.tamamlanan).toBe(2);
    expect(sonuc.basariOrani).toBe(67);
  });

  it("boş sefer listesinde oran 0", () => {
    const sonuc = kullaniciSeferOzeti([], "u1", true);
    expect(sonuc.basariOrani).toBe(0);
  });
});

describe("yorumDagilimi", () => {
  const yorumlar = [
    { puan: 5 }, { puan: 5 }, { puan: 4 }, { puan: 3 }
  ];

  it("dağılım, ortalama ve oy sayısını verir", () => {
    const sonuc = yorumDagilimi(yorumlar);
    expect(sonuc.dagilim[5]).toBe(2);
    expect(sonuc.dagilim[4]).toBe(1);
    expect(sonuc.dagilim[3]).toBe(1);
    expect(sonuc.dagilim[1]).toBe(0);
    expect(sonuc.ortalama).toBeCloseTo(4.25);
    expect(sonuc.oySayisi).toBe(4);
  });

  it("yorum yokken varsayılan puanı kullanır", () => {
    const sonuc = yorumDagilimi([], 4.5);
    expect(sonuc.ortalama).toBe(4.5);
    expect(sonuc.oySayisi).toBe(0);
    expect(Object.values(sonuc.dagilim).every(v => v === 0)).toBe(true);
  });
});

describe("gelirVerisi", () => {
  const seferler = [
    sefer("s1", "odendi", { kamyoncu: "Ahmet", odeme_tarihi: "2026-05-10" }),
    sefer("s2", "tamamlandi", { kamyoncu: "Mehmet", odeme_tarihi: "2026-05-20" }),
    sefer("s3", "tamamlandı", { kamyoncu: "Ahmet", odeme_tarihi: "2026-04-01" }),
    sefer("s4", "teslima_bekleniyor", { kamyoncu: "Veli" })
  ];

  it("toplam, komisyon, bekleyen ve kamyoncu sıralamasını verir", () => {
    const sonuc = gelirVerisi(seferler);
    expect(sonuc.odendiler).toHaveLength(3);
    expect(sonuc.bekleyenler).toHaveLength(1);
    expect(sonuc.toplam).toBe(3000);
    expect(sonuc.bekleyenToplam).toBe(1000);
    expect(sonuc.komisyon).toBe(90);
    expect(sonuc.topKamyoncular[0]).toEqual(["Ahmet", 2000]);
    expect(sonuc.aylikListe[0][0]).toBe("5.2026");
  });
});

describe("rolEtiketi / rolBul", () => {
  it("rol etiketini döndürür", () => {
    expect(rolEtiketi("kamyoncu")).toBe("Kamyoncu");
    expect(rolEtiketi("issiz")).toBe("İşveren");
    expect(rolEtiketi("admin")).toBe("Admin");
    expect(rolEtiketi("bilinmeyen")).toBe("Kamyoncu");
  });

  it("role/rol alanını ayırt eder", () => {
    expect(rolBul({ role: "issiz" })).toBe("issiz");
    expect(rolBul({ rol: "admin" })).toBe("admin");
    expect(rolBul({ role: "issiz", rol: "admin" })).toBe("issiz");
    expect(rolBul({})).toBe("kamyoncu");
  });
});
