import { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react";
import { supabase } from "../supabaseClient";
import { useMesaj } from "./MesajContext";
import { IconMap } from "../components/Icons";
import { serviceWorkerKaydet, pushAboneligiKaydet, pushGonder } from "../utils/push";

let supabaseInitialized = false;
const initSupabase = () => {
  if (!supabaseInitialized && supabase) {
    console.log(`${IconMap.fire} Supabase Backend Connected`);
    supabaseInitialized = true;
  }
};

// Check if Supabase client is initialized on app start
initSupabase();

const Ctx = createContext();

let ilanlarData = null;
let seferlerData = null;
let tekliflerData = null;
let usersData = null;
let ihtilaflarData = null;

// RLS sıkılaştırması sonrası tc_kimlik sütunu anon/authenticated'ten gizlendi.
// Kullanıcı kendi TC'sini kendi_profilini_getir() SECURITY DEFINER RPC'sinden alır.
// SQL henüz çalıştırılmadıysa RPC yoktur → mevcut kullanıcı nesnesi aynen döner.
async function kendiTcKimliginiGetir(kullanici) {
  if (!kullanici || !kullanici.id) return kullanici;
  try {
    const { data, error } = await supabase.rpc('kendi_profilini_getir');
    if (!error && Array.isArray(data) && data.length > 0 && data[0].tc_kimlik) {
      return { ...kullanici, tc_kimlik: data[0].tc_kimlik };
    }
  } catch (e) {
    // RPC henüz yok (SQL çalıştırılmadı) — sessizce geç
  }
  return kullanici;
}

export const AppProvider = ({ children }) => {
  const { konusmaAc, mesajGonder, loadConversations, subscribeRealtime } = useMesaj();
  const [loading, setLoading] = useState(true);
  const [konusmalar, setKonusmalar] = useState([]);
  console.log('🔍 AppContext - konusmalar loaded:', konusmalar?.length || 0);

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

        // Fetch ihtilaflar
        const { data: ihtilaflarRes, error: ihtilaflarError } = await supabase
          .from('ihtilaflar')
          .select('*')
          .order('olusturma_zamani', { ascending: false });

        if (!ihtilaflarError && ihtilaflarRes) {
          console.log(`✅ ${ihtilaflarRes.length} ihtilaf yüklendi`);
          ihtilaflarData = ihtilaflarRes;
        } else {
          console.error('❌ İhtilaflar yüklenemedi');
        }

        // Set the fetched data
        if (ilanlarData) {
          // Fetch profile photos from belgeler table
          const { data: profilFotograflari } = await supabase
            .from('belgeler')
            .select('kullanici_id, url')
            .eq('dosya_adi', 'profil_fotografi')
            .order('olusturulma_tarihi', { ascending: false });
          const fotoMap = {};
          if (profilFotograflari) {
            profilFotograflari.forEach(f => {
              if (!fotoMap[f.kullanici_id]) fotoMap[f.kullanici_id] = f.url;
            });
          }
          // Her ilana olusturanın kullanıcı bilgilerini ekle + camelCase normalize
          const ilanlarWithUsers = ilanlarData.map(ilan => {
            const olusturanUser = usersData?.find(u => u.id === ilan.olusturan_id || u.email === ilan.olusturan);
            return {
              ...ilan,
              aracTip: ilan.arac_tip,
              odemeTuru: ilan.odeme_turu,
              odemeGun: ilan.odeme_gun,
              kdvOrani: ilan.kdv_orani,
              kdvTutari: ilan.kdv_tutari,
              toplamUcret: ilan.toplam_ucret,
              aciklama: ilan.aciklama || "",
              yuklemeKonum: ilan.yukleme_konum || "",
              bosaltmaKonum: ilan.bosaltma_konum || "",
              yuklemeSaatBas: ilan.yukleme_saat_bas || "",
              yuklemeSaatBit: ilan.yukleme_saat_bit || "",
              bosaltmaSaatBas: ilan.bosaltma_saat_bas || "",
              bosaltmaSaatBit: ilan.bosaltma_saat_bit || "",
              faturaBaslik: ilan.fatura_baslik || "",
              faturaDosya: ilan.fatura_dosya || null,
              firmaAdi: olusturanUser?.firma_adi || null,
              profilFoto: olusturanUser?.fotograf || fotoMap[String(ilan.olusturan_id)] || null,
              telefon: olusturanUser?.telefon || null,
              olusturanPuan: olusturanUser?.puan ?? ilan.olusturanPuan ?? 5.0,
              olusturanOySayisi: olusturanUser?.oy_sayisi ?? 0
            };
          });
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
              // tc_kimlik RLS sonrası gizlendi → kendi_profilini_getir RPC ile tamamla
              const tamamlanmis = await kendiTcKimliginiGetir(userData);
              setOturum(tamamlanmis);
            } else {
              console.error('❌ User yok! Session ID:', session.user.id);
            }
          } catch (err) {
            console.error('❌ Error fetching user after session load:', err);
          }
        } else {
          console.log(`${IconMap.warning} Session yok`);
        }

        setLoading(false);
      }).catch((error) => {
        console.error('❌ Session yükleme hatası:', error);
        setLoading(false);
      });
    } else {
      console.warn(`${IconMap.warning} Supabase client yok, Demo modu`);
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
  const [ihtilaflar, setIhtilaflar] = useState([]);
  const [seciliProfilId, setSeciliProfilId] = useState(null);
  const [benimDegerlendirmelerim, setBenimDegerlendirmelerim] = useState([]);

  const kayitOl = useCallback(async (bilgiler) => {
    console.log("📥 kayitOl çağrıldı. Rol:", bilgiler.rol);

    if (!bilgiler.rol) {
      console.error("❌ Rol bilgisi eksik!");
      throw new Error("Rol bilgisi eksik. Lütfen kayıt olurken rol seçin.");
    }

    if (!supabase) {
      console.warn(<>{IconMap.warning} Supabase kurulumu yapılmadı!</>);
      throw new Error("Supabase kurulumu yapılmadı. Lütfen .env dosyasını kontrol edin.");
    }

    try {
      // Sadece telefon ve şifre form'dan geliyor
      const telefon = bilgiler.telefon;
      const password = bilgiler.sifre; // Kullanıcı formdan girdiği şifre

      console.log("📱 Telefon:", telefon);
      console.log("👤 Ad:", bilgiler.ad);

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
          console.warn(<>{IconMap.warning} Supabase Auth hatası:", authError.message</>);

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
                    .select('role, ad, telefon')
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
              // tc_kimlik RLS sonrası gizlendi → RPC ile tamamla, olmazsa form değerini kullan
              const tamamlanmis = await kendiTcKimliginiGetir({
                ...freshUserData,
                tc_kimlik: freshUserData.tc_kimlik || bilgiler.tc
              });
              setOturum(tamamlanmis);
              return tamamlanmis;
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
            // tc_kimlik RLS sonrası gizlendi → RPC ile tamamla
            const tamamlanmis = await kendiTcKimliginiGetir(freshUserData);
            finalUser = tamamlanmis;
            setOturum(tamamlanmis);
            return tamamlanmis;
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
          // tc_kimlik RLS sonrası gizlendi → RPC ile tamamla, olmazsa form değerini kullan
          const tamamlanmis = await kendiTcKimliginiGetir({
            ...userData,
            tc_kimlik: userData.tc_kimlik || bilgiler.tc
          });
          finalUser = tamamlanmis;
          setOturum(tamamlanmis);
          console.log("✅ Kayıt başarılı (sadece user var)");
          return tamamlanmis;
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

      // Askıya alınmış kullanıcı giriş yapamaz
      if (userData.durum === "pasif") {
        throw new Error("Hesabınız askıya alınmış. Destek ekibiyle iletişime geçin.");
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
        // tc_kimlik RLS sonrası gizlendi → kendi_profilini_getir RPC ile tamamla
        const tamamlanmis = await kendiTcKimliginiGetir(freshUserData);
        setOturum(tamamlanmis);
        return tamamlanmis;
      }

      // Session varsa oturumu oluştur
      const fallbackOturum = {
        ...data.user,
        role: userData.role,
        ad: userData.ad,
        tc_kimlik: userData.tc_kimlik,
        email: email,
        session: data.session
      };
      // tc_kimlik RLS sonrası gizlendi → RPC ile tamamla
      const tamamlanmisOturum = await kendiTcKimliginiGetir(fallbackOturum);
      setOturum(tamamlanmisOturum);
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
      const { data, error } = await supabase.from('ilanlar').insert([ilan]).select().single();

      if (error) throw error;

      console.log("✅ İlan Supabase'e kaydedildi:", ilan.yuk);
      // Normalize data for display
      const normalizedData = {
        ...data,
        aracTip: data.arac_tip,
        odemeTuru: data.odeme_turu,
        odemeGun: data.odeme_gun,
        kdvOrani: data.kdv_orani,
        kdvTutari: data.kdv_tutari,
        toplamUcret: data.toplam_ucret,
        aciklama: data.aciklama || "",
        yuklemeKonum: data.yukleme_konum || "",
        bosaltmaKonum: data.bosaltma_konum || "",
        yuklemeSaatBas: data.yukleme_saat_bas || "",
        yuklemeSaatBit: data.yukleme_saat_bit || "",
        bosaltmaSaatBas: data.bosaltma_saat_bas || "",
        bosaltmaSaatBit: data.bosaltma_saat_bit || "",
        faturaBaslik: data.fatura_baslik || "",
        faturaDosya: data.fatura_dosya || null,
        olusturanPuan: data.olusturan?.puan ?? 5.0,
        olusturanOySayisi: data.olusturan?.oy_sayisi ?? 0
      };
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
      const { error } = await supabase.from('seferler').insert([yeniSefer]);
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
        await supabase.from('seferler').update({
          durum: "tamamlandı",
          odeme_durumu: "odendi",
          odeme_tarihi: odemeTarihi
        }).eq('id', seferId);

        // Açık ihtilaf varsa otomatik kapat
        await supabase.from('ihtilaflar')
          .update({ durum: "cozuldu", admin_notu: "Ödeme onaylandı" })
          .eq('sefer_id', seferId)
          .eq('durum', 'acik');

        // Kamyoncuya bildirim
        if (sefer.kamyoncu_user_id) {
          await supabase.from('bildirimler').insert({
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
        const { error } = await supabase.from('ihtilaflar').insert([yeni]);
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
          await supabase.from('bildirimler').insert({
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
          await supabase.from('bildirimler').insert({
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
        await supabase.from('ihtilaflar').update({ durum: "cozuldu", admin_notu: not || "" }).eq('id', ihtilafId);
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
      const { error } = await supabase.from('ilanlar').update({ durum }).eq('id', ilanId);
      if (error) console.error('İlan durumu güncelleme hatası:', error.message);
    }
  }, [supabase]);

  const seferDurumuGuncelle = useCallback(async (seferId, durum) => {
    setSeferler(prev => prev.map(s => s.id === seferId ? { ...s, durum } : s));
    if (supabase) {
      const { error } = await supabase.from('seferler').update({ durum }).eq('id', seferId);
      if (error) console.error('Sefer durumu güncelleme hatası:', error.message);
    }
  }, [supabase]);

  const bildirimGonder = useCallback(async (kullaniciId, baslik, icerik) => {
    if (!supabase) return;
    await supabase.from('bildirimler').insert({
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
        await supabase.from('bildirimler').insert({
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

  const bildirimGoster = useCallback((baslik, icerik, icon = "🔔", id = null) => {
    setGosterenBildirim({ baslik, icerik, icon, id });
    setToastBildirim({ baslik, icerik, icon });

    setTimeout(() => {
      setToastBildirim(null);
    }, 5000);
  }, []);



  const başvuruGonder = useCallback(async (ilanId, bilgiler) => {
    // DEBUG: başvuruGonder çağrılıyor mu?
    console.log('🚀 başvuruGonder ÇAĞRILDI', { ilanId, supabaseVarMi: !!supabase, ilanSayisi: ilanlar?.length });

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
          icerik: `${bilgiler.ad} (${bilgiler.tel})\n\n${ilan.yuk} - ${ilan.nereden} → ${ilan.nereye}\n\nÇekici: ${bilgiler.cekiciPlaka}\nDorse: ${bilgiler.dorsePlaka}\nTC: ${bilgiler.tc_kimlik}`,
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
  }, [seferler, supabase, ilanlar]);

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

    return true;
  }, [seferler, supabase, ilanlar]);

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
      const { error: iptalErr } = await supabase
        .from('kamyoncu_iptaller')
        .insert({ kullanici_id: kamyoncuUserId, sefer_id: seferId, sebep: sebep || '' });
      if (iptalErr) console.error('İptal kaydı hatası:', iptalErr);

      // Son 24 saatteki iptal sayısını hesapla
      const son24Saat = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: iptaller } = await supabase
        .from('kamyoncu_iptaller')
        .select('id')
        .eq('kullanici_id', kamyoncuUserId)
        .gte('zaman', son24Saat);
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
    const { data } = await supabase.from('seferler').select('*').order('tarih', { ascending: false }).limit(50);
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
      const { data } = await supabase.from('ilanlar').select('*').order('tarih', { ascending: false }).limit(50);
      if (data) {
        console.log(`📋 İlanlar realtime güncellendi: ${data.length}`);
        setIlanlar(data.map(ilan => ({
          ...ilan,
          aracTip: ilan.arac_tip,
          odemeTuru: ilan.odeme_turu,
          odemeGun: ilan.odeme_gun,
          kdvOrani: ilan.kdv_orani,
          kdvTutari: ilan.kdv_tutari,
          toplamUcret: ilan.toplam_ucret,
          aciklama: ilan.aciklama || "",
          yuklemeKonum: ilan.yukleme_konum || "",
          bosaltmaKonum: ilan.bosaltma_konum || "",
          yuklemeSaatBas: ilan.yukleme_saat_bas || "",
          yuklemeSaatBit: ilan.yukleme_saat_bit || "",
          bosaltmaSaatBas: ilan.bosaltma_saat_bas || "",
          bosaltmaSaatBit: ilan.bosaltma_saat_bit || "",
          faturaBaslik: ilan.fatura_baslik || "",
          faturaDosya: ilan.fatura_dosya || null,
        })));
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
            setBildirimlerList(prev => [payload.new, ...(prev || [])]);
            bildirimGoster(payload.new.baslik, payload.new.icerik, '🔔', payload.new.id);
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

      // RLS sonrası anon seferleri/teklifleri göremez; oturum açılınca ilk veriyi çek
      const refreshTeklifler = async () => {
        const { data } = await supabase.from('teklifler').select('*');
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
      const { data } = await supabase
        .from('degerlendirmeler')
        .select('id, sefer_id, hedef_kullanici_id, puan')
        .eq('degerlendiren_id', oturum.id);
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
      const { data, error } = await supabase
        .from('degerlendirmeler')
        .select('id, puan, yorum, olusturma_zamani, degerlendiren_id, hedef_kullanici_id')
        .eq('hedef_kullanici_id', hedefId)
        .order('olusturma_zamani', { ascending: false })
        .limit(50);
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
    const { data, error } = await supabase.rpc('degerlendirme_ekle', {
      p_hedef: hedefId,
      p_sefer: seferId,
      p_puan: puan,
      p_yorum: yorum || null
    });
    if (error) {
      console.error('Değerlendirme gönderilemedi:', error);
      return { ok: false, error: error.message };
    }
    await degerlendirmelerimYenile();
    const { data: usersData } = await supabase.from('users').select('*');
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
      oturum, loading, kullanicilar: adminKullanicilar, ilanlar, setIlanlar, seferler, teklifler, konusmalar,
      kayitOl, girisYap, cikisYap,
      ilanEkle, ilanSil, ilanAl, belgeEkle, odemeYap, odemeGunleriniKabulEt, islemiTeslimEt, ibanGuncelle, profilGuncelle, kullaniciBelgesiYukle,
      konusmaOluştur, ilkMesajiGonder,
      seciliProfilId, profiliGoster, profiliKapat,
      benimDegerlendirmelerim, benimDegerlendirdiklerim, degerlendirmelerimYenile,
      degerlendirmeleriGetir, degerlendirmeGonder,
      bildirimler: bildirimlerList, bildirimGoster, bildirimGuncelle, setBildirimlerList, gosterenBildirim, setGosterenBildirim,
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
