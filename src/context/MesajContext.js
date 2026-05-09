import { createContext, useContext, useState, useCallback, useRef } from "react";

const Ctx = createContext();

export const MesajProvider = ({ children }) => {
  const [konusmalar, setKonusmalar] = useState([]);
  const [konusmaIDs, setKonusmaIDs] = useState({});
  const konusmaIDsRef = useRef(konusmaIDs);
  konusmaIDsRef.current = konusmaIDs;

  const konusmaAc = useCallback((params) => {
    setKonusmalar(prev => {
      const partnerId = params.partnerId || params.employerId || params.truckerId;
      const employerId = params.employerId;
      const truckerId = params.truckerId;
      const isTrucker = params.isTrucker;

      // Her konuşma için benzersiz ID oluştur
      const konusmaId = params.conversationId || `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const konusmaIDsi = `conv_${partnerId}_${isTrucker ? "truck" : "employ"}`;

      const mevcut = prev.find(k => k.conversationId === konusmaIDsi);
      if (mevcut) {
        return prev.map(k => k.id === mevcut.id ? { ...k, ...params } : k);
      }

      const yeniKonusma = {
        id: konusmaId,
        conversationId: konusmaIDsi,
        partnerId,
        partnerAd: params.partnerAd,
        partnerRol: params.partnerRol || (isTrucker ? "kamyoncu" : "issiz"),
        isTrucker,
        baslik: params.baslik,
        durum: "aktif",
        mesajlar: [],
        okunmamis: 0,
        sonOkuma: new Date().toISOString(),
        sonGuncelleme: new Date().toISOString(),
        konusmaDurumu: "açıldı",
        konusmaTuru: params.konusmaTuru || "sohbet",
        resim: params.resim,
        bg: params.bg
      };

      return [yeniKonusma, ...prev];
    });
  }, []);

  const mesajGonder = useCallback((konusmaId, metin, veriTipi = "metin", veri = null) => {
    setKonusmalar(prev => prev.map(k => {
      if (k.id !== konusmaId) return k;

      const yeniMesaj = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        metin,
        veriTipi,
        veri,
        gonderen: "ben",
        zaman: new Date().toISOString(),
        okundu: false,
        okunduZamani: null,
        isTrucker: k.isTrucker
      };

      return {
        ...k,
        mesajlar: [...k.mesajlar, yeniMesaj],
        okunmamis: k.okunmamis + 1,
        sonGuncelleme: new Date().toISOString(),
        yaziyor: false
      };
    }));
  }, []);

  const mesajGonderildi = useCallback((konusmaId, mesajId) => {
    setKonusmalar(prev => prev.map(k => {
      if (k.id !== konusmaId) return k;
      return {
        ...k,
        mesajlar: k.mesajlar.map(m => m.id === mesajId ? { ...m, gonderen: "konusmaci" } : m)
      };
    }));
  }, []);

  const mesajiOkundu = useCallback((konusmaId, mesajId) => {
    setKonusmalar(prev => prev.map(k => {
      if (k.id !== konusmaId) return k;
      return {
        ...k,
        mesajlar: k.mesajlar.map(m => {
          if (m.id === mesajId && !m.okundu) {
            return { ...m, okundu: true, okunduZamani: new Date().toISOString() };
          }
          return m;
        }),
        okunmamis: Math.max(0, k.okunmamis - 1),
        sonOkuma: new Date().toISOString()
      };
    }));
  }, []);

  const tumMesajlariOkundu = useCallback((konusmaId) => {
    setKonusmalar(prev => prev.map(k => {
      if (k.id !== konusmaId) return k;
      return {
        ...k,
        mesajlar: k.mesajlar.map(m => ({ ...m, okundu: true })),
        okunmamis: 0
      };
    }));
  }, []);

  const konusmaKapat = useCallback((konusmaId) => {
    setKonusmalar(prev => prev.map(k => k.id === konusmaId ? { ...k, durum: "kapatildi" } : k));
  }, []);

  const konusmaSil = useCallback((konusmaId) => {
    setKonusmalar(prev => prev.filter(k => k.id !== konusmaId));
  }, []);

  const konusmaTemizle = useCallback((konusmaId) => {
    setKonusmalar(prev => prev.map(k => {
      if (k.id === konusmaId) {
        return {
          ...k,
          mesajlar: [],
          okunmamis: 0,
          sonGuncelleme: new Date().toISOString()
        };
      }
      return k;
    }));
  }, []);

  const konusmaDurumunuGuncelle = useCallback((konusmaId, durum) => {
    setKonusmalar(prev => prev.map(k => k.id === konusmaId ? { ...k, konusmaDurumu: durum } : k));
  }, []);

  const konusmaBasliginiGuncelle = useCallback((konusmaId, baslik) => {
    setKonusmalar(prev => prev.map(k => k.id === konusmaId ? { ...k, baslik } : k));
  }, []);

  const yaziyorGoster = useCallback((konusmaId, ad, goster) => {
    setKonusmalar(prev => prev.map(k => k.id === konusmaId ? { ...k, yaziyor: goster, yaziyorAd: ad } : k));
  }, []);

  const konusmaResmiGuncelle = useCallback((konusmaId, resim) => {
    setKonusmalar(prev => prev.map(k => k.id === konusmaId ? { ...k, resim } : k));
  }, []);

  const dosyaYukle = useCallback((dosya) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve({
          tip: dosya.type.startsWith("image/") ? "img" : dosya.type === "application/pdf" ? "pdf" : "dosya",
          ad: dosya.name,
          veri: e.target.result,
          boyut: dosya.size
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(dosya);
    });
  }, []);

  // Kullanıcı ID'si oluştur - gerçek uygulamada Firebase/Supabase'den gelecek
  const kullanicininKimlikNumarasi = useCallback((telefon) => {
    // Telefon numarası üzerinden benzersiz ID oluştur
    return `user_${telefon.replace(/\D/g, "")}`;
  }, []);

  const konusmaIDsi = useCallback((partnerId) => {
    return konusmaIDsRef.current[partnerId];
  }, []);

  const konusmaIDsiniKaydet = useCallback((partnerId, konusmaId) => {
    setKonusmaIDs(prev => ({ ...prev, [partnerId]: konusmaId }));
  }, []);

  return (
    <Ctx.Provider value={{
      konusmalar,
      konusmaAc,
      mesajGonder,
      mesajGonderildi,
      mesajiOkundu,
      tumMesajlariOkundu,
      konusmaKapat,
      konusmaSil,
      konusmaDurumunuGuncelle,
      konusmaBasliginiGuncelle,
      konusmaResmiGuncelle,
      dosyaYukle,
      konusmaIDsi,
      konusmaIDsiniKaydet,
      yaziyorGoster,
      konusmaTemizle
    }}>
      {children}
    </Ctx.Provider>
  );
};

export const useMesaj = () => useContext(Ctx);
