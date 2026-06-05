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

  // State'leri başlat
  const [oturum, setOturum] = useState(null);
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
    console.log('🔐 Çıkış yapılıyor...');
    try {
      if (supabase) {
        await supabase.auth.signOut();
        console.log('✅ Supabase signOut başarılı');
      }
    } catch (error) {
      console.error('Supabase signOut hatası (yine de devam):', error);
    }

    // React state'i temizle
    setOturum(null);

    // HashRouter URL'i ne olursa olsun, anasayfaya tam yenilemeyle dön.
    // pathname '/' + hash '#/app' olabilir → replace ile birlikte URL '/' olur.
    // window.location.replace, tarayıcı history'sine bile eklemeden tam yenileme yapar.
    try {
      const target = window.location.origin + window.location.pathname;
      if (window.location.hash || window.location.href !== target) {
        window.location.replace(target);
      }
    } catch (e) {
      console.error('Navigate hatası:', e);
      // son çare: sayfayı yenile, AppIceriki zaten Navigate to="/" yapacak
      window.location.reload();
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
    // SOFT-DELETE: ilanlar tablosundan satırı silmiyoruz, sadece durum='silindi' yapıyoruz.
    // Neden? Çünkü seferler.ilan_id ON DELETE CASCADE — eğer hard-delete yaparsak
    // kamyoncunun o ilandan yaptığı sefer de DB seviyesinde silinir, geçmiş kaybolur.
    // Soft-delete sayesinde:
    //   - Kamyoncu seferini korur (CASCADE tetiklenmez)
    //   - İşveren "Geçmiş İşler" bölümünden ilan/sefer geçmişine ulaşabilir
    //   - RLS "Public can view active ilans" sayesinde diğer kamyoncular silinen ilanı göremez
    if (supabase) {
      const { error } = await supabase
        .from('ilanlar')
        .update({ durum: 'silindi' })
        .eq('id', id);
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
          rol: oturum.rol,
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
    mesajContext.loadConversations(oturum.id);
    const unsubscribe = mesajContext.subscribeRealtime(oturum.id);
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
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
        console.warn("⚠️ Profil güncelleme hatası:", error.message);
        // Local state yine de güncelle (offline demo modu)
        setOturum(prev => prev ? { ...prev, ...updateData } : prev);
        return { ok: false, error: error.message };
      }

      setOturum(prev => prev ? { ...prev, ...updateData } : prev);
      return { ok: true };
    } catch (err) {
      console.warn("⚠️ Profil güncelleme exception:", err);
      setOturum(prev => prev ? { ...prev, ...guncellemeler } : prev);
      return { ok: false, error: String(err) };
    }
  }, [supabase, oturum?.id]);

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

  const bildirimGoster = useCallback((baslik, icerik, icon = "🔔") => {
    setGosterenBildirim({ baslik, icerik, icon });
    setToastBildirim({ baslik, icerik, icon });

    // 5 saniye sonra otomatik kapat
    setTimeout(() => {
      setToastBildirim(null);
    }, 5000);
  }, []);

  // Bildirimleri otomatik göster
  useEffect(() => {
    if (bildirimlerList && bildirimlerList.length > 0) {
      const enSonBildirim = bildirimlerList[0];
      if (!gosterenBildirim || gosterenBildirim.id !== enSonBildirim.id) {
        bildirimGoster(
          enSonBildirim.baslik,
          enSonBildirim.icerik,
          '🔔'
        );
      }
    }
  }, [bildirimlerList, gosterenBildirim, bildirimGoster]);

  const başvuruGonder = useCallback(async (ilanId, bilgiler) => {
    // DEBUG: başvuruGonder çağrılıyor mu?
    console.log('🚀 başvuruGonder ÇAĞRILDI', { ilanId, bilgiler, supabaseVarMi: !!supabase, ilanSayisi: ilanlar?.length });

    setKamyoncuBasvuru({ ilanId, ...bilgiler });
    setSeferOnayDurumu(prev => ({ ...prev, [ilanId]: "bekliyor_onay" }));

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
      iban: ilan.iban || "",
      iban_sahibi: ilan.iban_sahibi || "",
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
      await supabase.from('bildirimler').insert({
        kullanici_id: ilan.olusturan_id,
        tur: 'basvuru',
        baslik: 'Yeni iş başvurusu',
        icerik: `${bilgiler.ad} (${bilgiler.tel})\n\n${ilan.yuk} - ${ilan.nereden} → ${ilan.nereye}\n\nÇekici: ${bilgiler.cekiciPlaka}\nDorse: ${bilgiler.dorsePlaka}\nTC: ${bilgiler.tc_kimlik}`,
        ilan_id: ilanId
      }).then(() => {
        console.log('✅ Bildirim başarıyla oluşturuldu');
      }).catch(err => {
        console.error('❌ Bildirim oluşturma hatası:', err);
      });
    }

    setSeferler(prev => [yeniSefer, ...prev]);
  }, [ilanlar, supabase, oturum]);

  const ilaniOnayla = useCallback(async (ilanId, kamyoncuAd, kamyoncuTel, plaka, dorsePlaka, tc) => {
    setSeferOnayDurumu(prev => ({
      ...prev,
      [ilanId]: "onaylandı"
    }));

    const ilan = ilanlar.find(i => i.id === ilanId);
    if (!ilan) return;

    const mevcutSefer = seferler.find(s => (s.ilan_id === ilanId || s.ilanId === ilanId) && s.durum === "bekliyor");
    if (!mevcutSefer) {
      console.error('❌ ilaniOnayla: bekleyen sefer bulunamadı', { ilanId, seferler: seferler.map(s => ({ id: s.id, ilan_id: s.ilan_id, durum: s.durum })) });
      alert('Başvuru bulunamadı! Sayfayı yenileyip tekrar deneyin.');
      return;
    }
    console.log('✅ Onanacak sefer bulundu:', mevcutSefer.id);

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
      // Önce tc ile dene
      if (tc) {
        const { data: u } = await supabase
          .from('users')
          .select('id')
          .eq('tc_kimlik', tc)
          .maybeSingle();
        if (u) { kamyoncuUserId = u.id; console.log('✅ Kamyoncu user bulundu (tc fallback):', kamyoncuUserId); }
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
        yeniKonusma = await mesajContext.konusmaAc({
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

    // Bildirim oluştur - İşveren için
    if (supabase && mevcutSefer.olusturan_id) {
      await supabase.from('bildirimler').insert({
        kullanici_id: mevcutSefer.olusturan_id,
        tur: 'sefer_onay',
        baslik: `${kamyoncuAd} iş başvurusunu kabul etti`,
        icerik: `${ilan.yuk} - ${ilan.nereden} → ${ilan.nereye}\n\nÇekici: ${plaka}\nDorse: ${dorsePlaka}\nTel: ${kamyoncuTel}`,
        sefer_id: mevcutSefer.id,
        ilan_id: ilanId
      }).catch(err => console.error('Bildirim hatası:', err));
    }

    // Bilgi mesajını konuşmaya gönder
    if (yeniKonusma) {
      const bilgiMesaji = `✓ İş başvurunuz kabul edildi. Gelen bilgiler:\n\n👤 Ad: ${kamyoncuAd}\n📞 Tel: ${kamyoncuTel}\n🚚 Çekici Plaka: ${plaka}\n🚐 Dorse Plaka: ${dorsePlaka}\n🆔 TC Kimlik: ${tc}\n\nŞimdi convo üzerinden konuşabiliriz.`;
      await mesajContext.mesajGonder(yeniKonusma, bilgiMesaji);
    }
  }, [ilanlar, seferler, mesajContext, supabase, oturum]);

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
  }, [seferler, supabase]);

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

        if (error) {
          console.error('❌ İlanlar fetch hatası:', error)
          return
        }

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
          console.log(`✅ İlanlar güncellendi: ${normalizedData.length} adet`)
        } else {
          console.log('⚠️ İlanlar listesi boş')
          setIlanlar([])
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

        if (error) {
          console.error('❌ Seferler fetch hatası:', error)
          return
        }

        if (data) {
          setSeferler(data)
          console.log(`✅ Seferler güncellendi: ${data.length} adet`)
        } else {
          console.log('⚠️ Seferler listesi boş')
          setSeferler([])
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

  const subscribeToBildirimler = () => {
    if (!supabase) return null;

    console.log('🔔 Bildirim Polling başlatılıyor...')

    const interval = setInterval(async () => {
      try {
        // Tüm bildirimleri çek
        const { data, error } = await supabase
          .from('bildirimler')
          .select('*')
          .order('olusturma_zamani', { ascending: false })
          .limit(100)

        if (error) {
          console.error('❌ Bildirimler fetch hatası:', error)
          return
        }

        if (data) {
          console.log(`📥 Tüm bildirimler yüklendi: ${data.length} adet`)

          // Bildirimleri oturuma göre filtrele
          const filtered = oturum?.user?.id
            ? data.filter(b => b.kullanici_id === oturum.user.id)
            : [];

          setBildirimlerList(filtered);
          console.log(`✅ Bildirimler state'e kaydedildi: ${filtered.length} adet (oturum: ${oturum?.user?.id || 'none'})`)
        } else {
          console.log('⚠️ Bildirimler listesi boş')
          setBildirimlerList([])
        }
      } catch (error) {
        console.error('❌ Bildirimler güncellemesi başarısız:', error)
      }
    }, 3000) // 3 saniyede bir kontrol et

    return () => {
      clearInterval(interval)
      console.log('🧹 Bildirimler Polling temizlendi')
    }
  };

  // Bildirimleri yükle (F5 refresh sonrası)
  useEffect(() => {
    if (oturum?.user?.id && supabase) {
      console.log('🔔 Bildirimler yüklenecek:', oturum.user.id);
      subscribeToBildirimler();
    }
  }, [oturum?.user?.id, supabase]);

  const subscribeToTeklifler = () => {
    if (!supabase) return null;

    const interval = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from('teklifler')
          .select('*')

        if (error) {
          console.error('❌ Teklifler fetch hatası:', error)
          return
        }

        if (data) {
          setTeklifler(data)
          console.log(`✅ Teklifler güncellendi: ${data.length} adet`)
        } else {
          console.log('⚠️ Teklifler listesi boş')
          setTeklifler([])
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

  // ============================================
  // REALTIME SUBSCRIPTIONS
  // Supabase postgres_changes ile tüm tabloları dinle
  // Oturum açıldığında subscribe ol, kapandığında unsubscribe
  // ============================================
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
      const { data } = await supabase.from('ilanlar').select('*').order('tarih', { ascending: false }).limit(50);
      if (data) {
        console.log(`📋 İlanlar realtime güncellendi: ${data.length}`);
        setIlanlar(data);
      }
    });

    // seferler değişiklikleri → state'i yeniden yükle
    const seferlerChannel = subscribeTable('seferler', async () => {
      const { data } = await supabase.from('seferler').select('*').order('tarih', { ascending: false }).limit(50);
      if (data) {
        console.log(`🚚 Seferler realtime güncellendi: ${data.length}`);
        setSeferler(data);
      }
    });

    // teklifler değişiklikleri
    const tekliflerChannel = subscribeTable('teklifler', async () => {
      const { data } = await supabase.from('teklifler').select('*');
      if (data) {
        console.log(`💼 Teklifler realtime güncellendi: ${data.length}`);
        setTeklifler(data);
      }
    });

    // users değişiklikleri
    const usersChannel = subscribeTable('users', async () => {
      const { data } = await supabase.from('users').select('*');
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
            // Yeni bildirimi direkt state'e ekle (en başa)
            setBildirimlerList(prev => [payload.new, ...(prev || [])]);
          }
        )
        .subscribe();

      // Ayrıca tüm bildirim listesini de yenile (offscreen durumlar için)
      const refreshBildirimler = async () => {
        const { data } = await supabase
          .from('bildirimler')
          .select('*')
          .eq('kullanici_id', oturum.id)
          .order('olusturma_zamani', { ascending: false })
          .limit(100);
        if (data) setBildirimlerList(data);
      };
      refreshBildirimler();
    }

    // Cleanup: tüm kanalları kapat
    return () => {
      console.log('🧹 Realtime subscriptions temizleniyor...');
      ilanlarChannel?.unsubscribe();
      seferlerChannel?.unsubscribe();
      tekliflerChannel?.unsubscribe();
      usersChannel?.unsubscribe();
      bildirimlerChannel?.unsubscribe();
    };
  }, [supabase, oturum?.id]);

  return (
    <Ctx.Provider value={{
      oturum, loading, kullanicilar: adminKullanicilar, ilanlar, seferler, teklifler,
      kayitOl, girisYap, cikisYap,
      ilanEkle, ilanSil, ilanAl, belgeEkle, odemeYap, odemeGunleriniKabulEt, islemiTeslimEt, ibanGuncelle, profilGuncelle, kullaniciBelgesiYukle,
      konusmaOluştur, ilkMesajiGonder,
      bildirimler: bildirimlerList, bildirimGuncelle, setBildirimlerList,
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
