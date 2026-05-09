import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useMesaj } from "./MesajContext";

let supabaseInitialized = false;
const initSupabase = () => {
  if (!supabaseInitialized && supabase) {
    console.log("🔥 Supabase Backend Connected");
    supabaseInitialized = true;
  }
};

const Ctx = createContext();

const DEMO_ILANLAR = [
  { id: 1, yuk: "Kömür", nereden: "Antalya", nereye: "İzmir", ucret: 7083, sure: "~7 saat", tarih: "2026-05-06", aracTip: "TIR", aciklama: "Antalya Liman'dan İzmir OSB'ye kömür. Sabah 08:00 yükleme.", istekSayisi: 2, durum: "aktif", olusturan: "Mevlüt Taşımacılık A.Ş.", olusturanPuan: 4.8, belgeler: [], odemeTuru: "pesin", odemeGun: 0, kdvOrani: 0.20 },
  { id: 2, yuk: "Çelik Boru", nereden: "Ankara", nereye: "Bursa", ucret: 5167, sure: "~5 saat", tarih: "2026-05-07", aracTip: "10 Teker Açık", aciklama: "Flatbed veya lowbed TIR gerekli. Vinçli yükleme yapılacak.", istekSayisi: 1, durum: "aktif", olusturan: "Kardeşler Çelik Ltd.", olusturanPuan: 4.6, belgeler: [], odemeTuru: "7-gun", odemeGun: 7, kdvOrani: 0.20 },
  { id: 3, yuk: "Soğutmalı Gıda", nereden: "İstanbul", nereye: "Gaziantep", ucret: 9167, sure: "~12 saat", tarih: "2026-05-08", aracTip: "10 Teker Tenteli", aciklama: "+4°C soğutmalı araç zorunlu. ATP belgeli kamyon şart. Gece vardiyası.", istekSayisi: 3, durum: "aktif", olusturan: "Metro Gıda Lojistik", olusturanPuan: 4.9, belgeler: [], odemeTuru: "15-gun", odemeGun: 15, kdvOrani: 0.20 },
  { id: 4, yuk: "Meyve (Portakal)", nereden: "Mersin", nereye: "Ankara", ucret: 6500, sure: "~6 saat", tarih: "2026-05-09", aracTip: "Kırkayak Açık", aciklama: "Portakal yükü. Havalandırmalı araç tercih edilir. Erken sabah yükleme.", istekSayisi: 0, durum: "aktif", olusturan: "Akdeniz Tarım A.Ş.", olusturanPuan: 4.7, belgeler: [], odemeTuru: "pesin", odemeGun: 0, kdvOrani: 0 },
  { id: 5, yuk: "İnşaat Malzemesi", nereden: "Kocaeli", nereye: "Konya", ucret: 7667, sure: "~4 saat", tarih: "2026-05-10", aracTip: "10 Teker Tenteli", aciklama: "Çakıl ve kum karışık yük. Damperli araç şart. Hafta içi her gün.", istekSayisi: 1, durum: "aktif", olusturan: "Anadolu İnşaat", olusturanPuan: 4.5, belgeler: [], odemeTuru: "30-gun", odemeGun: 30, kdvOrani: 0.20 },
  { id: 6, yuk: "Elektronik Eşya", nereden: "İzmir", nereye: "İstanbul", ucret: 4583, sure: "~6 saat", tarih: "2026-05-11", aracTip: "50 NC Kamyon", aciklama: "Hassas elektronik ürünler. Sarsıntısız taşıma şart. Sigorta zorunlu.", istekSayisi: 0, durum: "aktif", olusturan: "Ege Elektronik", olusturanPuan: 4.3, belgeler: [], odemeTuru: "pesin", odemeGun: 0, kdvOrani: 0.20 },
  { id: 7, yuk: "Tekstil", nereden: "Bursa", nereye: "İstanbul", ucret: 3500, sure: "~3 saat", tarih: "2026-05-12", aracTip: "Kamyonet", aciklama: "Hazır giyim malı. Su geçirmez kaplama tercih edilir.", istekSayisi: 0, durum: "aktif", olusturan: "Bursa Tekstil A.Ş.", olusturanPuan: 4.6, belgeler: [], odemeTuru: "7-gun", odemeGun: 7, kdvOrani: 0 },
];

const DEMO_SEFERLER = [
  { id: 1, yuk: "Kömür Nakliyesi", nereden: "Antalya", nereye: "İzmir", ucret: 8200, tarih: "2026-04-28", plaka: "34 TYK 421", kamyoncu: "Mehmet Yılmaz", olusturan: "Mevlüt Taşımacılık A.Ş.", durum: "tamamlandı", teslimTarihi: "2026-04-28", belgeler: [{ ad: "İrsaliye.pdf", tip: "pdf", yuklenen: "Mehmet" }, { ad: "Makbuz.png", tip: "img", yuklenen: "Mehmet" }], odemeTarihi: null, odemeDurumu: "beklemede", iban: "TR 0000 0000 0000 0000 0000 00", ibanSahibi: "Mevlüt Taşımacılık A.Ş." },
  { id: 2, yuk: "Çelik Boru", nereden: "Ankara", nereye: "Bursa", ucret: 6100, tarih: "2026-04-22", plaka: "06 ALK 99", kamyoncu: "Ali Kaya", olusturan: "Kardeşler Çelik Ltd.", durum: "tamamlandı", teslimTarihi: "2026-04-22", belgeler: [{ ad: "CMR.pdf", tip: "pdf", yuklenen: "Ali" }], odemeTarihi: null, odemeDurumu: "beklemede", iban: "TR 0000 0000 0000 0000 0000 00", ibanSahibi: "Kardeşler Çelik Ltd." },
  { id: 3, yuk: "Soğutmalı Gıda", nereden: "İstanbul", nereye: "Gaziantep", ucret: 10500, tarih: "2026-04-15", plaka: "34 HSN 07", kamyoncu: "Hasan Tekin", olusturan: "Metro Gıda Lojistik", durum: "yolda", teslimTarihi: null, belgeler: [], odemeTarihi: null, odemeDurumu: "beklemede", iban: "", ibanSahibi: "" },
];

export const AppProvider = ({ children }) => {
  const mesajContext = useMesaj();

  useEffect(() => {
    initSupabase();
  }, []);

  // Realtime subscriptions
  useEffect(() => {
    if (supabase) {
      subscribeToIlanlar();
      subscribeToSeferler();
      subscribeToTeklifler();
      subscribeToConversations();
    }
  }, [supabase]);

  const [oturum, setOturum] = useState(null);
  const [kullanicilar, setKullanicilar] = useState([]);
  const [ilanlar, setIlanlar] = useState(DEMO_ILANLAR);
  const [seferler, setSeferler] = useState(DEMO_SEFERLER);
  const [teklifler, setTeklifler] = useState([]);

  const [bildirimler, setBildirimler] = useState({
    ilan: true,
    teklif: true,
    mesaj: true,
    sefer: true
  });

  const [kamyoncuBasvuru, setKamyoncuBasvuru] = useState(null);
  const [seferOnayDurumu, setSeferOnayDurumu] = useState(() => ({}));
  const [konusmalar, setKonusmalar] = useState([]);

  const kayitOl = useCallback(async (bilgiler) => {
    if (!supabase) {
      console.warn("⚠️ Supabase kurulumu yapılmadı. Demo modu aktif.");
      const yeniKullanici = { ...bilgiler, id: Date.now(), kayitTarihi: new Date().toISOString().split("T")[0], puan: 0, durum: "aktif" };
      setKullanicilar(prev => [...prev, yeniKullanici]);
      setOturum(yeniKullanici);
      return yeniKullanici;
    }

    try {
      // Create email from phone for demo compatibility
      const email = bilgiler.email || `${bilgiler.telefon}@demo.com`;

      const { data, error } = await supabase.from('users').insert([{
        email: email,
        role: bilgiler.rol || "issiz",
        ad: bilgiler.ad,
        tc_kimlik: bilgiler.tcKimlik,
        telefon: bilgiler.telefon
      }]).select().single();

      if (error) throw error;

      await supabase.from('user_roles').insert([{
        user_id: data.id
      }]);

      setOturum(data);
      return data;
    } catch (error) {
      console.error("Kayıt hatası:", error);
      throw error;
    }
  }, [supabase]);

  const girisYap = useCallback(async (telefon, password) => {
    if (!supabase) {
      setOturum({ id: Date.now(), email: telefon + '@demo.com', ad: telefon.split('@')[0], role: 'issiz' });
      return;
    }

    try {
      // Önce telefon numarasına göre kullanıcıyı bul
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('telefon', telefon)
        .single();

      if (userError) throw userError;

      const email = userData.email;

      // Supabase Auth ile giriş yap
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      setOturum(userData);
      return userData;
    } catch (error) {
      console.error("Giriş hatası:", error);
      throw error;
    }
  }, []);

  const cikisYap = useCallback(async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setOturum(null);
    }, [supabase]);

  const girisYapDemo = useCallback((rol, ad) => {
    const rolLower = rol?.toLowerCase();
    const adStr = typeof ad === 'string' ? ad : "Demo Kullanıcı";
    const demoKullanici = {
      id: Date.now(),
      email: `${rolLower}@demo.com`,
      ad: adStr,
      role: rolLower === 'kamyoncu' ? 'kamyoncu' : (rolLower === 'issiz' ? 'issiz' : 'issiz'),
      telefon: "5555555555"
    };
    setOturum(demoKullanici);
    return demoKullanici;
  }, []);

  const ilanEkle = useCallback(async (yeni) => {
    const kdvOrani = yeni.ucretTipi === "kdv" ? 0.20 : 0;
    const kdvTutari = yeni.ucret * kdvOrani;
    const toplamUcret = yeni.ucret + kdvTutari;

    const ilan = {
      yuk: yeni.yuk,
      nereden: yeni.nereden,
      nereye: yeni.nereye,
      ucret: yeni.ucret,
      tarih: yeni.tarih || new Date().toISOString().split("T")[0],
      sure: yeni.sure,
      ton: yeni.ton || 0,
      arac_tip: yeni.aracTip,
      odeme_turu: yeni.odemeTuru || "pesin",
      odeme_gun: yeni.odemeGun || 0,
      kdv_orani: kdvOrani,
      kdv_tutari: kdvTutari,
      toplam_ucret: toplamUcret,
      durum: "aktif",
      istek_sayisi: 0,
      belgeler: [],
      iban: oturum?.iban || "",
      iban_sahibi: typeof oturum?.ad === 'string' ? oturum.ad : oturum?.firmaAdi || "Demo Firma",
      olusturan_id: oturum?.id,
      olusturan: typeof oturum?.ad === 'string' ? oturum.ad : oturum?.firmaAdi || "Demo Firma",
    };

    console.log("🔄 İlan oluşturuluyor:", ilan);

    if (!supabase) {
      console.warn("⚠️ Supabase yok. Demo modu.");
      setIlanlar(prev => [ilan, ...prev]);
      return ilan;
    }

    try {
      const { data, error } = await supabase.from('ilanlar').insert([ilan]).select().single();

      if (error) throw error;

      console.log("✅ İlan Supabase'e kaydedildi:", ilan.yuk);
      // Normalize data for display
      const normalizedData = {
        ...data,
        toplamUcret: data.toplam_ucret,
        kdvOrani: data.kdv_orani,
        kdvTutari: data.kdv_tutari,
        aracTip: data.arac_tip,
        odemeTuru: data.odeme_turu,
        odemeGun: data.odeme_gun,
        olusturanPuan: data.olusturan?.puan || 5.0
      };
      setIlanlar(prev => [normalizedData, ...prev]);
      return normalizedData;
    } catch (error) {
      console.error("❌ İlan kaydedilemedi:", error);
      throw error;
    }
  }, [oturum, supabase]);

  const ilanSil = useCallback(async (id) => {
    if (supabase) {
      await supabase.from('ilanlar').delete().eq('id', id);
    }
    setIlanlar(prev => prev.filter(i => i.id !== id));
  }, [supabase]);

  const ilanAl = useCallback(async (ilanId, kamyoncu) => {
    const ilan = ilanlar.find(i => i.id === ilanId);

    if (!ilan) return;

    if (supabase) {
      await supabase.from('ilanlar').update({ durum: "alindi" }).eq('id', ilanId);
    }

    setIlanlar(prev => prev.map(i => {
      if (i.id === ilanId) return { ...i, durum: "alindi" };
      return i;
    }));

    const secilenTonaj = kamyoncu?.secilenTonaj || ilan.ton;
    const ton = secilenTonaj === "serbest" ? 0 : parseInt(secilenTonaj);

    const yeniSefer = {
      yuk: ilan.yuk,
      nereden: ilan.nereden,
      nereye: ilan.nereye,
      ucret: ilan.ucret,
      tarih: ilan.tarih,
      sure: ilan.sure,
      ton: ton,
      arac_tip: ilan.arac_tip,
      ilan_id: ilanId,
      plaka: kamyoncu?.plaka || "Belirtilmedi",
      dorse_plaka: kamyoncu?.dorsePlaka || "",
      kamyoncu: kamyoncu?.ad || kamyoncu || "",
      kamyoncu_tel: kamyoncu?.tel || "",
      kamyoncu_tc: kamyoncu?.tcKimlik || "",
      olusturan: ilan.olusturan,
      olusturan_id: ilan.olusturan_id,
      durum: "yolda",
      teslim_tarihi: null,
      belgeler: [],
      odeme_tarihi: null,
      odeme_durumu: "beklemede",
      odeme_turu: ilan.odeme_turu,
      odeme_gun: ilan.odeme_gun,
      iban: ilan.iban || "",
      iban_sahibi: ilan.iban_sahibi || "",
    };

    if (supabase) {
      const { error } = await supabase.from('seferler').insert([yeniSefer]);
      if (error) console.error("Sefer ekleme hatası:", error);
    }

    setSeferler(prev => [yeniSefer, ...prev]);

    const partnerAd = ilan.olusturan;
    const baslik = `${ilan.yuk} - ${ilan.nereden} → ${ilan.nereye}`;

    mesajContext.konusmaAc({
      partnerId: ilanId,
      partnerAd,
      partnerRol: "issiz",
      isTrucker: true,
      baslik,
      konusmaTuru: "is",
      resim: "https://api.dicebear.com/7.x/initials/svg?seed=" + partnerAd.substring(0, 2).toUpperCase(),
      bg: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
    });
  }, [ilanlar, mesajContext, supabase]);

  const teklifEkle = useCallback(async (ilanId, teklifVerisi) => {
    if (!supabase) {
      const yeniTeklif = {
        id: Date.now(),
        ilanId,
        ...teklifVerisi,
        durum: "bekliyor",
        olusturma_zamani: new Date().toISOString().split("T")[0]
      };
      setTeklifler(prev => [...prev, yeniTeklif]);
      return yeniTeklif;
    }

    try {
      const { data, error } = await supabase.from('teklifler').insert([{
        ilan_id: ilanId,
        teklif_sahibi_id: oturum?.id,
        tutar: teklifVerisi.tutar,
        ozellikler: teklifVerisi.ozellikler || {},
        durum: "bekliyor"
      }]).select().single();

      if (error) throw error;

      setTeklifler(prev => [...prev, data]);
      return data;
    } catch (error) {
      console.error("Teklif ekleme hatası:", error);
      throw error;
    }
  }, [oturum, supabase]);

  const teklifGuncelle = useCallback(async (teklifId, durum) => {
    if (supabase) {
      await supabase.from('teklifler').update({ durum }).eq('id', teklifId);
    }
    setTeklifler(prev => prev.map(t =>
      t.id === teklifId ? { ...t, durum } : t
    ));
  }, [supabase]);

  const belgeEkle = useCallback((seferId, belge) => {
    setSeferler(prev => prev.map(s => {
      if (s.id === seferId) {
        return {
          ...s,
          durum: "teslima_bekleniyor",
          belgeler: [...s.belgeler, { ...belge, yuklenen: typeof oturum?.ad === 'string' ? oturum.ad : oturum?.firmaAdi || "Kullanıcı" }]
        };
      }
      return s;
    }));
  }, [oturum]);

  const odemeYap = useCallback(async (seferId) => {
    const sefer = seferler.find(s => s.id === seferId);
    if (sefer && sefer.odemeDurumu === "beklemede") {
      const odemeTarihi = new Date().toISOString().split("T")[0];
      setSeferler(prev => prev.map(s => {
        if (s.id === seferId) {
          return { ...s, odemeTarihi, odemeDurumu: "odendi" };
        }
        return s;
      }));

      if (supabase) {
        await supabase.from('seferler').update({ odeme_tarihi: odemeTarihi, odeme_durumu: "odendi" }).eq('id', seferId);
      }
    }
  }, [seferler, supabase]);

  const odemeGunleriniKabulEt = useCallback(async (seferId) => {
    setSeferler(prev => prev.map(s => {
      if (s.id === seferId) {
        const teslimTarihi = new Date(s.tarih);
        teslimTarihi.setDate(teslimTarihi.getDate() + (s.odemeGun || 0));
        return {
          ...s,
          teslim_tarihi: teslimTarihi.toISOString().split("T")[0],
          durum: "teslima_bekleniyor"
        };
      }
      return s;
    }));

    if (supabase) {
      const sefer = seferler.find(s => s.id === seferId);
      if (sefer) {
        await supabase.from('seferler').update({
          teslim_tarihi: new Date().toISOString().split("T")[0],
          durum: "teslima_bekleniyor"
        }).eq('id', seferId);
      }
    }
  }, [seferler, supabase]);

  const islemiTeslimEt = useCallback(async (seferId) => {
    setSeferler(prev => prev.map(s => {
      if (s.id === seferId) {
        return {
          ...s,
          durum: "teslima_bekleniyor",
          teslim_tarihi: new Date().toISOString().split("T")[0],
          odeme_durumu: "beklemede"
        };
      }
      return s;
    }));

    if (supabase) {
      await supabase.from('seferler').update({
        durum: "teslima_bekleniyor",
        teslim_tarihi: new Date().toISOString().split("T")[0],
        odeme_durumu: "beklemede"
      }).eq('id', seferId);
    }
  }, [supabase]);

  const ibanGuncelle = useCallback((alan, deger) => {
    setOturum(prev => {
      if (!prev) return prev;
      return { ...prev, [alan]: deger };
    });
  }, []);

  const adminKullanicilar = [...kullanicilar,
    { id: 9001, ad: "Mehmet Yılmaz", rol: "kamyoncu", puan: 4.9, durum: "aktif", kayitTarihi: "2024-01-15", plaka: "34 TYK 421", aracTip: "TIR", iban: "TR 0000 0000 0000 0000 0000 00", ibanSahibi: "Mehmet Yılmaz" },
    { id: 9002, ad: "Metro Gıda Lojistik", rol: "issiz", puan: 4.9, durum: "aktif", kayitTarihi: "2024-02-10", iban: "TR 0000 0000 0000 0000 0000 00", ibanSahibi: "Metro Gıda Lojistik" },
  ];

  const konusmaOluştur = useCallback((params) => {
    try {
      // Check if messageContext exists
      if (!mesajContext || typeof mesajContext.konusmaAc !== 'function') {
        console.error('MesajContext not initialized properly');
        return null;
      }
      return mesajContext.konusmaAc(params);
    } catch (error) {
      console.error('Konuşma oluşturma hatası:', error);
      return null;
    }
  }, [mesajContext]);

  const ilkMesajiGonder = useCallback((konusmaId, metin) => {
    try {
      // Check if messageContext exists
      if (!mesajContext || typeof mesajContext.mesajGonder !== 'function') {
        console.error('MesajContext not initialized properly');
        return;
      }
      mesajContext.mesajGonder(konusmaId, metin);
    } catch (error) {
      console.error('İlk mesaj gönderme hatası:', error);
    }
  }, [mesajContext]);

  const bildirimGuncelle = useCallback((tur, deger) => {
    setBildirimler(prev => ({ ...prev, [tur]: deger }));
  }, []);

  const başvuruGonder = useCallback(async (ilanId, bilgiler) => {
    setKamyoncuBasvuru({ ilanId, ...bilgiler });
    setSeferOnayDurumu(prev => ({ ...prev, [ilanId]: "bekliyor_onay" }));

    const ilan = ilanlar.find(i => i.id === ilanId);
    if (!ilan) return;

    const yeniSefer = {
      yuk: ilan.yuk,
      nereden: ilan.nereden,
      nereye: ilan.nereye,
      ucret: ilan.ucret,
      tarih: ilan.tarih,
      sure: ilan.sure,
      ton: 0,
      arac_tip: ilan.arac_tip,
      ilan_id: ilan.id,
      plaka: "",
      kamyoncu: bilgiler.ad,
      kamyoncu_tel: bilgiler.tel,
      kamyoncu_tc: bilgiler.tcKimlik,
      dorse_plaka: bilgiler.dorsePlaka,
      olusturan: ilan.olusturan,
      olusturan_id: ilan.olusturan_id,
      durum: "bekliyor",
      teslim_tarihi: null,
      belgeler: [],
      odeme_tarihi: null,
      odeme_durumu: "beklemede",
      odeme_turu: ilan.odeme_turu,
      odeme_gun: ilan.odeme_gun,
      iban: ilan.iban || "",
      iban_sahibi: ilan.iban_sahibi || "",
    };

    if (supabase) {
      const { error } = await supabase.from('seferler').insert([yeniSefer]);
      if (error) console.error("Sefer ekleme hatası:", error);
    }

    setSeferler(prev => [yeniSefer, ...prev]);
  }, [ilanlar, supabase]);

  const ilaniOnayla = useCallback(async (ilanId, kamyoncuAd, kamyoncuTel, plaka, dorsePlaka, tcKimlik) => {
    setSeferOnayDurumu(prev => ({
      ...prev,
      [ilanId]: "onaylandı"
    }));

    const ilan = ilanlar.find(i => i.id === ilanId);
    if (!ilan) return;

    const mevcutSefer = seferler.find(s => s.ilanId === ilanId && s.durum === "bekliyor");
    if (!mevcutSefer) return;

    const guncelSefer = {
      plaka: plaka,
      dorse_plaka: dorsePlaka,
      kamyoncu: kamyoncuAd,
      kamyoncu_tel: kamyoncuTel,
      kamyoncu_tc: tcKimlik,
      durum: "yolda",
      teslim_tarihi: null,
      belgeler: [],
      odeme_tarihi: null,
      odeme_durumu: "beklemede",
      iban: mevcutSefer.iban || ilan.iban || "",
      iban_sahibi: mevcutSefer.ibanSahibi || ilan.ibanSahibi || "",
    };

    if (supabase) {
      await supabase.from('seferler').update(guncelSefer).eq('id', mevcutSefer.id);
    }

    setSeferler(prev => prev.map(s => {
      if (s.id === mevcutSefer.id) return { ...s, ...guncelSefer };
      return s;
    }));

    const baslik = `${ilan.yuk} - ${ilan.nereden} → ${ilan.nereye}`;
    const yeniKonusma = mesajContext.konusmaAc({
      partnerId: ilanId,
      partnerAd: kamyoncuAd,
      partnerRol: "kamyoncu",
      isTrucker: false,
      baslik,
      konusmaTuru: "sefer",
      resim: "https://api.dicebear.com/7.x/initials/svg?seed=" + kamyoncuAd.substring(0, 2).toUpperCase(),
      bg: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
    });

    setTimeout(() => {
      mesajContext.mesajGonder(yeniKonusma, `✓ İş başvurunuz kabul edildi. Gelen bilgiler:\n\n👤 Ad: ${kamyoncuAd}\n📞 Tel: ${kamyoncuTel}\n🚚 Çekici Plaka: ${plaka}\n🚐 Dorse Plaka: ${dorsePlaka}\n🆔 TC Kimlik: ${tcKimlik}\n\nŞimdi convo üzerinden konuşabiliriz.`);
    }, 1000);
  }, [ilanlar, seferler, mesajContext, supabase]);

  const ilaniReddet = useCallback((ilanId) => {
    setSeferOnayDurumu(prev => ({ ...prev, [ilanId]: "reddedildi" }));
  }, []);

  const bekleyenOnaylariGetir = useCallback(() => {
    const onayBekleyenler = [];
    if (seferOnayDurumu && typeof seferOnayDurumu.forEach === 'function') {
      Object.entries(seferOnayDurumu).forEach(([ilanId, durum]) => {
        if (durum === "bekliyor_onay") {
          const ilan = ilanlar.find(i => i.id === ilanId);
          if (ilan && kamyoncuBasvuru && kamyoncuBasvuru.ilanId === ilanId) {
            onayBekleyenler.push({
              ilanId,
              yuk: ilan.yuk,
              nereden: ilan.nereden,
              nereye: ilan.nereye,
              bilgiler: kamyoncuBasvuru.bilgiler,
            });
          }
        }
      });
    }
    return onayBekleyenler;
  }, [seferOnayDurumu, ilanlar, kamyoncuBasvuru]);

  const kamyoncuBasvuruBekleyenleriGetir = useCallback(() => {
    if (!kamyoncuBasvuru) return [];
    const ilan = ilanlar.find(i => i.id === kamyoncuBasvuru.ilanId);
    if (!ilan) return [];
    return [{
      ilanId: kamyoncuBasvuru.ilanId,
      yuk: ilan.yuk,
      nereden: ilan.nereden,
      nereye: ilan.nereye,
      bilgiler: kamyoncuBasvuru.bilgiler,
    }];
  }, [kamyoncuBasvuru, ilanlar]);

  const subscribeToIlanlar = () => {
    if (!supabase) return;

    supabase
      .channel('ilanlar-channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ilanlar' }, (payload) => {
        console.log('Yeni ilan:', payload);
        // Normalize data for display
        const normalizedData = {
          ...payload.new,
          toplamUcret: payload.new.toplam_ucret,
          kdvOrani: payload.new.kdv_orani,
          kdvTutari: payload.new.kdv_tutari,
          aracTip: payload.new.arac_tip,
          odemeTuru: payload.new.odeme_turu,
          odemeGun: payload.new.odeme_gun,
          olusturanPuan: payload.new.olusturan?.puan || 5.0
        };
        setIlanlar(prev => [normalizedData, ...prev]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'ilanlar' }, (payload) => {
        const normalizedData = {
          ...payload.new,
          toplamUcret: payload.new.toplam_ucret,
          kdvOrani: payload.new.kdv_orani,
          kdvTutari: payload.new.kdv_tutari,
          aracTip: payload.new.arac_tip,
          odemeTuru: payload.new.odeme_turu,
          odemeGun: payload.new.odeme_gun,
          olusturanPuan: payload.new.olusturan?.puan || 5.0
        };
        setIlanlar(prev => prev.map(i => i.id === payload.new.id ? normalizedData : i));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'ilanlar' }, (payload) => {
        setIlanlar(prev => prev.filter(i => i.id !== payload.old.id));
      })
      .subscribe();
  };

  const subscribeToSeferler = () => {
    if (!supabase) return;

    supabase
      .channel('seferler-channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'seferler' }, (payload) => {
        setSeferler(prev => [payload.new, ...prev]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'seferler' }, (payload) => {
        setSeferler(prev => prev.map(s => s.id === payload.new.id ? payload.new : s));
      })
      .subscribe();
  };

  const subscribeToTeklifler = () => {
    if (!supabase) return;

    supabase
      .channel('teklifler-channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'teklifler' }, (payload) => {
        setTeklifler(prev => [...prev, payload.new]);
      })
      .subscribe();
  };

  const subscribeToConversations = () => {
    if (!supabase) return;

    supabase
      .channel('conversations-channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'conversations' }, (payload) => {
        console.log('Yeni konuşma:', payload);
        setKonusmalar(prev => [payload.new, ...prev]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'conversations' }, (payload) => {
        setKonusmalar(prev => prev.map(k => k.id === payload.new.id ? payload.new : k));
      })
      .subscribe();
  };

  return (
    <Ctx.Provider value={{
      oturum, kullanicilar: adminKullanicilar, ilanlar, seferler, teklifler,
      kayitOl, girisYap, girisYapDemo, cikisYap,
      ilanEkle, ilanSil, ilanAl, belgeEkle, odemeYap, odemeGunleriniKabulEt, islemiTeslimEt, ibanGuncelle,
      konusmaOluştur, ilkMesajiGonder,
      bildirimler, bildirimGuncelle,
      kamyoncuBasvuru, setKamyoncuBasvuru,
      seferOnayDurumu, ilaniOnayla, ilaniReddet,
      bekleyenOnaylariGetir,
      kamyoncuBasvuruBekleyenleriGetir, başvuruGonder,
    }}>
      {children}
    </Ctx.Provider>
  );
};

export const useApp = () => useContext(Ctx);
