import { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react";
import { supabase } from "../supabaseClient";
import { useMesaj } from "./MesajContext";
import { IconMap } from "../components/Icons";
import { serviceWorkerKaydet, pushAboneligiKaydet, pushGonder } from "../utils/push";
import { useAuth } from "./hooks/useAuth";
import {
  kullanicilariGetir,
  ilanlariGetir,
  ilanEkle as ilanEkleApi,
  ilanSoftSil,
  ilanDurumuGuncelle as ilanDurumuGuncelleApi,
  seferleriGetir,
  seferEkle,
  seferGuncelle,
  teklifleriGetir,
  teklifEkle as teklifEkleApi,
  teklifGuncelle as teklifGuncelleApi,
  bildirimEkle,
  bildirimleriGetir,
  bildirimOkundu,
  tumBildirimleriOkundu,
  ihtilaflariGetir,
  ihtilafEkle,
  ihtilafGuncelle,
  ihtilaflariKapat,
  kamyoncuIptalEkle,
  son24SaatIptalleri,
  profilFotograflariGetir,
  benimDegerlendirmelerimGetir,
  degerlendirmeleriGetir as degerlendirmeleriGetirApi,
  degerlendirmeGonder as degerlendirmeGonderApi,
  hizSiniriAsildiMi
} from "../utils/api";
import { ilanNormalize, ilanListesiNormalize } from "../utils/ilanNormalize";

const Ctx = createContext();

let ilanlarData = null;
let seferlerData = null;
let tekliflerData = null;
let usersData = null;
let ihtilaflarData = null;

export const AppProvider = ({ children }) => {
  const { konusmaAc, mesajGonder, loadConversations, subscribeRealtime } = useMesaj();
  const [loading, setLoading] = useState(true);
  // Auth durumu, giriş/kayıt/çıkış/şifre sıfırlama ve session oturma mantığı ayrı hook'a taşındı.
  const { oturum, setOturum, kayitOl, girisYap, cikisYap } = useAuth(supabase, { setLoading });

  // Load initial data from Supabase on mount
  useEffect(() => {
    const loadInitialData = async () => {
      if (!supabase) {
        console.warn(`${IconMap.warning} Supabase yok! Lütfen Supabase URL ve key ayarlayın.`);
        setLoading(false);
        return;
      }

      try {
        // Fetch ilanlar
        const { data: ilanlarRes, error: ilanlarError } = await ilanlariGetir(supabase);

        if (!ilanlarError && ilanlarRes) {
          console.log(`✅ ${ilanlarRes.length} ilan yüklendi`);
          ilanlarData = ilanlarRes;
        } else {
          console.error('❌ İlanlar yüklenemedi');
        }

        // Fetch seferler
        const { data: seferlerRes, error: seferlerError } = await seferleriGetir(supabase);

        if (!seferlerError && seferlerRes) {
          console.log(`✅ ${seferlerRes.length} sefer yüklendi`);
          seferlerData = seferlerRes;
        } else {
          console.error('❌ Seferler yüklenemedi');
        }

        // Fetch teklifler
        const { data: tekliflerRes, error: tekliflerError } = await teklifleriGetir(supabase);

        if (!tekliflerError && tekliflerRes) {
          console.log(`✅ ${tekliflerRes.length} teklif yüklendi`);
          tekliflerData = tekliflerRes;
        } else {
          console.error('❌ Teklifler yüklenemedi');
        }

        // Fetch users
        const { data: usersRes, error: usersError } = await kullanicilariGetir(supabase);

        if (!usersError && usersRes) {
          console.log(`✅ ${usersRes.length} kullanıcı yüklendi`);
          usersData = usersRes;
        } else {
          console.error('❌ Kullanıcılar yüklenemedi');
        }

        // Fetch ihtilaflar
        const { data: ihtilaflarRes, error: ihtilaflarError } = await ihtilaflariGetir(supabase);

        if (!ihtilaflarError && ihtilaflarRes) {
          console.log(`✅ ${ihtilaflarRes.length} ihtilaf yüklendi`);
          ihtilaflarData = ihtilaflarRes;
        } else {
          console.error('❌ İhtilaflar yüklenemedi');
        }

        // Set the fetched data
        if (ilanlarData) {
          // Fetch profile photos from belgeler table
          const { data: profilFotograflari } = await profilFotograflariGetir(supabase);
          const fotoMap = {};
          if (profilFotograflari) {
            profilFotograflari.forEach(f => {
              if (!fotoMap[f.kullanici_id]) fotoMap[f.kullanici_id] = f.url;
            });
          }
          // Her ilana olusturanın kullanıcı bilgilerini ekle + camelCase normalize
          const ilanlarWithUsers = ilanListesiNormalize(ilanlarData, { usersData, fotoMap });
          setIlanlar(ilanlarWithUsers);
        }
        if (seferlerData) setSeferler(seferlerData);
        if (tekliflerData) setTeklifler(tekliflerData);
        if (usersData) setKullanicilar(usersData);
        if (ihtilaflarData) setIhtilaflar(ihtilaflarData);

      } catch (error) {
        console.error('❌ Veri yüklenemedi:', error);
      } finally {
        // Timeout ile durumu tamamlıyoruz
        setTimeout(() => {
          setLoading(false);
        }, 2000);
      }
    };

    loadInitialData();
  }, [supabase]);

  // State'leri başlat
  const [kullanicilar, setKullanicilar] = useState([]);
  const [ilanlar, setIlanlar] = useState([]);
  const [seferler, setSeferler] = useState([]);
  const [teklifler, setTeklifler] = useState([]);
  const [bildirimlerList, setBildirimlerList] = useState([]);
  const [gosterenBildirim, setGosterenBildirim] = useState(null);
  const [toastBildirim, setToastBildirim] = useState(null);

  const [bildirimler, setBildirimler] = useState({
    ilan: true,
    teklif: true,
    mesaj: true,
    sefer: true
  });

  // Bildirimler localStorage'dan kaldırıldı - artık sadece Supabase'den çekiliyor

  const [kamyoncuBasvuru, setKamyoncuBasvuru] = useState(null);
  const [seferOnayDurumu, setSeferOnayDurumu] = useState(() => ({}));
  const [ihtilaflar, setIhtilaflar] = useState([]);
  const [seciliProfilId, setSeciliProfilId] = useState(null);
  const [benimDegerlendirmelerim, setBenimDegerlendirmelerim] = useState([]);

  const ilanEkle = useCallback(async (yeni) => {
    const ilan = {
      yuk: yeni.yuk,
      aciklama: yeni.aciklama || "",
      nereden: yeni.nereden,
      nereye: yeni.nereye,
      ucret: yeni.ucret,
      tarih: yeni.tarih || new Date().toISOString().split("T")[0],
      sure: yeni.sure,
      arac_tip: yeni.aracTip,
      odeme_turu: yeni.odemeTuru || "pesin",
      odeme_gun: yeni.odemeGun || 0,
      kdv_orani: yeni.kdvEkle ? 1 : 0,
      kdv_tutari: 0,
      toplam_ucret: yeni.ucret,
      yukleme_konum: yeni.yuklemeKonum || "",
      bosaltma_konum: yeni.bosaltmaKonum || "",
      yukleme_saat_bas: yeni.yuklemeSaatBas || "",
      yukleme_saat_bit: yeni.yuklemeSaatBit || "",
      bosaltma_saat_bas: yeni.bosaltmaSaatBas || "",
      bosaltma_saat_bit: yeni.bosaltmaSaatBit || "",
      fatura_baslik: yeni.faturaBaslik || "",
      fatura_dosya: yeni.faturaDosya || null,
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
      const { data, error } = await ilanEkleApi(supabase, ilan);

      if (error) throw error;

      console.log("✅ İlan Supabase'e kaydedildi:", ilan.yuk);
      // Normalize data for display
      const normalizedData = ilanNormalize(data, {
        usersData: oturum?.id ? [{ id: oturum.id, puan: oturum.puan, oy_sayisi: oturum.oy_sayisi }] : undefined
      });
      setIlanlar(prev => [normalizedData, ...prev]);

      // Web Push: yeni ilan → tüm kamyonculara bildirim
      try {
        await pushGonder({
          hedefRol: "kamyoncu",
          baslik: "🚚 Yeni İlan",
          icerik: `${yeni.yuk} · ${yeni.nereden} → ${yeni.nereye} · ₺${Number(yeni.ucret || 0).toLocaleString("tr-TR")}`,
          url: "/#/app?sekme=ilanlar",
          zorunlu: false
        });
      } catch (err) {
        console.warn("Yeni ilan push gönderilemedi:", err);
      }

      return normalizedData;
    } catch (error) {
      console.error("❌ İlan kaydedilemedi:", error);
      throw error;
    }
  }, [oturum, supabase]);

  const ilanSil = useCallback(async (id) => {
    // SOFT-DELETE: ilanlar tablosundan satırı silmiyoruz, sadece durum='silindi' yapıyoruz.
    // Neden? Çünkü seferler.ilan_id ON DELETE CASCADE — eğer hard-delete yaparsak
    // kamyoncunun o ilandan yaptığı sefer de DB seviyesinde silinir, geçmiş kaybolur.
    // Soft-delete sayesinde:
    //   - Kamyoncu seferini korur (CASCADE tetiklenmez)
    //   - İşveren "Geçmiş İşler" bölümünden ilan/sefer geçmişine ulaşabilir
    //   - RLS "Public can view active ilans" sayesinde diğer kamyoncular silinen ilanı göremez
    if (supabase) {
      const { error } = await ilanSoftSil(supabase, id);
      if (error) {
        console.error('❌ İlan silinemedi (soft-delete):', error);
        throw error;
      }
    }
    // Local state'ten de KALDIRMIYORUZ, sadece durumunu güncelliyoruz.
    // Bu sayede IssizIlanlarSayfasi'nda "Geçmiş" bölümünde gösterebiliriz.
    setIlanlar(prev => prev.map(i =>
      i.id === id ? { ...i, durum: 'silindi' } : i
    ));
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

    const yeniSefer = {
      yuk: ilan.yuk,
      nereden: ilan.nereden,
      nereye: ilan.nereye,
      ucret: ilan.ucret,
      tarih: ilan.tarih,
      sure: ilan.sure,
      arac_tip: ilan.arac_tip,
      ilan_id: ilanId,
      plaka: kamyoncu?.plaka || "Belirtilmedi",
      dorse_plaka: kamyoncu?.dorsePlaka || "",
      kamyoncu: kamyoncu?.ad || kamyoncu || "",
      kamyoncu_tel: kamyoncu?.tel || "",
      kamyoncu_tc: kamyoncu?.tc_kimlik || "",
      olusturan: ilan.olusturan,
      olusturan_id: ilan.olusturan_id,
      durum: "yolda",
      teslim_tarihi: null,
      belgeler: [],
      odeme_tarihi: null,
      odeme_durumu: "beklemede",
      odeme_turu: ilan.odeme_turu,
      odeme_gun: ilan.odeme_gun,
      iban: kamyoncu?.iban || "",
      iban_sahibi: kamyoncu?.ibanSahibi || kamyoncu?.ad || "",
    };

    if (supabase) {
      const { error } = await seferEkle(supabase, yeniSefer);
      if (error) console.error("Sefer ekleme hatası:", error);
    }

    setSeferler(prev => [yeniSefer, ...prev]);

    const partnerAd = ilan.olusturan;
    const baslik = `${ilan.yuk} - ${ilan.nereden} → ${ilan.nereye}`;

    konusmaAc({
      userId: oturum?.id,
      partnerId: ilan.olusturan_id || ilanId,
      partnerAd,
      partnerRol: "issiz",
      isTrucker: true,
      konusmaTuru: "is",
      ilanId,
      baslik,
      resim: "https://api.dicebear.com/7.x/initials/svg?seed=" + partnerAd.substring(0, 2).toUpperCase(),
      bg: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
    });
  }, [ilanlar, supabase, konusmaAc]);

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
      // Anti-spam: aynı kullanıcının son 1 dakikada en fazla 5 teklif
      if (oturum?.id) {
        const engelle = await hizSiniriAsildiMi(supabase, {
          tablo: 'teklifler',
          sutun: 'teklif_sahibi_id',
          deger: oturum.id,
          dakika: 1,
          limit: 5
        });
        if (engelle) {
          throw new Error("Çok hızlı işlem yapıyorsunuz. Lütfen birkaç saniye bekleyip tekrar deneyin.");
        }
      }

      const { data, error } = await teklifEkleApi(supabase, {
        ilan_id: ilanId,
        teklif_sahibi_id: oturum?.id,
        tutar: teklifVerisi.tutar,
        ozellikler: teklifVerisi.ozellikler || {},
        durum: "bekliyor"
      });

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
      await teklifGuncelleApi(supabase, teklifId, durum);
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

  // Kullanıcıya özel belge yükleme
  const kullaniciBelgesiYukle = useCallback(async (dosya) => {
    if (!oturum?.id || !supabase) {
      throw new Error("Oturum veya Supabase yok");
    }

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const userId = authUser?.id || oturum.id;

      // Storage'a yükle
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('belgeler')
        .upload(`${userId}/${Date.now()}_${dosya.name}`, dosya);

      if (uploadError) {
        console.error('❌ Belge yükleme hatası:', uploadError);
        throw uploadError;
      }

      // Public URL al
      const { data: { publicUrl } } = supabase.storage
        .from('belgeler')
        .getPublicUrl(uploadData.path);

      // Veritabanına kaydet
      const { data: dbData, error: dbError } = await supabase
        .from('belgeler')
        .insert([{
          kullanici_id: userId,
          rol: oturum.role || oturum.rol || 'kamyoncu',
          dosya_adi: dosya.name,
          dosya_yolu: uploadData.path,
          url: publicUrl,
          onaylandi: false,
          olusturulma_tarihi: new Date().toISOString()
        }])
        .select()
        .single();

      if (dbError) {
        console.error('❌ Veritabanına kaydetme hatası:', dbError);
        throw dbError;
      }

      return dbData;
    } catch (error) {
      console.error('❌ Belge yükleme hatası:', error);
      throw error;
    }
  }, [oturum, supabase]);

  // Oturum açıldığında konuşmaları yükle + realtime dinle
  useEffect(() => {
    if (!oturum?.id) return;
    console.log('💬 Oturum değişti, konuşmalar yükleniyor:', oturum.id);
    loadConversations(oturum.id);
    const unsubscribe = subscribeRealtime(oturum.id);
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [oturum?.id, loadConversations, subscribeRealtime]);

  // Web Push: oturum açılınca service worker + abonelik kur
  useEffect(() => {
    if (!oturum?.id) return;
    (async () => {
      const swVarMi = await serviceWorkerKaydet();
      if (swVarMi) {
        await pushAboneligiKaydet(oturum.id);
      }
    })();
  }, [oturum?.id]);

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
    const sefer = seferler.find(s => s.id === seferId);
    const odemeGun = Number(sefer?.odeme_gun || sefer?.odemeGun || 0);
    const teslimTarihi = new Date(sefer?.tarih || new Date());
    teslimTarihi.setDate(teslimTarihi.getDate() + odemeGun);
    const teslimTarihiStr = teslimTarihi.toISOString().split("T")[0];

    setSeferler(prev => prev.map(s => {
      if (s.id === seferId) {
        return {
          ...s,
          teslim_tarihi: teslimTarihiStr,
          durum: "teslima_bekleniyor"
        };
      }
      return s;
    }));

    if (supabase) {
      await supabase.from('seferler').update({
        teslim_tarihi: teslimTarihiStr,
        durum: "teslima_bekleniyor"
      }).eq('id', seferId);
    }
  }, [seferler, supabase]);

  const islemiTeslimEt = useCallback(async (seferId, teslimBilgisi = null) => {
    const sefer = seferler.find(s => s.id === seferId);
    const teslimTarihi = new Date().toISOString().split("T")[0];
    // Vadeli ödeme: teslim tarihi + ödeme günü → vade tarihi
    const odemeGun = Number(sefer?.odeme_gun || sefer?.odemeGun || 0);
    const vadeli = sefer?.odeme_turu !== "pesin" && odemeGun > 0;
    let vadeTarihi = null;
    if (vadeli) {
      const v = new Date(teslimTarihi);
      v.setDate(v.getDate() + odemeGun);
      vadeTarihi = v.toISOString().split("T")[0];
    }

    setSeferler(prev => prev.map(s => {
      if (s.id === seferId) {
        return {
          ...s,
          durum: "teslima_bekleniyor",
          teslim_tarihi: teslimTarihi,
          vade_tarihi: vadeTarihi,
          odeme_durumu: "beklemede",
          teslim: teslimBilgisi,
          iban: teslimBilgisi?.iban || s.iban || "",
          iban_sahibi: teslimBilgisi?.iban_sahibi || s.iban_sahibi || s.ibanSahibi || ""
        };
      }
      return s;
    }));

    if (supabase) {
      const guncelle = {
        durum: "teslima_bekleniyor",
        teslim_tarihi: teslimTarihi,
        vade_tarihi: vadeTarihi,
        odeme_durumu: "beklemede"
      };
      if (teslimBilgisi) {
        guncelle.teslim = teslimBilgisi;
        if (teslimBilgisi.iban) guncelle.iban = teslimBilgisi.iban;
        if (teslimBilgisi.iban_sahibi) guncelle.iban_sahibi = teslimBilgisi.iban_sahibi;
      }
      await supabase.from('seferler').update(guncelle).eq('id', seferId);

      // İşverene teslim bildirimi
      if (sefer?.olusturan_id) {
        try {
          await supabase.from('bildirimler').insert({
            kullanici_id: sefer.olusturan_id,
            tur: 'teslim',
            baslik: 'İş teslim edildi',
            icerik: `${sefer.yuk || ''} - ${sefer.nereden || ''} → ${sefer.nereye || ''}\n\nKamyoncu işi teslim etti ve ödeme bekliyor.`,
            sefer_id: seferId
          });
        } catch (err) {
          console.error('Teslim bildirimi hatası:', err);
        }
      }
    }

    // Web Push: iş teslim edildi → işverene bildirim
    if (sefer?.olusturan_id) {
      try {
        await pushGonder({
          hedefKullaniciId: sefer.olusturan_id,
          baslik: "📦 İş Teslim Edildi",
          icerik: `${sefer.yuk || ''} · ${sefer.nereden || ''} → ${sefer.nereye || ''}\n\nKamyoncu işi teslim etti, ödeme bekleniyor.`,
          url: "/#/app?sekme=teklifler",
          zorunlu: false
        });
      } catch (err) {
        console.warn("Teslim push gönderilemedi:", err);
      }
    }
  }, [supabase, seferler]);

  const odemeOnayla = useCallback(async (seferId) => {
    const sefer = seferler.find(s => s.id === seferId);
    if (!sefer) return;
    const odemeTarihi = new Date().toISOString().split("T")[0];
    setSeferler(prev => prev.map(s => s.id === seferId ? { ...s, durum: "tamamlandı", odeme_durumu: "odendi", odeme_tarihi: odemeTarihi } : s));

    if (supabase) {
      try {
        await seferGuncelle(supabase, seferId, {
          durum: "tamamlandı",
          odeme_durumu: "odendi",
          odeme_tarihi: odemeTarihi
        });

        // Açık ihtilaf varsa otomatik kapat
        await ihtilaflariKapat(supabase, seferId);

        // Kamyoncuya bildirim
        if (sefer.kamyoncu_user_id) {
          await bildirimEkle(supabase, {
            kullanici_id: sefer.kamyoncu_user_id,
            tur: 'odeme',
            baslik: '💰 Ödemeniz onaylandı',
            icerik: `${sefer.yuk || ''} - ${sefer.nereden || ''} → ${sefer.nereye || ''}\n\nİşveren ödemeyi onayladı, iş tamamlandı.`,
            sefer_id: seferId
          });
        }
      } catch (err) {
        console.error('Ödeme onaylama hatası:', err);
      }
    }

    // Web Push: ödeme onaylandı → kamyoncuya bildirim
    if (sefer.kamyoncu_user_id) {
      try {
        await pushGonder({
          hedefKullaniciId: sefer.kamyoncu_user_id,
          baslik: "💰 Ödemeniz Onaylandı",
          icerik: `${sefer.yuk || ''} · ${sefer.nereden || ''} → ${sefer.nereye || ''}\n\nİşveren ödemeyi onayladı, iş tamamlandı.`,
          url: "/#/app?sekme=seferler",
          zorunlu: false
        });
      } catch (err) {
        console.warn("Ödeme push gönderilemedi:", err);
      }
    }
  }, [seferler, supabase]);

  const ihtilafAc = useCallback(async (seferId, sebep) => {
    const sefer = seferler.find(s => s.id === seferId);
    if (!sefer || !sebep || !sebep.trim()) return;
    // Karşı taraf: ihtilafı açan kim değilse o taraf
    const hedefId = sefer.olusturan_id === oturum?.id ? sefer.kamyoncu_user_id : sefer.olusturan_id;
    const yeni = {
      sefer_id: seferId,
      acan_id: oturum?.id,
      acan_rol: oturum?.rol || "kamyoncu",
      hedef_id: hedefId || null,
      sebep: sebep.trim(),
      durum: "acik",
      admin_notu: null,
      olusturma_zamani: new Date().toISOString()
    };
    setIhtilaflar(prev => [yeni, ...prev]);

    if (supabase) {
      try {
        const { error } = await ihtilafEkle(supabase, yeni);
        if (error) {
          console.error('İhtilaf ekleme hatası:', error);
          return;
        }
      } catch (err) {
        console.error('İhtilaf açma hatası:', err);
        return;
      }

      // İşverene bildirim
      if (sefer.olusturan_id) {
        try {
          await bildirimEkle(supabase, {
            kullanici_id: sefer.olusturan_id,
            tur: 'ihtilaf',
            baslik: '⚠️ Ödeme ihtilafı açıldı',
            icerik: `Kamyoncu ödemeyle ilgili itiraz bildirdi:\n\n"${sebep.trim()}"\n\n${sefer.yuk || ''} - ${sefer.nereden || ''} → ${sefer.nereye || ''}`,
            sefer_id: seferId
          });
        } catch (err) { console.error('İhtilaf işveren bildirimi hatası:', err); }
      }

      // Admin'lere bildirim
      const adminler = (kullanicilar || []).filter(u => u.rol === 'admin');
      for (const admin of adminler) {
        try {
          await bildirimEkle(supabase, {
            kullanici_id: admin.id,
            tur: 'ihtilaf',
            baslik: '⚠️ Yeni ödeme ihtilafı',
            icerik: `${oturum?.ad || 'Kamyoncu'}: "${sebep.trim()}"\n\n${sefer.yuk || ''} - ${sefer.nereden || ''} → ${sefer.nereye || ''}`,
            sefer_id: seferId
          });
        } catch (err) { console.error('İhtilaf admin bildirimi hatası:', err); }
      }
    }
  }, [seferler, supabase, oturum, kullanicilar]);

  const ihtilafCoz = useCallback(async (ihtilafId, not) => {
    setIhtilaflar(prev => prev.map(i => i.id === ihtilafId ? { ...i, durum: "cozuldu", admin_notu: not || "" } : i));
    if (supabase) {
      try {
        await ihtilafGuncelle(supabase, ihtilafId, { durum: "cozuldu", admin_notu: not || "" });
        const ihtilaf = ihtilaflar.find(i => i.id === ihtilafId);
        const sefer = ihtilaf ? seferler.find(s => s.id === ihtilaf.sefer_id) : null;

        if (ihtilaf?.acan_id) {
          await supabase.from('bildirimler').insert({
            kullanici_id: ihtilaf.acan_id,
            tur: 'ihtilaf',
            baslik: '✅ İhtilafınız değerlendirildi',
            icerik: not || 'İhtilafınız destek ekibi tarafından incelendi.',
            sefer_id: ihtilaf.sefer_id
          });
        }
        if (sefer?.olusturan_id && ihtilaf?.acan_id !== sefer.olusturan_id) {
          await supabase.from('bildirimler').insert({
            kullanici_id: sefer.olusturan_id,
            tur: 'ihtilaf',
            baslik: '⚠️ İhtilaf değerlendirildi',
            icerik: not || 'İlgili ihtilaf destek ekibi tarafından incelendi.',
            sefer_id: sefer.id
          });
        }
      } catch (err) {
        console.error('İhtilaf çözme hatası:', err);
      }
    }
  }, [ihtilaflar, seferler, supabase]);

  // --- ADMIN YÖNETİM FONKSİYONLARI ---
  const kullaniciDurumuGuncelle = useCallback(async (userId, durum) => {
    setKullanicilar(prev => prev.map(k => k.id === userId ? { ...k, durum } : k));
    if (supabase) {
      const { error } = await supabase.from('users').update({ durum }).eq('id', userId);
      if (error) console.error('Kullanıcı durumu güncelleme hatası:', error.message);
    }
  }, [supabase]);

  const kullaniciRolunuGuncelle = useCallback(async (userId, rol) => {
    setKullanicilar(prev => prev.map(k => k.id === userId ? { ...k, role: rol, rol } : k));
    if (supabase) {
      const { error } = await supabase.from('users').update({ role: rol }).eq('id', userId);
      if (error) console.error('Kullanıcı rolü güncelleme hatası:', error.message);
    }
  }, [supabase]);

  const kullaniciSil = useCallback(async (userId) => {
    setKullanicilar(prev => prev.filter(k => k.id !== userId));
    if (supabase) {
      const { error } = await supabase.from('users').delete().eq('id', userId);
      if (error) throw error;
    }
  }, [supabase]);

  const ilanDurumuGuncelle = useCallback(async (ilanId, durum) => {
    setIlanlar(prev => prev.map(i => i.id === ilanId ? { ...i, durum } : i));
    if (supabase) {
      const { error } = await ilanDurumuGuncelleApi(supabase, ilanId, durum);
      if (error) console.error('İlan durumu güncelleme hatası:', error.message);
    }
  }, [supabase]);

  const seferDurumuGuncelle = useCallback(async (seferId, durum) => {
    setSeferler(prev => prev.map(s => s.id === seferId ? { ...s, durum } : s));
    if (supabase) {
      const { error } = await seferGuncelle(supabase, seferId, { durum });
      if (error) console.error('Sefer durumu güncelleme hatası:', error.message);
    }
  }, [supabase]);

  const bildirimGonder = useCallback(async (kullaniciId, baslik, icerik) => {
    if (!supabase) return;
    await bildirimEkle(supabase, {
      kullanici_id: kullaniciId,
      tur: 'yönetim',
      baslik: baslik || 'Admin Mesajı',
      icerik
    });
  }, [supabase]);

  const duyuruGonder = useCallback(async (baslik, icerik) => {
    if (!supabase) return;
    const hedefler = (kullanicilar || []).filter(k => k.id && k.id !== oturum?.id);
    for (const k of hedefler) {
      try {
        await bildirimEkle(supabase, {
          kullanici_id: k.id,
          tur: 'duyuru',
          baslik: baslik || 'Duyuru',
          icerik
        });
      } catch (err) { console.error('Duyuru gönderme hatası:', err.message); }
    }
  }, [supabase, kullanicilar, oturum]);

  const ibanGuncelle = useCallback(async (alan, deger) => {
    if (!oturum?.id) return { ok: false, error: "Oturum yok" };
    setOturum(prev => {
      if (!prev) return prev;
      return { ...prev, [alan]: deger };
    });
    const { error } = await supabase.from('users').update({ [alan]: deger }).eq('id', oturum.id);
    if (error) console.warn('IBAN güncelleme hatası:', error.message);
    return { ok: !error };
  }, [supabase, oturum?.id]);

  // Profil güncelleme - hem Supabase hem local state
  const profilGuncelle = useCallback(async (guncellemeler) => {
    if (!oturum?.id) return { ok: false, error: "Oturum yok" };
    try {
      const updateData = {};
      Object.entries(guncellemeler).forEach(([k, v]) => {
        if (v !== undefined && v !== null) updateData[k] = v;
      });
      if (Object.keys(updateData).length === 0) return { ok: false, error: "Boş güncelleme" };

      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', oturum.id);

      if (error) {
        console.warn(`${IconMap.warning} Profil güncelleme hatası:`, error.message);
        // Local state yine de güncelle (offline demo modu)
        setOturum(prev => prev ? { ...prev, ...updateData } : prev);
        return { ok: false, error: error.message };
      }

      setOturum(prev => prev ? { ...prev, ...updateData } : prev);
      return { ok: true };
    } catch (err) {
      console.warn(`${IconMap.warning} Profil güncelleme exception:`, err);
      setOturum(prev => prev ? { ...prev, ...guncellemeler } : prev);
      return { ok: false, error: String(err) };
    }
  }, [supabase, oturum?.id]);

  const adminKullanicilar = kullanicilar;

  const konusmaOluştur = useCallback((params) => {
    try {
      if (!konusmaAc || typeof konusmaAc !== 'function') {
        console.error('KonusmaAc function not available');
        return null;
      }
      return konusmaAc(params);
    } catch (error) {
      console.error('Konuşma oluşturma hatası:', error);
      return null;
    }
  }, [konusmaAc]);

  const ilkMesajiGonder = useCallback((konusmaId, metin) => {
    try {
      if (!mesajGonder || typeof mesajGonder !== 'function') {
        console.error('MesajGonder function not available');
        return;
      }
      mesajGonder(konusmaId, metin);
    } catch (error) {
      console.error('İlk mesaj gönderme hatası:', error);
    }
  }, [mesajGonder]);

  const bildirimGuncelle = useCallback((tur, deger) => {
    setBildirimler(prev => ({ ...prev, [tur]: deger }));
  }, []);

  // Yeni bildirim geldiğinde sadece kısa bir toast göster (tam ekran modal açma).
  // Bildirim tamamen "okundu" durumu ise kullanıcı listeden tıklayınca işaretlenir.
  const bildirimGoster = useCallback((baslik, icerik, icon = "🔔", id = null) => {
    setToastBildirim({ baslik, icerik, icon, id: id || Date.now() });

    setTimeout(() => {
      setToastBildirim(null);
    }, 5000);
  }, []);

  // Tek bir bildirimi okundu yap (DB + yerel state)
  const bildirimiOkunduYap = useCallback(async (bildirimId) => {
    if (!bildirimId) return;
    setBildirimlerList(prev => prev.map(b => b.id === bildirimId ? { ...b, okundu: true } : b));
    if (supabase) {
      try {
        await bildirimOkundu(supabase, bildirimId);
      } catch (e) {
        console.error('Bildirim okundu güncelleme hatası:', e);
      }
    }
  }, [supabase]);

  // Kullanıcının tüm bildirimlerini okundu işaretle (DB + yerel state)
  const tumBildirimleriOkunduYap = useCallback(async () => {
    setBildirimlerList(prev => prev.map(b => ({ ...b, okundu: true })));
    if (supabase && oturum?.id) {
      try {
        await tumBildirimleriOkundu(supabase, oturum.id);
      } catch (e) {
        console.error('Tüm bildirimleri okundu işaretleme hatası:', e);
      }
    }
  }, [supabase, oturum?.id]);



  const başvuruGonder = useCallback(async (ilanId, bilgiler) => {
    // DEBUG: başvuruGonder çağrılıyor mu?
    console.log('🚀 başvuruGonder ÇAĞRILDI', { ilanId, supabaseVarMi: !!supabase, ilanSayisi: ilanlar?.length });

    // Anti-spam: aynı kullanıcının son 1 dakikada en fazla 3 başvuru
    if (supabase && oturum?.id) {
      const engelle = await hizSiniriAsildiMi(supabase, {
        tablo: 'seferler',
        sutun: 'kamyoncu_user_id',
        deger: oturum.id,
        dakika: 1,
        limit: 3
      });
      if (engelle) {
        console.warn('🚫 Hız sınırı aşıldı - başvuru engellendi');
        alert('Çok hızlı başvuru yapıyorsunuz. Lütfen biraz bekleyip tekrar deneyin.');
        return;
      }
    }

    setKamyoncuBasvuru({ ilanId, ...bilgiler });
    setSeferOnayDurumu(prev => ({ ...prev, [ilanId]: "bekliyor_onay" }));

    // Aynı ilana zaten bekleyen başvuru varsa tekrar gönderme (çift tıklama koruması)
    const zatenVar = (seferler || []).some(s =>
      (s.ilan_id === ilanId || s.ilanId === ilanId) &&
      s.kamyoncu_user_id === oturum?.id &&
      s.durum === "bekliyor"
    );
    if (zatenVar) {
      console.warn('⚠️ Bu ilana zaten bekleyen başvurunuz var:', ilanId);
      alert('Bu ilana başvurunuz zaten gönderilmiş. İşveren onayı bekleniyor.');
      return;
    }

    const ilan = ilanlar.find(i => i.id === ilanId);
    if (!ilan) {
      console.error('❌ İlan bulunamadı!', { ilanId, mevcutIlanlar: ilanlar?.map(i => i.id) });
      alert(`İlan bulunamadı!\nilanId: ${ilanId}\n\nLütfen sayfayı yenileyip tekrar deneyin.`);
      return;
    }
    console.log('✅ İlan bulundu:', { id: ilan.id, olusturan_id: ilan.olusturan_id, yuk: ilan.yuk });

    // Formdaki Ad/Tel/TC/Plaka bilgileri ŞOFÖRÜN bilgileridir.
    // İşveren firmaya gönderdiği şoförün kim olduğunu bilmek ister.
    // Bu yüzden bu alanlar formdan gelir, oturumdan ZORLA ALINMAZ.
    //
    // ANCAK: Seferlerim filtresi için "bu başvuruyu HANGİ KULLANICI yaptığını"
    // bilmemiz lazım. Bu yüzden kamyoncu_user_id = oturum.id (giriş yapan kullanıcı).
    const kamyoncuUserId = oturum?.id || null;

    if (!kamyoncuUserId) {
      console.error('❌ Oturum yok - başvuru reddedildi');
      alert('Oturum bulunamadı. Lütfen çıkış yapıp tekrar giriş yapın.');
      return;
    }

    // COOLDOWN KONTROLÜ: Fazla iptal yapan kamyoncu geçici süre başvuru yapamaz
    if (supabase) {
      try {
        const { data: kullanici } = await supabase
          .from('users')
          .select('iptal_cooldown_bitis')
          .eq('id', kamyoncuUserId)
          .maybeSingle();
        const cooldownBitis = kullanici?.iptal_cooldown_bitis;
        if (cooldownBitis && new Date(cooldownBitis).getTime() > Date.now()) {
          const kalanSaat = Math.ceil((new Date(cooldownBitis).getTime() - Date.now()) / 3600000);
          console.warn('🚫 Cooldown aktif - başvuru engellendi:', { kalanSaat });
          alert(`⚠️ Fazla iptal yaptığınız için geçici olarak başvuru yapamıyorsunuz.\n\n⏳ Kalan süre: ${kalanSaat} saat.\n\nBu süre sonunda tekrar başvuru yapabilirsiniz.`);
          return;
        }
      } catch (err) {
        console.error('Cooldown kontrolü hatası:', err);
      }
    }

    const yeniSefer = {
      yuk: ilan.yuk,
      nereden: ilan.nereden,
      nereye: ilan.nereye,
      ucret: ilan.ucret,
      tarih: ilan.tarih,
      sure: ilan.sure,
      arac_tip: ilan.arac_tip,
      ilan_id: ilan.id,
      plaka: bilgiler.cekiciPlaka || "",
      // Şoförün bilgileri (formdan gelir — işverenin firmaya verdiği personel)
      kamyoncu: bilgiler.ad,
      kamyoncu_tel: bilgiler.tel,
      kamyoncu_tc: bilgiler.tc_kimlik,
      dorse_plaka: bilgiler.dorsePlaka,
      // Hesap sahibi kullanıcı (kim başvurdu) — Seferlerim filtresi için kritik
      kamyoncu_user_id: kamyoncuUserId,
      olusturan: ilan.olusturan,
      olusturan_id: ilan.olusturan_id,
      durum: "bekliyor",
      teslim_tarihi: null,
      belgeler: [],
      odeme_tarihi: null,
      odeme_durumu: "beklemede",
      odeme_turu: ilan.odeme_turu,
      odeme_gun: ilan.odeme_gun,
      iban: oturum?.iban || "",
      iban_sahibi: oturum?.ibanSahibi || oturum?.ad || "",
    };

    if (supabase) {
      const { error } = await supabase.from('seferler').insert([yeniSefer]);
      if (error) {
        console.error("Sefer ekleme hatası:", error);
        // RLS veya başka bir sebeple sefer yazılamadıysa kullanıcıyı bilgilendir,
        // aksi halde başvuru gitmiş gibi görünür ama işveren Teklifler'de göremez.
        alert(`Başvuru kaydedilemedi:\n${error.message || 'Bilinmeyen hata'}\n\nLütfen destek ile iletişime geçin.`);
        return;
      } else {
        console.log('✅ Sefer başarıyla eklendi (işveren Teklifler sekmesinde görecek)');
      }
    }

    // Bildirim oluştur - İşveren için
    if (supabase && ilan.olusturan_id) {
      console.log('🔔 Bildirim oluşturuluyor:', {
        kullanici_id: ilan.olusturan_id,
        tur: 'basvuru',
        baslik: 'Yeni iş başvurusu',
        ilan_id: ilanId
      });
      try {
        await supabase.from('bildirimler').insert({
          kullanici_id: ilan.olusturan_id,
          tur: 'basvuru',
          baslik: 'Yeni iş başvurusu',
          icerik: `${bilgiler.ad} (${bilgiler.tel})\n\n${ilan.yuk} - ${ilan.nereden} → ${ilan.nereye}\n\nÇekici: ${bilgiler.cekiciPlaka}\nDorse: ${bilgiler.dorsePlaka}`,
          ilan_id: ilanId
        });
        console.log('✅ Bildirim başarıyla oluşturuldu');
      } catch (err) {
        console.error('❌ Bildirim oluşturma hatası:', err);
      }
    }

    setSeferler(prev => [yeniSefer, ...prev]);

    // Web Push: yeni başvuru → işverene bildirim
    try {
      await pushGonder({
        hedefKullaniciId: ilan.olusturan_id,
        baslik: "📩 Yeni Başvuru",
        icerik: `${bilgiler.ad} · ${ilan.yuk} · ${ilan.nereden} → ${ilan.nereye}\n\nÇekici: ${bilgiler.cekiciPlaka} · Dorse: ${bilgiler.dorsePlaka}`,
        url: "/#/app?sekme=teklifler",
        zorunlu: false
      });
    } catch (err) {
      console.warn("Başvuru push gönderilemedi:", err);
    }
  }, [ilanlar, supabase, oturum]);

  const ilaniOnayla = useCallback(async (ilanId, kamyoncuAd, kamyoncuTel, plaka, dorsePlaka, tc) => {
    setSeferOnayDurumu(prev => ({
      ...prev,
      [ilanId]: "onaylandı"
    }));

    const ilan = ilanlar.find(i => i.id === ilanId);
    if (!ilan) return;
    console.log('📋 ilaniOnayla - ilan:', {
      id: ilan.id,
      yuklemeKonum: ilan.yuklemeKonum,
      bosaltmaKonum: ilan.bosaltmaKonum,
      yuklemeSaatBas: ilan.yuklemeSaatBas,
      yuklemeSaatBit: ilan.yuklemeSaatBit,
      bosaltmaSaatBas: ilan.bosaltmaSaatBas,
      bosaltmaSaatBit: ilan.bosaltmaSaatBit,
      faturaBaslik: ilan.faturaBaslik
    });

    const mevcutSefer = seferler.find(s => (s.ilan_id === ilanId || s.ilanId === ilanId) && s.durum === "bekliyor");
    if (!mevcutSefer) {
      console.error('❌ ilaniOnayla: bekleyen sefer bulunamadı', { ilanId, seferler: seferler.map(s => ({ id: s.id, ilan_id: s.ilan_id, durum: s.durum })) });
      alert('Başvuru bulunamadı! Sayfayı yenileyip tekrar deneyin.');
      return;
    }
    console.log('✅ Onanacak sefer bulundu:', mevcutSefer.id);

    const guncelSefer = {
      plaka: plaka || mevcutSefer.plaka || mevcutSefer.cekiciPlaka || "",
      dorse_plaka: dorsePlaka || mevcutSefer.dorse_plaka || "",
      kamyoncu: kamyoncuAd,
      kamyoncu_tel: kamyoncuTel,
      kamyoncu_tc: tc,
      durum: "yolda",
      onay_zamani: new Date().toISOString(),
      teslim_tarihi: null,
      belgeler: [],
      odeme_tarihi: null,
      odeme_durumu: "beklemede",
      iban: mevcutSefer.iban || "",
      iban_sahibi: mevcutSefer.iban_sahibi || mevcutSefer.ibanSahibi || "",
    };

    if (supabase) {
      const { error: updErr } = await supabase.from('seferler').update(guncelSefer).eq('id', mevcutSefer.id);
      if (updErr) {
        console.error('❌ Sefer güncellenemedi (RLS?):', updErr);
      }
    }

    setSeferler(prev => prev.map(s => {
      if (s.id === mevcutSefer.id) return { ...s, ...guncelSefer };
      return s;
    }));

    const baslik = `${ilan.yuk} - ${ilan.nereden} → ${ilan.nereye}`;

    // Kamyoncu (hesap sahibi) user_id'sini al.
    // Eski kayıtlar için fallback: tc/telefon ile users tablosundan bul.
    let kamyoncuUserId = mevcutSefer.kamyoncu_user_id || null;
    if (!kamyoncuUserId && supabase) {
      // Önce tc ile dene (tc_kimlik sütunu RLS sonrası gizli olabilir → hata olursa telefon fallback'e geç)
      if (tc) {
        try {
          const { data: u } = await supabase
            .from('users')
            .select('id')
            .eq('tc_kimlik', tc)
            .maybeSingle();
          if (u) { kamyoncuUserId = u.id; console.log('✅ Kamyoncu user bulundu (tc fallback):', kamyoncuUserId); }
        } catch (tcHata) {
          console.warn('⚠️ tc ile kullanıcı bulunamadı (RLS engelleyebilir), telefon ile deneniyor:', tcHata?.message);
        }
      }
      // Sonra telefon ile dene
      if (!kamyoncuUserId && kamyoncuTel) {
        const { data: u } = await supabase
          .from('users')
          .select('id')
          .eq('telefon', kamyoncuTel)
          .maybeSingle();
        if (u) { kamyoncuUserId = u.id; console.log('✅ Kamyoncu user bulundu (telefon fallback):', kamyoncuUserId); }
      }
    }
    if (!kamyoncuUserId) {
      console.warn('⚠️ Kamyoncu user_id bulunamadı — konuşma açılamayacak', {
        kamyoncu_user_id: mevcutSefer.kamyoncu_user_id, tc, kamyoncuTel
      });
    }

    // guncelSefer'e kamyoncu_user_id'yi de ekle (yoksa)
    if (kamyoncuUserId && !guncelSefer.kamyoncu_user_id) {
      guncelSefer.kamyoncu_user_id = kamyoncuUserId;
    }

    // Konuşma oluştur (Supabase)
    let yeniKonusma = null;
    if (supabase && ilan.olusturan_id && kamyoncuUserId) {
      try {
        yeniKonusma = await konusmaAc({
          userId: ilan.olusturan_id,
          partnerId: kamyoncuUserId,
          partnerAd: kamyoncuAd,
          isTrucker: false,
          baslik,
          konusmaTuru: "is",
          ilanId: ilanId,
          resim: "https://api.dicebear.com/7.x/initials/svg?seed=" + kamyoncuAd.substring(0, 2).toUpperCase(),
          bg: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        });
        console.log('✅ Konuşma oluşturuldu/açıldı:', yeniKonusma);
      } catch (err) {
        console.error('❌ Konuşma açılırken hata:', err);
      }
    } else {
      console.warn('⚠️ Konuşma açılamadı:', { olusturan_id: ilan.olusturan_id, kamyoncuUserId });
    }

    // Bildirim oluştur - Kamyoncuya (başvurusu kabul edildi)
    if (supabase && kamyoncuUserId) {
      try {
        const { error: bildirimErr } = await supabase.from('bildirimler').insert({
          kullanici_id: kamyoncuUserId,
          tur: 'sefer_onay',
          baslik: 'Başvurunuz onaylandı!',
          icerik: `${ilan.yuk} - ${ilan.nereden} → ${ilan.nereye}\n\n${kamyoncuAd} için başvurunuz işveren tarafından kabul edildi. Detaylar için konuşmayı kontrol edin.`,
          sefer_id: mevcutSefer.id,
          ilan_id: ilanId
        });
        if (bildirimErr) console.error('Bildirim hatası:', bildirimErr);
      } catch (bildirimErr) {
        console.error('Bildirim hatası:', bildirimErr);
      }
    }

    // Bilgi mesajını konuşmaya gönder (konum, saat, fatura detaylarıyla)
    if (yeniKonusma) {
      let detayMesaji = `✓ Başvurunuz kabul edildi!\n\n👤 ${kamyoncuAd}\n📞 ${kamyoncuTel}\n🚚 ${plaka} / ${dorsePlaka}\n🆔 ${tc}\n\n`;
      if (ilan.yuklemeKonum) detayMesaji += `🔗MAPS:YÜKLEME:${encodeURIComponent(ilan.yuklemeKonum)}\n`;
      if (ilan.yuklemeSaatBas || ilan.yuklemeSaatBit) detayMesaji += `⏰ Yükleme saati: ${ilan.yuklemeSaatBas || "?"} - ${ilan.yuklemeSaatBit || "?"}\n`;
      if (ilan.bosaltmaKonum) detayMesaji += `🔗MAPS:BOŞALTMA:${encodeURIComponent(ilan.bosaltmaKonum)}\n`;
      if (ilan.bosaltmaSaatBas || ilan.bosaltmaSaatBit) detayMesaji += `⏰ Boşaltma saati: ${ilan.bosaltmaSaatBas || "?"} - ${ilan.bosaltmaSaatBit || "?"}\n`;
      if (ilan.faturaBaslik) detayMesaji += `🧾 Fatura: ${ilan.faturaBaslik}\n`;
      detayMesaji += `\nDetaylar için konuşma üzerinden iletişime geçin.`;
      console.log('📤 mesajGonder çağrılıyor:', { konusmaId: yeniKonusma, mesaj: detayMesaji });
      await mesajGonder(yeniKonusma, detayMesaji);
      // Fatura dosyası (fotoğraf/PDF) ayrı mesaj olarak gönder
      if (ilan.faturaDosya && ilan.faturaDosya.veri) {
        const faturaTipi = ilan.faturaDosya.tip === "pdf" ? "pdf" : "img";
        console.log('📎 Fatura dosyası gönderiliyor:', ilan.faturaDosya.ad);
        await mesajGonder(yeniKonusma, "🧾 Fatura dosyası", faturaTipi, ilan.faturaDosya);
      }
      console.log('✅ mesajGonder tamamlandı');
    }

    // Web Push: başvuru onaylandı → kamyoncuya bildirim
    if (kamyoncuUserId) {
      try {
        await pushGonder({
          hedefKullaniciId: kamyoncuUserId,
          baslik: "✅ Başvurunuz Onaylandı",
          icerik: `${ilan.yuk} · ${ilan.nereden} → ${ilan.nereye}\n\nİşveren başvurunuzu kabul etti. Detaylar için konuşmayı açın.`,
          url: "/#/app?sekme=seferler",
          zorunlu: false
        });
      } catch (err) {
        console.warn("Onay push gönderilemedi:", err);
      }
    }
  }, [ilanlar, seferler, konusmaAc, mesajGonder, supabase, oturum]);

  // Red/iptal halinde konuşmadaki konum bilgilerini sil + bilgi mesajı gönder.
  // Kamyoncu, işin reddedildiğini görmeden yola çıkmasın diye konumlar mesajlardan kaldırılır.
  const konumBilgileriniTemizle = useCallback(async (ilanId, ilan) => {
    if (!supabase || !ilanId) return null;
    try {
      const { data: konusma } = await supabase
        .from('conversations')
        .select('id')
        .eq('ilan_id', ilanId)
        .maybeSingle();
      if (!konusma) return null;

      const { data: silinecekler } = await supabase
        .from('messages')
        .select('id')
        .eq('conversation_id', konusma.id)
        .or('metin.like.%MAPS:YÜKLEME:%,metin.like.%MAPS:BOŞALTMA:%');

      if (silinecekler && silinecekler.length > 0) {
        await supabase.from('messages').delete().in('id', silinecekler.map(m => m.id));
        console.log('✅ Konum bilgileri mesajlardan silindi:', silinecekler.length);
      }

      const redMesaji =
        '❌ Başvurunuz reddedildi\n\n' +
        'Bu iş için gönderilen yükleme/boşaltma konumu bilgileri mesajlardan kaldırıldı. ' +
        'Lütfen yola çıkmayın.\n\n' +
        `📦 ${ilan?.yuk || ''} · ${ilan?.nereden || ''} → ${ilan?.nereye || ''}`;
      await mesajGonder(konusma.id, redMesaji);
      return true;
    } catch (err) {
      console.error('Konum bilgisi temizleme hatası:', err);
      return null;
    }
  }, [supabase, mesajGonder]);

  const ilaniReddet = useCallback(async (ilanId) => {
    setSeferOnayDurumu(prev => ({ ...prev, [ilanId]: "reddedildi" }));

    // Seferi veritabanında 'reddedildi' olarak işaretle ki Teklifler sekmesinden kalksın
    const mevcutSefer = seferler.find(s => (s.ilan_id === ilanId || s.ilanId === ilanId) && s.durum === "bekliyor");
    if (!mevcutSefer) {
      console.warn('ilaniReddet: bekleyen sefer bulunamadı, zaten kaldırılmış olabilir', { ilanId });
      return;
    }

    if (supabase) {
      const { error } = await supabase
        .from('seferler')
        .update({ durum: 'reddedildi' })
        .eq('id', mevcutSefer.id);
      if (error) {
        console.error('Sefer reddetme hatası:', error);
        alert(`Reddetme başarısız: ${error.message}`);
        return;
      }
      console.log('✅ Sefer reddedildi:', mevcutSefer.id);
    }

    setSeferler(prev => prev.map(s =>
      s.id === mevcutSefer.id ? { ...s, durum: 'reddedildi' } : s
    ));

    // Bildirim - başvurusu reddedilen kamyoncuya
    if (supabase && mevcutSefer.kamyoncu_user_id) {
      const ilan = ilanlar.find(i => i.id === ilanId || i.id === mevcutSefer.ilan_id);
      try {
        await supabase.from('bildirimler').insert({
          kullanici_id: mevcutSefer.kamyoncu_user_id,
          tur: 'red',
          baslik: 'Başvurunuz reddedildi',
          icerik: `${ilan?.yuk || ''} - ${ilan?.nereden || ''} → ${ilan?.nereye || ''}`,
          ilan_id: ilanId
        });
      } catch (err) {
        console.error('Red bildirimi hatası:', err);
      }
    }

    // Konuşmada gönderilen konum bilgilerini temizle + bilgi mesajı gönder
    const redIlan = ilanlar.find(i => i.id === ilanId || i.id === mevcutSefer.ilan_id);
    await konumBilgileriniTemizle(ilanId, redIlan);
  }, [seferler, supabase, ilanlar, konumBilgileriniTemizle]);

  // Onayı iptal et: seferi tekrar 'bekliyor' durumuna döndür (başvuru listesine geri gelir)
  const ilaniptalEt = useCallback(async (ilanId) => {
    const mevcutSefer = seferler.find(s => (s.ilan_id === ilanId || s.ilanId === ilanId) && s.durum === "yolda");
    if (!mevcutSefer) {
      console.warn('ilaniptalEt: yolda durumunda sefer bulunamadı', { ilanId });
      return false;
    }

    const geriDondur = {
      durum: 'bekliyor',
      onay_zamani: null
    };

    if (supabase) {
      const { error } = await supabase
        .from('seferler')
        .update(geriDondur)
        .eq('id', mevcutSefer.id);
      if (error) {
        console.error('Onay iptal hatası:', error);
        alert(`Onay iptal edilemedi: ${error.message}`);
        return false;
      }
      console.log('✅ Onay iptal edildi (sefer bekliyor durumuna döndü):', mevcutSefer.id);
    }

    setSeferler(prev => prev.map(s =>
      s.id === mevcutSefer.id ? { ...s, ...geriDondur } : s
    ));

    // Bildirim - onayı iptal edilen kamyoncuya
    if (supabase && mevcutSefer.kamyoncu_user_id) {
      const ilan = ilanlar.find(i => i.id === ilanId || i.id === mevcutSefer.ilan_id);
      try {
        await supabase.from('bildirimler').insert({
          kullanici_id: mevcutSefer.kamyoncu_user_id,
          tur: 'onay_iptal',
          baslik: 'Onayınız iptal edildi',
          icerik: `${ilan?.yuk || ''} - ${ilan?.nereden || ''} → ${ilan?.nereye || ''} işiniz için onay iptal edildi.`,
          sefer_id: mevcutSefer.id,
          ilan_id: ilanId
        });
      } catch (err) {
        console.error('Onay iptal bildirimi hatası:', err);
      }
    }

    // Konuşmada gönderilen konum bilgilerini temizle + bilgi mesajı gönder
    const iptalIlan = ilanlar.find(i => i.id === ilanId || i.id === mevcutSefer.ilan_id);
    await konumBilgileriniTemizle(ilanId, iptalIlan);

    return true;
  }, [seferler, supabase, ilanlar, konumBilgileriniTemizle]);

  // Kamyoncu aktif seferini iptal eder (10 dk içinde). Fazla iptal ederse cooldown'a girer.
  const kamyoncuIptalEt = useCallback(async (seferId, sebep) => {
    const sefer = seferler.find(s => s.id === seferId);
    if (!sefer || !oturum?.id) {
      console.warn('kamyoncuIptalEt: sefer veya oturum yok', { seferId });
      return { ok: false };
    }
    const kamyoncuUserId = oturum.id;
    const geriDondur = { durum: 'bekliyor', onay_zamani: null };
    let iptalSayisi = 0;

    if (supabase) {
      const { error } = await supabase
        .from('seferler')
        .update(geriDondur)
        .eq('id', seferId);
      if (error) {
        console.error('Kamyoncu iptal (sefer) hatası:', error);
        alert(`İptal edilemedi: ${error.message}`);
        return { ok: false };
      }
      console.log('✅ Kamyoncu seferi iptal etti (bekliyor durumuna döndü):', seferId);

      // İptal kaydını ekle (abuse takibi)
      const { error: iptalErr } = await kamyoncuIptalEkle(supabase, {
        kullanici_id: kamyoncuUserId, sefer_id: seferId, sebep: sebep || ''
      });
      if (iptalErr) console.error('İptal kaydı hatası:', iptalErr);

      // Son 24 saatteki iptal sayısını hesapla
      const son24Saat = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: iptaller } = await son24SaatIptalleri(supabase, kamyoncuUserId, son24Saat);
      iptalSayisi = iptaller?.length || 0;

      // 24 saatte 3+ iptal → 24 saat cooldown
      if (iptalSayisi >= 3) {
        const cooldownBitis = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        await supabase
          .from('users')
          .update({ iptal_cooldown_bitis: cooldownBitis })
          .eq('id', kamyoncuUserId);
        setOturum(prev => prev ? { ...prev, iptal_cooldown_bitis: cooldownBitis } : prev);
        console.warn('🚨 Kamyoncu cooldown\'a girdi:', { kamyoncuUserId, iptalSayisi });
      }

      // İşverene bildirim
      if (sefer.olusturan_id) {
        try {
          await supabase.from('bildirimler').insert({
            kullanici_id: sefer.olusturan_id,
            tur: 'kamyoncu_iptal',
            baslik: 'Kamyoncu işi iptal etti',
            icerik: `${sefer.yuk} - ${sefer.nereden} → ${sefer.nereye}\n\nSebep: ${sebep || 'Belirtilmedi'}\n\nBaşvuru tekrar listeye döndü.`,
            sefer_id: seferId,
            ilan_id: sefer.ilan_id
          });
        } catch (err) {
          console.error('İptal bildirimi hatası:', err);
        }
      }
    }

    setSeferler(prev => prev.map(s => s.id === seferId ? { ...s, ...geriDondur } : s));

    return { ok: true, iptalSayisi, cooldown: iptalSayisi >= 3 };
  }, [seferler, oturum, supabase]);

  const bekleyenOnaylariGetir = useCallback(() => {
    const onayBekleyenler = [];
    if (seferOnayDurumu && typeof seferOnayDurumu === 'object') {
      Object.entries(seferOnayDurumu).forEach(([ilanId, durum]) => {
        if (durum === "bekliyor_onay") {
          const ilan = ilanlar.find(i => i.id === ilanId);
          if (ilan) {
            const basvuruBilgileri = (kamyoncuBasvuru && kamyoncuBasvuru.ilanId === ilanId)
              ? (kamyoncuBasvuru.bilgiler || kamyoncuBasvuru)
              : null;
            onayBekleyenler.push({
              ilanId,
              yuk: ilan.yuk,
              nereden: ilan.nereden,
              nereye: ilan.nereye,
              bilgiler: basvuruBilgileri,
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
      bilgiler: kamyoncuBasvuru.bilgiler || kamyoncuBasvuru,
    }];
  }, [kamyoncuBasvuru, ilanlar]);

  // ============================================
  // REALTIME SUBSCRIPTIONS
  // Supabase postgres_changes ile tüm tabloları dinle
  // Oturum açıldığında subscribe ol, kapandığında unsubscribe
  // ============================================

  const seferleriYenile = useCallback(async () => {
    if (!supabase) return;
    const { data } = await seferleriGetir(supabase);
    if (data) {
      console.log(`🚚 Seferler güncellendi: ${data.length}`);
      setSeferler(data);
    }
  }, [supabase]);

  useEffect(() => {
    if (!supabase) return;

    console.log('🔔 Realtime subscriptions başlatılıyor...');

    // Helper: tek bir tabloyu dinle, değişiklik olunca callback çalışsın
    const subscribeTable = (tableName, callback, event = '*') => {
      const channel = supabase
        .channel(`realtime-${tableName}`)
        .on('postgres_changes',
          { event, schema: 'public', table: tableName },
          (payload) => {
            console.log(`📡 [${tableName}] değişiklik:`, payload.eventType, payload.new?.id || payload.old?.id);
            try { callback(payload); } catch (e) { console.error(`[${tableName}] callback hatası:`, e); }
          }
        )
        .subscribe();
      return channel;
    };

    // ilanlar değişiklikleri → state'i yeniden yükle
    const ilanlarChannel = subscribeTable('ilanlar', async () => {
      const { data } = await ilanlariGetir(supabase);
      if (data) {
        console.log(`📋 İlanlar realtime güncellendi: ${data.length}`);
        setIlanlar(ilanListesiNormalize(data));
      }
    });

    // seferler değişiklikleri → state'i yeniden yükle
    const seferlerChannel = subscribeTable('seferler', async () => {
      await seferleriYenile();
    });

    // Periyodik yenileme (realtime yedek olarak)
    const yenilemeAraligi = setInterval(async () => {
      await seferleriYenile();
    }, 10000);

    // teklifler değişiklikleri
    const tekliflerChannel = subscribeTable('teklifler', async () => {
      const { data } = await teklifleriGetir(supabase);
      if (data) {
        console.log(`💼 Teklifler realtime güncellendi: ${data.length}`);
        setTeklifler(data);
      }
    });

    // users değişiklikleri
    const usersChannel = subscribeTable('users', async () => {
      const { data } = await kullanicilariGetir(supabase);
      if (data) {
        console.log(`👥 Users realtime güncellendi: ${data.length}`);
        setKullanicilar(data);
      }
    });

    // bildirimler — sadece oturum açıksa ve kendi kullanıcısına ait olanları dinle
    let bildirimlerChannel = null;
    if (oturum?.id) {
      bildirimlerChannel = supabase
        .channel(`realtime-bildirimler-${oturum.id}`)
        .on('postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'bildirimler',
            filter: `kullanici_id=eq.${oturum.id}`
          },
          async (payload) => {
            console.log('🔔 Yeni bildirim (realtime):', payload.new);
            setBildirimlerList(prev => [payload.new, ...(prev || [])]);
            bildirimGoster(payload.new.baslik, payload.new.icerik, '🔔', payload.new.id);
          }
        )
        .subscribe();

      // Ayrıca tüm bildirim listesini de yenile (offscreen durumlar için)
      const refreshBildirimler = async () => {
        const { data } = await bildirimleriGetir(supabase, oturum.id);
        if (data) setBildirimlerList(data);
      };
      refreshBildirimler();

      // RLS sonrası anon seferleri/teklifleri göremez; oturum açılınca ilk veriyi çek
      const refreshTeklifler = async () => {
        const { data } = await teklifleriGetir(supabase);
        if (data) setTeklifler(data);
      };
      refreshTeklifler();
      // "Teklifler" sekmesi seferler tablosunu render ediyor — seferler RLS gerektirdiği
      // için oturum açılmadan önce boş gelir, bu yüzden oturum açılınca yeniden yükle.
      seferleriYenile();
    }

    // Cleanup: tüm kanalları kapat ve intervali temizle
    return () => {
      console.log('🧹 Realtime subscriptions temizleniyor...');
      ilanlarChannel?.unsubscribe();
      seferlerChannel?.unsubscribe();
      tekliflerChannel?.unsubscribe();
      usersChannel?.unsubscribe();
      bildirimlerChannel?.unsubscribe();
      clearInterval(yenilemeAraligi);
    };
  }, [supabase, oturum?.id, seferleriYenile]);

  // =============================================
  // PROFİL GÖRÜNTÜLEME + DEĞERLENDİRME SİSTEMİ
  // =============================================
  const profiliGoster = useCallback((userId) => {
    if (!userId) return;
    setSeciliProfilId(userId);
  }, []);

  const profiliKapat = useCallback(() => setSeciliProfilId(null), []);

  const degerlendirmelerimYenile = useCallback(async () => {
    if (!supabase || !oturum?.id) return;
    try {
      const { data } = await benimDegerlendirmelerimGetir(supabase, oturum.id);
      setBenimDegerlendirmelerim(data || []);
    } catch (err) {
      console.error('Değerlendirmelerim yüklenemedi:', err);
    }
  }, [supabase, oturum?.id]);

  useEffect(() => {
    degerlendirmelerimYenile();
  }, [degerlendirmelerimYenile]);

  const benimDegerlendirdiklerim = useMemo(
    () => new Set(benimDegerlendirmelerim.map(r => r.sefer_id)),
    [benimDegerlendirmelerim]
  );

  const degerlendirmeleriGetir = useCallback(async (hedefId) => {
    if (!supabase || !hedefId) return [];
    try {
      const { data, error } = await degerlendirmeleriGetirApi(supabase, hedefId);
      if (error || !data?.length) {
        if (error) console.error('Değerlendirmeler alınamadı:', error);
        return [];
      }
      const degerlendirenIds = [...new Set(data.map(d => d.degerlendiren_id))];
      const { data: degerlendirenler } = await supabase
        .from('users')
        .select('*')
        .in('id', degerlendirenIds);
      const kullaniciMap = Object.fromEntries((degerlendirenler || []).map(u => [u.id, u]));
      return data.map(d => ({ ...d, degerlendiren: kullaniciMap[d.degerlendiren_id] || null }));
    } catch (err) {
      console.error('Değerlendirmeler alınamadı:', err);
      return [];
    }
  }, [supabase]);

  const degerlendirmeGonder = useCallback(async ({ hedefId, seferId, puan, yorum }) => {
    if (!supabase || !hedefId || !seferId) return { ok: false, error: 'Eksik bilgi' };
    const { data, error } = await degerlendirmeGonderApi(supabase, { hedefId, seferId, puan, yorum });
    if (error) {
      console.error('Değerlendirme gönderilemedi:', error);
      return { ok: false, error: error.message };
    }
    await degerlendirmelerimYenile();
    const { data: usersData } = await kullanicilariGetir(supabase);
    if (usersData) {
      setKullanicilar(usersData);
      setIlanlar(prev => prev.map(i => {
        const u = usersData.find(x => x.id === i.olusturan_id);
        return u ? { ...i, olusturanPuan: u.puan, olusturanOySayisi: u.oy_sayisi } : i;
      }));
    }
    return { ok: true, data };
  }, [supabase, oturum?.id, degerlendirmelerimYenile]);

  return (
    <Ctx.Provider value={{
      oturum, loading, kullanicilar: adminKullanicilar, ilanlar, setIlanlar, seferler, teklifler,
      kayitOl, girisYap, cikisYap,
      ilanEkle, ilanSil, ilanAl, belgeEkle, odemeYap, odemeGunleriniKabulEt, islemiTeslimEt, ibanGuncelle, profilGuncelle, kullaniciBelgesiYukle,
      konusmaOluştur, ilkMesajiGonder,
      seciliProfilId, profiliGoster, profiliKapat,
      benimDegerlendirmelerim, benimDegerlendirdiklerim, degerlendirmelerimYenile,
      degerlendirmeleriGetir, degerlendirmeGonder,
      bildirimler: bildirimlerList, bildirimGoster, bildirimGuncelle, setBildirimlerList, gosterenBildirim, setGosterenBildirim,
      toastBildirim, bildirimiOkunduYap, tumBildirimleriOkunduYap,
      kamyoncuBasvuru, setKamyoncuBasvuru,
      seferOnayDurumu, ilaniOnayla, ilaniReddet, ilaniptalEt, kamyoncuIptalEt,
      bekleyenOnaylariGetir,
      kamyoncuBasvuruBekleyenleriGetir, başvuruGonder,
      ihtilaflar, odemeOnayla, ihtilafAc, ihtilafCoz,
      kullaniciDurumuGuncelle, kullaniciRolunuGuncelle, kullaniciSil,
      ilanDurumuGuncelle, seferDurumuGuncelle, bildirimGonder, duyuruGonder,
    }}>
      {children}
    </Ctx.Provider>
  );
};

export const useApp = () => useContext(Ctx);
