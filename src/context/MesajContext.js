import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";

const Ctx = createContext();

export const MesajProvider = ({ children }) => {
  const [konusmalar, setKonusmalar] = useState([]);
  const [konusmaIDs, setKonusmaIDs] = useState({});
  const konusmaIDsRef = useRef({});
  konusmaIDsRef.current = konusmaIDs;
  const subscribedRef = useRef(false);
  const currentUserIdRef = useRef(null);

  // =============================================
  // LOAD: Supabase'den konuşmaları ve mesajları çek
  // =============================================
  const loadConversations = useCallback(async (userId) => {
    if (!supabase || !userId) return;

    const { data: convs, error } = await supabase
      .from('conversations')
      .select('*')
      .or(`user_id.eq.${userId},partner_id.eq.${userId}`)
      .order('son_guncelleme', { ascending: false });

    if (error) {
      console.error('❌ Konuşmalar yüklenemedi:', error);
      return;
    }

    if (!convs || convs.length === 0) {
      setKonusmalar([]);
      return;
    }

    // Mesajları tek seferde çekelim
    const convIds = convs.map(c => c.id);
    const { data: msgs, error: msgErr } = await supabase
      .from('messages')
      .select('*')
      .in('conversation_id', convIds)
      .order('zaman', { ascending: true });

    if (msgErr) {
      console.error('❌ Mesajlar yüklenemedi:', msgErr);
    }

    // Konuşmaları mesajlarla eşleştir
    const msgsByConv = {};
    (msgs || []).forEach(m => {
      if (!msgsByConv[m.conversation_id]) msgsByConv[m.conversation_id] = [];
      msgsByConv[m.conversation_id].push(m);
    });

    const enriched = convs.map(c => {
      const convMsgs = msgsByConv[c.id] || [];
      // okunmamış sayısı: gonderen !== userId olan ve okundu_zamani null olan
      const okunmamis = convMsgs.filter(m => m.gonderen !== userId && !m.okundu_zamani).length;
      return {
        id: c.id,
        conversationId: c.id,
        user_id: c.user_id,
        partner_id: c.partner_id,
        partnerAd: c.partner_adi,
        partnerRol: c.konusma_turu === 'is' ? (c.user_id === userId ? 'kamyoncu' : 'issiz') : 'sohbet',
        baslik: c.baslik || `${c.partner_adi}`,
        ilan_id: c.ilan_id,
        durum: 'aktif',
        mesajlar: convMsgs.map(m => ({
          id: m.id,
          metin: m.metin,
          veriTipi: m.veri_tipi || 'metin',
          veri: m.veri,
          gonderen: m.gonderen === userId ? 'ben' : 'konusmaci',
          gonderen_id: m.gonderen,
          zaman: m.zaman,
          okundu: !!m.okundu_zamani,
          okunduZamani: m.okundu_zamani
        })),
        okunmamis,
        sonOkuma: c.son_okuma,
        sonGuncelleme: c.son_guncelleme,
        konusmaTuru: c.konusma_turu || 'sohbet',
        resim: c.resim,
        bg: c.bg
      };
    });

    setKonusmalar(enriched);

    // konusmaIDs map'ini güncelle (ilan_id -> conv.id)
    const idsByIlan = {};
    enriched.forEach(k => {
      if (k.ilan_id) idsByIlan[k.ilan_id] = k.id;
    });
    setKonusmaIDs(prev => ({ ...prev, ...idsByIlan }));
  }, []);

  // =============================================
  // REALTIME: yeni mesajları ve konuşmaları dinle
  // =============================================
  const subscribeRealtime = useCallback((userId) => {
    if (!supabase || !userId || subscribedRef.current) return () => {};
    subscribedRef.current = true;

    console.log('🔔 MesajContext realtime subscribe');

    const convChannel = supabase
      .channel('conversations-changes')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'conversations' },
        (payload) => {
          console.log('🔄 Yeni konuşma:', payload.new);
          // Konuşmaları yeniden yükle
          loadConversations(userId);
        }
      )
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
          console.log('🔄 Yeni mesaj:', payload.new);
          const msg = payload.new;
          setKonusmalar(prev => prev.map(k => {
            if (k.id !== msg.conversation_id) return k;
            const gonderen = msg.gonderen === userId ? 'ben' : 'konusmaci';
            // Duplicate kontrol
            if (k.mesajlar.find(m => m.id === msg.id)) return k;
            return {
              ...k,
              mesajlar: [...k.mesajlar, {
                id: msg.id,
                metin: msg.metin,
                veriTipi: msg.veri_tipi || 'metin',
                veri: msg.veri,
                gonderen,
                gonderen_id: msg.gonderen,
                zaman: msg.zaman,
                okundu: !!msg.okundu_zamani,
                okunduZamani: msg.okundu_zamani
              }],
              okunmamis: gonderen === 'konusmaci' && !msg.okundu_zamani ? k.okunmamis + 1 : k.okunmamis,
              sonGuncelleme: msg.zaman
            };
          }));
        }
      )
      .subscribe();

    return () => {
      convChannel.unsubscribe();
      subscribedRef.current = false;
    };
  }, [loadConversations]);

  // =============================================
  // AUTH LISTENER + INITIAL LOAD
  // Oturum açıldığında / sayfa yenilendiğinde konuşmaları yükle
  // =============================================
  useEffect(() => {
    if (!supabase) return;

    // 1) Mevcut session'ı kontrol et (F5 sonrası)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.id) {
        currentUserIdRef.current = session.user.id;
        console.log('📨 MesajContext: initial load for', session.user.id);
        loadConversations(session.user.id);
        subscribeRealtime(session.user.id);
      }
    });

    // 2) Auth state değişikliklerini dinle (giriş/çıkış)
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUserId = session?.user?.id || null;
      if (newUserId !== currentUserIdRef.current) {
        currentUserIdRef.current = newUserId;
        subscribedRef.current = false; // yeni kullanıcı için yeniden subscribe ol
        if (newUserId) {
          console.log('📨 MesajContext: auth changed, loading for', newUserId);
          loadConversations(newUserId);
          subscribeRealtime(newUserId);
        } else {
          setKonusmalar([]);
          setKonusmaIDs({});
        }
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [loadConversations, subscribeRealtime]);

  // =============================================
  // KONUSMA AC: Supabase conversations'a yaz
  // =============================================
  const konusmaAc = useCallback(async (params) => {
    const userId = params.userId;
    const partnerId = params.partnerId;
    const isTrucker = params.isTrucker;

    if (!userId || !partnerId) {
      console.error('konusmaAc: userId veya partnerId eksik', params);
      return null;
    }

    // Eğer ilan_id verilmişse, mevcut konuşma var mı kontrol et
    if (params.ilanId && supabase) {
      const { data: existing } = await supabase
        .from('conversations')
        .select('*')
        .eq('ilan_id', params.ilanId)
        .maybeSingle();

      if (existing) {
        console.log('✅ Mevcut konuşma bulundu:', existing.id);
        // konusmaIDs'e map'le
        setKonusmaIDs(prev => ({ ...prev, [params.ilanId]: existing.id }));
        return existing.id;
      }
    }

    // Yeni konuşma oluştur
    const insertData = {
      user_id: userId,
      partner_id: partnerId,
      partner_adi: params.partnerAd || 'Kullanıcı',
      partner_resim: params.resim || null,
      konusma_turu: params.konusmaTuru || 'is',
      resim: params.resim || null,
      bg: params.bg || null,
      baslik: params.baslik || null,
      ilan_id: params.ilanId || null,
      mesajlar: [],
      son_guncelleme: new Date().toISOString()
    };

    if (supabase) {
      const { data, error } = await supabase
        .from('conversations')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('❌ Konuşma oluşturulamadı:', error);
        return null;
      }

      console.log('✅ Yeni konuşma oluşturuldu:', data.id);
      if (params.ilanId) {
        setKonusmaIDs(prev => ({ ...prev, [params.ilanId]: data.id }));
      }
      // Konuşma listesini yeniden yükle ki yeni konuşma görünsün
      // (realtime yetişmeyebilir)
      const uid = params.userId || currentUserIdRef.current;
      if (uid) {
        loadConversations(uid);
      }
      return data.id;
    }

    // Supabase yoksa fallback (local)
    const fallbackId = `local_${Date.now()}`;
    return fallbackId;
  }, [loadConversations]);

  // =============================================
  // MESAJ GONDER: Supabase messages'a yaz
  // =============================================
  const mesajGonder = useCallback(async (konusmaId, metin, veriTipi = 'metin', veri = null) => {
    if (!konusmaId || !metin) return;

    // Local state güncelle (optimistic)
    setKonusmalar(prev => prev.map(k => {
      if (k.id !== konusmaId) return k;
      return {
        ...k,
        mesajlar: [...k.mesajlar, {
          id: `temp_${Date.now()}`,
          metin,
          veriTipi,
          veri,
          gonderen: 'ben',
          zaman: new Date().toISOString(),
          okundu: false
        }],
        sonGuncelleme: new Date().toISOString()
      };
    }));

    if (supabase) {
      // Konuşmanın user_id'sini bul (gonderen = user_id)
      const { data: conv } = await supabase
        .from('conversations')
        .select('user_id, partner_id')
        .eq('id', konusmaId)
        .maybeSingle();

      if (!conv) {
        console.error('Mesaj gönderilemedi: konuşma bulunamadı');
        return;
      }

      // Gönderen = konuşmayı açan kişi (user_id).
      // Not: İşveren "kabul et" yaptığında user_id = işveren, mesajları işveren olarak gönderir.
      // Bu basit model - gerçek uygulamada gonderen login olan kullanıcı.
      const { data: msgRow, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: konusmaId,
          gonderen: conv.user_id,
          metin,
          veri_tipi: veriTipi,
          veri: veri || null
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Mesaj Supabase\'e yazılamadı:', error);
        return;
      }

      // son_guncelleme'i güncelle
      await supabase
        .from('conversations')
        .update({ son_guncelleme: new Date().toISOString() })
        .eq('id', konusmaId);

      // Local optimistic mesajı gerçek ID ile değiştir
      setKonusmalar(prev => prev.map(k => {
        if (k.id !== konusmaId) return k;
        return {
          ...k,
          mesajlar: k.mesajlar.map(m =>
            m.id.startsWith('temp_') && m.metin === metin
              ? { ...m, id: msgRow.id }
              : m
          )
        };
      }));
    }
  }, []);

  // =============================================
  // OKUNDU İŞARETLE
  // =============================================
  const tumMesajlariOkundu = useCallback(async (konusmaId) => {
    setKonusmalar(prev => prev.map(k => {
      if (k.id !== konusmaId) return k;
      return { ...k, mesajlar: k.mesajlar.map(m => ({ ...m, okundu: true })), okunmamis: 0 };
    }));

    if (supabase) {
      await supabase
        .from('messages')
        .update({ okundu_zamani: new Date().toISOString() })
        .eq('conversation_id', konusmaId)
        .is('okundu_zamani', null);

      await supabase
        .from('conversations')
        .update({ son_okuma: new Date().toISOString() })
        .eq('id', konusmaId);
    }
  }, []);

  // =============================================
  // GERİ UYUMLULUK İÇİN ESKİ API (no-op)
  // =============================================
  const mesajGonderildi = useCallback(() => {}, []);
  const mesajiOkundu = useCallback(() => {}, []);
  const konusmaKapat = useCallback(() => {}, []);
  const konusmaSil = useCallback((konusmaId) => {
    setKonusmalar(prev => prev.filter(k => k.id !== konusmaId));
  }, []);
  const konusmaTemizle = useCallback(() => {}, []);
  const konusmaDurumunuGuncelle = useCallback(() => {}, []);
  const konusmaBasliginiGuncelle = useCallback(() => {}, []);
  const yaziyorGoster = useCallback(() => {}, []);
  const konusmaResmiGuncelle = useCallback(() => {}, []);
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
  const kullanicininKimlikNumarasi = useCallback((telefon) => `user_${telefon.replace(/\D/g, "")}`, []);
  const konusmaIDsi = useCallback((partnerId) => konusmaIDsRef.current[partnerId], []);
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
      konusmaTemizle,
      loadConversations,
      subscribeRealtime
    }}>
      {children}
    </Ctx.Provider>
  );
};

export const useMesaj = () => useContext(Ctx);
