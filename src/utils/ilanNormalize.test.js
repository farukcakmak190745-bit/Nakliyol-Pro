import { ilanNormalize, ilanListesiNormalize, ILAN_VARSAYILANLAR } from "./ilanNormalize";

describe("ilanNormalize", () => {
  it("snake_case alanları camelCase'e çevirir", () => {
    const ham = {
      id: "i1",
      yuk: "Çelik",
      arac_tip: "tir",
      odeme_turu: "vadeli",
      odeme_gun: 7,
      kdv_orani: 1,
      kdv_tutari: 0,
      toplam_ucret: 1000,
      yukleme_konum: "Ankara",
      bosaltma_konum: "İzmir",
      yukleme_saat_bas: "08:00",
      yukleme_saat_bit: "12:00",
      bosaltma_saat_bas: "14:00",
      bosaltma_saat_bit: "18:00",
      fatura_baslik: "Fatura",
      fatura_dosya: null
    };

    const sonuc = ilanNormalize(ham);

    expect(sonuc.aracTip).toBe("tir");
    expect(sonuc.odemeTuru).toBe("vadeli");
    expect(sonuc.odemeGun).toBe(7);
    expect(sonuc.kdvOrani).toBe(1);
    expect(sonuc.kdvTutari).toBe(0);
    expect(sonuc.toplamUcret).toBe(1000);
    expect(sonuc.yuklemeKonum).toBe("Ankara");
    expect(sonuc.bosaltmaKonum).toBe("İzmir");
    expect(sonuc.yuklemeSaatBas).toBe("08:00");
    expect(sonuc.faturaBaslik).toBe("Fatura");
    expect(sonuc.faturaDosya).toBeNull();
  });

  it("eksik opsiyonel alanlara varsayılan değerler ekler", () => {
    const ham = { id: "i2", yuk: "Demir", nereden: "X", nereye: "Y" };
    const sonuc = ilanNormalize(ham);

    Object.entries(ILAN_VARSAYILANLAR).forEach(([key, deger]) => {
      expect(sonuc[key]).toBe(deger);
    });
  });

  it("usersData ile ilan sahibi bilgilerini zenginleştirir", () => {
    const ham = {
      id: "i3",
      olusturan_id: "u1",
      olusturan: "Firma A",
      olusturanPuan: 4.0,
      olusturanOySayisi: 1
    };
    const usersData = [{ id: "u1", firma_adi: "Firma A", telefon: "0555", puan: 4.8, oy_sayisi: 12 }];

    const sonuc = ilanNormalize(ham, { usersData });

    expect(sonuc.firmaAdi).toBe("Firma A");
    expect(sonuc.telefon).toBe("0555");
    expect(sonuc.olusturanPuan).toBe(4.8);
    expect(sonuc.olusturanOySayisi).toBe(12);
  });

  it("usersData yokken oturum puanını korur", () => {
    const ham = { id: "i4", olusturanPuan: 4.2, olusturanOySayisi: 3 };
    const sonuc = ilanNormalize(ham);
    expect(sonuc.olusturanPuan).toBe(4.2);
    expect(sonuc.olusturanOySayisi).toBe(3);
  });

  it("profilFoto için fotoMap kullanır", () => {
    const ham = { id: "i5", olusturan_id: "u9" };
    const sonuc = ilanNormalize(ham, { fotoMap: { u9: "https://foto" } });
    expect(sonuc.profilFoto).toBe("https://foto");
  });

  it("null/undefined ilanı aynen döner", () => {
    expect(ilanNormalize(null)).toBeNull();
    expect(ilanNormalize(undefined)).toBeUndefined();
  });
});

describe("ilanListesiNormalize", () => {
  it("boş listeyi güvenle işler", () => {
    expect(ilanListesiNormalize(null)).toEqual([]);
    expect(ilanListesiNormalize([])).toEqual([]);
  });

  it("tüm ilanları normalize eder", () => {
    const liste = [
      { id: "a", arac_tip: "kamyonet" },
      { id: "b", arac_tip: "tir" }
    ];
    const sonuc = ilanListesiNormalize(liste);
    expect(sonuc).toHaveLength(2);
    expect(sonuc[0].aracTip).toBe("kamyonet");
    expect(sonuc[1].aracTip).toBe("tir");
  });
});
