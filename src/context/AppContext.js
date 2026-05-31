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

// Check if Supabase client is initialized on app start
initSupabase();

const Ctx = createContext();

export const AppProvider = ({ children }) => {
  const mesajContext = useMesaj();
  const [loading, setLoading] = useState(true);

  // Load initial data from Supabase on mount
  useEffect(() => {
    const loadInitialData = async () => {
      if (!supabase) {
        console.warn('⚠️ Supabase yok! Lütfen Supabase URL ve key ayarlayın.');
        setLoading(false);
        return;
      }

      try {
        let ilanlarData = null;
        let seferlerData = null;
        let tekliflerData = null;
        let usersData = null;

        // Fetch ilanlar
        const { data: ilanlarRes, error: ilanlarError } = await supabase
          .from('ilanlar')
          .select('*')
          .order('tarih', { ascending: false })
          .limit(50);

        if (!ilanlarError && ilanlarRes) {
          console.log(`✅ ${ilanlarRes.length} ilan yüklendi`);
          ilanlarData = ilanlarRes;
        } else {
          console.error('❌ İlanlar yüklenemedi');
        }

        // Fetch seferler
        const { data: seferlerRes, error: seferlerError } = await supabase
          .from('seferler')
          .select('*')
          .order('tarih', { ascending: false })
          .limit(50);

        if (!seferlerError && seferlerRes) {
          console.log(`✅ ${seferlerRes.length} sefer yüklendi`);
          seferlerData = seferlerRes;
        } else {
          console.error('❌ Seferler yüklenemedi');
        }

        // Fetch teklifler
        const { data: tekliflerRes, error: tekliflerError } = await supabase
          .from('teklifler')
          .select('*');

        if (!tekliflerError && tekliflerRes) {
          console.log(`✅ ${tekliflerRes.length} teklif yüklendi`);
          tekliflerData = tekliflerRes;
        } else {
          console.error('❌ Teklifler yüklenemedi');
        }

        // Fetch users
        const { data: usersRes, error: usersError } = await supabase
          .from('users')
          .select('*');

        if (!usersError && usersRes) {
          console.log(`✅ ${usersRes.length} kullanıcı yüklendi`);
          usersData = usersRes;
        } else {
          console.error('❌ Kullanıcılar yüklenemedi');
        }

        // Set the fetched data
        if (ilanlarData) setIlanlar(ilanlarData);
        if (seferlerData) setSeferler(seferlerData);
        if (tekliflerData) setTeklifler(tekliflerData);
        if (usersData) setKullanicilar(usersData);

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

  useEffect(() => {
    initSupabase();

    // Session'ı yükle
    if (supabase && supabase.auth) {
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        console.log('🔐 Session yüklendi:', session ? '✅ Var' : '❌ Yok');

        if (session) {
          try {
            // Güncel user verisini çek
            console.log('🔐 Session ID:', session.user.id);
            const { data: userData, error } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();

            if (error) {
              console.error('❌ User fetch error after session load:', error);
              // Session var ama user yoksa oturumu temizle
              await supabase.auth.signOut();
            } else if (userData) {
              console.log('✅ User verisi alındı:', userData);
              setOturum(userData);
            } else {
              console.error('❌ User yok! Session ID:', session.user.id);
            }
          } catch (err) {
            console.error('❌ Error fetching user after session load:', err);
          }
        } else {
          console.log('⚠️ Session yok');
        }

        console.log('🚀 Loading tamamlandı, oturum:', oturum);
        setLoading(false);
      }).catch((error) => {
        console.error('❌ Session yükleme hatası:', error);
        setLoading(false);
      });
    } else {
      console.warn('⚠️ Supabase client yok, Demo modu');
      setLoading(false);
    }
  }, [supabase]);

  // Polling ile veri güncellemesi
  useEffect(() => {
    if (!supabase) {
      console.warn('⚠️ Supabase yok, Polling başlatılamıyor')
      return
    }

    console.log('📡 Polling başlatılıyor (3 saniyede bir kontrol)...')

    const cleanup1 = subscribeToIlanlar()
    const cleanup2 = subscribeToSeferler()
    const cleanup3 = subscribeToTeklifler()
    const cleanup4 = subscribeToConversations()

    return () => {
      cleanup1?.()
      cleanup2?.()
      cleanup3?.()
      cleanup4?.()
      console.log('🧹 Polling temizleniyor...')
    }
  }, [supabase])

  const [oturum, setOturum] = useState(null);
  const [kullanicilar, setKullanicilar] = useState([]);
  const [ilanlar, setIlanlar] = useState([]);
  const [seferler, setSeferler] = useState([]);
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
    console.log("📥 kayitOl fonksiyonuna gelen bilgiler:", bilgiler);
    console.log("🎭 Rol kontrolü:", bilgiler.rol, typeof bilgiler.rol);

    if (!bilgiler.rol) {
      console.error("❌ Rol bilgisi eksik!");
      throw new Error("Rol bilgisi eksik. Lütfen kayıt olurken rol seçin.");
    }

    if (!supabase) {
      console.warn("⚠️ Supabase kurulumu yapılmadı!");
      throw new Error("Supabase kurulumu yapılmadı. Lütfen .env dosyasını kontrol edin.");
    }

    try {
      // Sadece telefon ve şifre form'dan geliyor
      const telefon = bilgiler.telefon;
      const password = bilgiler.sifre; // Kullanıcı formdan girdiği şifre

      console.log("📱 Telefon:", telefon);
      console.log("🔑 Şifre:", password ? "✓ Set" : "✗ Boş");
      console.log("👤 Ad:", bilgiler.ad);
      console.log("🆔 TC:", bilgiler.tc_kimlik);
      console.log("🎭 Rol:", bilgiler.rol, typeof bilgiler.rol);

      if (!telefon || telefon.length < 10) {
        throw new Error("Geçerli telefon numarası girin");
      }

      if (!password || password.length < 6) {
        throw new Error("Şifre en az 6 karakter olmalı");
      }

      // Telefon numarasına göre önce user olup olmadığına bak
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('*')
        .eq('telefon', telefon)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        throw new Error("Kullanıcı kontrol hatası: " + checkError.message);
      }

      if (existingUser) {
        throw new Error("Bu telefon numarası ile zaten kayıtlısınız.");
      }

      // Email olarak telefon numarasını kullan
      const email = `${telefon}@nakliyol.com`;

      let userId = null;
      let authSession = null;

      try {
        // 1. First try to create user in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password
        });

        if (authError) {
          console.warn("⚠️ Supabase Auth hatası:", authError.message);

          if (authError.message.includes("rate limit")) {
            // Rate limit varsa kullanıcı oluştur ama auth olmadan
            const { data: userData, error: userError } = await supabase.from('users').insert([{
              email: email,
              role: bilgiler.rol || "issiz",
              ad: bilgiler.ad,
              tc_kimlik: bilgiler.tc,
              telefon: telefon
            }]).select().single();

            if (userError) throw new Error("Kayıt hatası: " + userError.message);

            userId = userData.id;
            console.log("✅ Local kayıt başarılı (Auth rate limit dolu)");
          } else if (authError.message.includes("already registered") || authError.message.includes("User already registered")) {
            // Email zaten var, önce users tablosundan bulalım
            const { data: existingUser } = await supabase
              .from('users')
              .select('*')
              .eq('email', email)
              .maybeSingle();

            if (existingUser) {
              userId = existingUser.id;
              console.log("✅ Kullanıcı mevcut, ID:", userId);
              console.log("🎭 Mevcut rol:", existingUser.role);

              // Email ile giriş yap
              const { data: authUser, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password
              });

              if (signInError) {
                throw new Error("Şifre yanlış. Lütfen kontrol edin.");
              }

              if (authUser?.session) {
                authSession = authUser.session;

                // User rolünü kontrol et, yoksa Supabase'den tekrar çek
                if (!existingUser.role) {
                  console.log("⚠️ Rol boş, Supabase'den yeniden çekiliyor...");
                  const { data: freshUser } = await supabase
                    .from('users')
                    .select('role, ad, tc_kimlik, telefon')
                    .eq('id', userId)
                    .single();

                  if (freshUser && freshUser.role) {
                    setOturum({
                      id: userId,
                      email: freshUser.email || email,
                      role: freshUser.role,
                      ad: freshUser.ad || bilgiler.ad,
                      tc_kimlik: freshUser.tc_kimlik || bilgiler.tc,
                      telefon: freshUser.telefon || telefon
                    });
                    console.log("✅ Rol güncellendi:", freshUser.role);
                  } else {
                    // Veritabanında rol yoksa kullanıcı kaydet
                    await supabase.from('users').update({
                      role: bilgiler.rol || "issiz",
                      ad: bilgiler.ad,
                      tc_kimlik: bilgiler.tc
                    }).eq('id', userId);
                    console.log("✅ Rol Supabase'e kaydedildi:", bilgiler.rol);
                  }
                } else {
                  // Mevcut rolü kullan
                  setOturum({
                    id: userId,
                    email: existingUser.email || email,
                    role: existingUser.role,
                    ad: existingUser.ad || bilgiler.ad,
                    tc_kimlik: existingUser.tc_kimlik || bilgiler.tc,
                    telefon: existingUser.telefon || telefon
                  });
                  console.log("✅ Mevcut rol kullanılıyor:", existingUser.role);
                }
              } else {
                throw new Error("Giriş başarısız. Lütfen kontrol edin.");
              }
            } else {
              // Users tablosunda yok ama auth'da var - onu oluştur
              const { data: authUser } = await supabase.auth.signInWithPassword({
                email,
                password
              });

              if (authUser?.session) {
                userId = authUser.user.id;
                authSession = authUser.session;

                const { error: insertError } = await supabase.from('users').insert([{
                  id: userId,
                  email: email,
                  role: bilgiler.rol || "issiz",
                  ad: bilgiler.ad,
                  tc_kimlik: bilgiler.tc,
                  telefon: telefon
                }]).select().single();

                if (insertError) throw insertError;
              } else {
                throw new Error("Giriş başarısız. Lütfen kontrol edin.");
              }
            }
          } else {
            throw new Error("Kayıt hatası: " + authError.message);
          }
        } else {
          // Auth başarılı
          userId = authData.user?.id;
          authSession = authData.session;

          // 2. Then insert user data to users table
          const { data: userData, error: userError } = await supabase.from('users').insert([{
            id: userId,
            email: email,
            role: bilgiler.rol || "issiz",
            ad: bilgiler.ad,
            tc_kimlik: bilgiler.tc,
            telefon: telefon
          }]).select().single();

          console.log("💾 Veritabanına kaydedilen veri:", userData);
          console.log("🎭 Kaydedilen rol:", userData?.role);

          if (userError) {
            console.error("Kullanıcı tablosu hatası, devam etmeyi dene:", userError);
            // Kullanıcı tablosunda hata olsa bile devam et
          }

          console.log("✅ Auth ve database kayıtları oluşturuldu");
        }
          // Kayıttan sonra Supabase'den son kullanıcıyı çek ve rolü kontrol et
          try {
            const { data: freshUserData } = await supabase
              .from('users')
              .select('*')
              .eq('id', userId)
              .single();

            if (freshUserData && freshUserData.role) {
              setOturum(freshUserData);
              return freshUserData;
            }
          } catch (error) {
            console.error("Kayıt sonrası kullanıcı çekme hatası:", error);
          }
      } catch (authError) {
        console.error("Auth işlemi hatası:", authError);
        throw authError;
      }

      // Son kullanıcıyı çek veya oturumu kullan
      let finalUser;

      if (userId && authSession) {
        // Kayıttan önce Supabase'den son kullanıcıyı çek ve doğru rolü kullan
        try {
          const { data: freshUserData } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

          if (freshUserData && freshUserData.role) {
            finalUser = freshUserData;
            setOturum(freshUserData);
            return freshUserData;
          }
        } catch (error) {
          console.error("Son kullanıcı çekme hatası:", error);
        }

        // Eğer Supabase'de yoksa kaydettiğimiz veriyi kullan
        finalUser = {
          id: userId,
          email: email,
          role: bilgiler.rol || "issiz",
          ad: bilgiler.ad,
          tc_kimlik: bilgiler.tc,
          telefon: telefon,
          session: authSession
        };
        setOturum(finalUser);
        console.log("✅ Kayıt başarılı ve oturum oluşturuldu");
        return finalUser;
      } else if (userId) {
        // Sadece user var
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();

        if (userData) {
          finalUser = userData;
          setOturum(userData);
          console.log("✅ Kayıt başarılı (sadece user var)");
          return userData;
        }
      }

      throw new Error("Kullanıcı oluşturulamadı. Lütfen daha sonra tekrar deneyin.");
    } catch (error) {
      console.error("Kayıt hatası:", error);
      throw error;
    }
  }, [supabase]);

  const girisYap = useCallback(async (telefon, sifre) => {
    if (!supabase) {
      console.warn("⚠️ Supabase yok!");
      throw new Error("Supabase kurulumu yapılmadı.");
    }

    try {
      console.log("🔐 Giriş başlatılıyor:", telefon);

      // Önce telefon numarasına göre kullanıcıyı bul
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('telefon', telefon)
        .maybeSingle();

      if (userError) {
        if (userError.code === 'PGRST116') {
          throw new Error("Telefon numarası kayıtlı değil. Önce kayıt olun.");
        }
        console.error("User fetch hatası:", userError);
        throw new Error("Kullanıcı bulunamadı. Lütfen kontrol edin.");
      }

      if (!userData) {
        throw new Error("Telefon numarası kayıtlı değil. Önce kayıt olun.");
      }

      const email = userData.email;

      // Supabase Auth ile giriş yap
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: sifre
      });

      if (error) {
        console.error("Supabase Auth hatası:", error);

        if (error.message.includes("Invalid login credentials") ||
            error.message.includes("Invalid API key") ||
            error.message.includes("User not found")) {
          throw new Error("Telefon numarası veya şifre yanlış. Lütfen kontrol edin.");
        }

        if (error.message.includes("Email not confirmed")) {
          throw new Error("E-posta adresi doğrulanmamış. Lütfen e-posta onayını kontrol edin.");
        }

        throw new Error("Giriş başarısız: " + error.message);
      }

      if (!data || !data.session || !data.user) {
        throw new Error("Oturum oluşturulamadı. Lütfen daha sonra tekrar deneyin.");
      }

      console.log("✅ Giriş başarılı, session:", data.session.access_token ? "var" : "yok");

      // Güncel user verisini al (supabase'den gelen fresh data)
      const { data: freshUserData, error: freshError } = await supabase
        .from('users')
        .select('*')
        .eq('telefon', telefon)
        .single();

      if (freshError) {
        console.error("User data fetch hatası:", freshError);
        // Session varsa user bilgilerini kullan, yoksa devam et
      }

      if (freshUserData) {
        setOturum(freshUserData);
        return freshUserData;
      }

      // Session varsa oturumu oluştur
      setOturum({
        ...data.user,
        role: userData.role,
        ad: userData.ad,
        tc_kimlik: userData.tc_kimlik,
        email: email,
        session: data.session
      });
      return { ...data.user, role: userData.role };

    } catch (error) {
      console.error("Giriş hatası:", error);
      throw error;
    }
  }, [supabase]);

  const cikisYap = useCallback(async () => {
    try {
      if (supabase) {
        console.log('🔐 Çıkış yapılıyor...');
        await supabase.auth.signOut();
        console.log('✅ Çıkış başarılı');
      }
      setOturum(null);
      // Session yenileme
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Çıkış hatası:', error);
      // Hata olsa bile oturumu temizle
      setOturum(null);
    }
    }, [supabase]);

  const sifreSifirla = useCallback(async (email) => {
    if (!supabase) {
      throw new Error("Supabase kurulumu yapılmadı.");
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/sifre-sifirla`
    });

    if (error) throw error;
  }, [supabase]);

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
      kamyoncu_tc: bilgiler.tc_kimlik,
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

  const ilaniOnayla = useCallback(async (ilanId, kamyoncuAd, kamyoncuTel, plaka, dorsePlaka, tc) => {
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
      kamyoncu_tc: tc,
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
      mesajContext.mesajGonder(yeniKonusma, `✓ İş başvurunuz kabul edildi. Gelen bilgiler:\n\n👤 Ad: ${kamyoncuAd}\n📞 Tel: ${kamyoncuTel}\n🚚 Çekici Plaka: ${plaka}\n🚐 Dorse Plaka: ${dorsePlaka}\n🆔 TC Kimlik: ${tc}\n\nŞimdi convo üzerinden konuşabiliriz.`);
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
    if (!supabase) return null;

    // Polling ile veri güncellemesi
    const interval = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from('ilanlar')
          .select('*')

        if (error) throw error
        if (data) {
          // Normalize data for display
          const normalizedData = data.map(item => ({
            ...item,
            toplamUcret: item.toplam_ucret,
            kdvOrani: item.kdv_orani,
            kdvTutari: item.kdv_tutari,
            aracTip: item.arac_tip,
            odemeTuru: item.odeme_turu,
            odemeGun: item.odeme_gun,
            olusturanPuan: item.olusturan?.puan || 5.0
          }));
          setIlanlar(normalizedData)
          console.log('✅ İlanlar güncellendi (Polling)')
        }
      } catch (error) {
        console.error('❌ İlanlar güncellemesi başarısız:', error)
      }
    }, 3000) // 3 saniyede bir kontrol et

    return () => {
      clearInterval(interval)
      console.log('🧹 İlanlar Polling temizlendi')
    }
  };

  const subscribeToSeferler = () => {
    if (!supabase) return null;

    const interval = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from('seferler')
          .select('*')

        if (error) throw error
        if (data) {
          setSeferler(data)
          console.log('✅ Seferler güncellendi (Polling)')
        }
      } catch (error) {
        console.error('❌ Seferler güncellemesi başarısız:', error)
      }
    }, 3000)

    return () => {
      clearInterval(interval)
      console.log('🧹 Seferler Polling temizlendi')
    }
  };

  const subscribeToTeklifler = () => {
    if (!supabase) return null;

    const interval = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from('teklifler')
          .select('*')

        if (error) throw error
        if (data) {
          setTeklifler(data)
          console.log('✅ Teklifler güncellendi (Polling)')
        }
      } catch (error) {
        console.error('❌ Teklifler güncellemesi başarısız:', error)
      }
    }, 3000)

    return () => {
      clearInterval(interval)
      console.log('🧹 Teklifler Polling temizlendi')
    }
  };

  const subscribeToConversations = () => {
    if (!supabase) return null;

    const interval = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from('conversations')
          .select('*')

        if (error) throw error
        if (data) {
          console.log('✅ Konuşmalar güncellendi (Polling)')
          setKonusmalar(data)
        }
      } catch (error) {
        console.error('❌ Konuşmalar güncellemesi başarısız:', error)
      }
    }, 3000)

    return () => {
      clearInterval(interval)
      console.log('🧹 Konuşmalar Polling temizlendi')
    }
  };

  return (
    <Ctx.Provider value={{
      oturum, kullanicilar: adminKullanicilar, ilanlar, seferler, teklifler,
      kayitOl, girisYap, cikisYap,
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
