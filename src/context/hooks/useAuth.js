// Kimlik doğrulama + oturum durumu hook'u.
// AppContext'in auth ile ilgili kısmı buraya taşındı.
import { useCallback, useEffect, useState } from "react";
import { IconMap } from "../../components/Icons";

let supabaseInitialized = false;
const initSupabase = (supabase) => {
  if (!supabaseInitialized && supabase) {
    console.log(`${IconMap.fire} Supabase Backend Connected`);
    supabaseInitialized = true;
  }
};

// RLS sıkılaştırması sonrası tc_kimlik sütunu anon/authenticated'ten gizlendi.
// Kullanıcı kendi TC'sini kendi_profilini_getir() SECURITY DEFINER RPC'sinden alır.
// SQL henüz çalıştırılmadıysa RPC yoktur → mevcut kullanıcı nesnesi aynen döner.
async function kendiTcKimliginiGetir(supabase, kullanici) {
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

export function useAuth(supabase, { setLoading } = {}) {
  const [oturum, setOturum] = useState(null);

  // Session'ı yükle
  useEffect(() => {
    initSupabase(supabase);

    if (supabase && supabase.auth) {
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        console.log('🔐 Session yüklendi:', session ? '✅ Var' : '❌ Yok');

        if (session) {
          try {
            console.log('🔐 Session ID:', session.user.id);
            const { data: userData, error } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();

            if (error) {
              console.error('❌ User fetch error after session load:', error);
              await supabase.auth.signOut();
            } else if (userData) {
              console.log('✅ User verisi alındı:', userData);
              const tamamlanmis = await kendiTcKimliginiGetir(supabase, userData);
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

        setLoading?.(false);
      }).catch((error) => {
        console.error('❌ Session yükleme hatası:', error);
        setLoading?.(false);
      });
    } else {
      console.warn(`${IconMap.warning} Supabase client yok, Demo modu`);
      setLoading?.(false);
    }
  }, [supabase]);

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
      const telefon = bilgiler.telefon;
      const password = bilgiler.sifre;

      console.log("📱 Telefon:", telefon);
      console.log("👤 Ad:", bilgiler.ad);

      if (!telefon || telefon.length < 10) {
        throw new Error("Geçerli telefon numarası girin");
      }

      if (!password || password.length < 6) {
        throw new Error("Şifre en az 6 karakter olmalı");
      }

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

      const email = `${telefon}@nakliyol.com`;

      let userId = null;
      let authSession = null;

      try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password
        });

        if (authError) {
          console.warn(<>{IconMap.warning} Supabase Auth hatası:", authError.message</>);

          if (authError.message.includes("rate limit")) {
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
            const { data: existingUser } = await supabase
              .from('users')
              .select('*')
              .eq('email', email)
              .maybeSingle();

            if (existingUser) {
              userId = existingUser.id;
              console.log("✅ Kullanıcı mevcut, ID:", userId);
              console.log("🎭 Mevcut rol:", existingUser.role);

              const { data: authUser, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password
              });

              if (signInError) {
                throw new Error("Şifre yanlış. Lütfen kontrol edin.");
              }

              if (authUser?.session) {
                authSession = authUser.session;

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
                    await supabase.from('users').update({
                      role: bilgiler.rol || "issiz",
                      ad: bilgiler.ad,
                      tc_kimlik: bilgiler.tc
                    }).eq('id', userId);
                    console.log("✅ Rol Supabase'e kaydedildi:", bilgiler.rol);
                  }
                } else {
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
          userId = authData.user?.id;
          authSession = authData.session;

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
          }

          console.log("✅ Auth ve database kayıtları oluşturuldu");
        }
          try {
            const { data: freshUserData } = await supabase
              .from('users')
              .select('*')
              .eq('id', userId)
              .single();

            if (freshUserData && freshUserData.role) {
              const tamamlanmis = await kendiTcKimliginiGetir(supabase, {
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

      let finalUser;

      if (userId && authSession) {
        try {
          const { data: freshUserData } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

          if (freshUserData && freshUserData.role) {
            const tamamlanmis = await kendiTcKimliginiGetir(supabase, freshUserData);
            finalUser = tamamlanmis;
            setOturum(tamamlanmis);
            return tamamlanmis;
          }
        } catch (error) {
          console.error("Son kullanıcı çekme hatası:", error);
        }

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
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();

        if (userData) {
          const tamamlanmis = await kendiTcKimliginiGetir(supabase, {
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

      if (userData.durum === "pasif") {
        throw new Error("Hesabınız askıya alınmış. Destek ekibiyle iletişime geçin.");
      }

      const email = userData.email;

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

      const { data: freshUserData, error: freshError } = await supabase
        .from('users')
        .select('*')
        .eq('telefon', telefon)
        .single();

      if (freshError) {
        console.error("User data fetch hatası:", freshError);
      }

      if (freshUserData) {
        const tamamlanmis = await kendiTcKimliginiGetir(supabase, freshUserData);
        setOturum(tamamlanmis);
        return tamamlanmis;
      }

      const fallbackOturum = {
        ...data.user,
        role: userData.role,
        ad: userData.ad,
        tc_kimlik: userData.tc_kimlik,
        email: email,
        session: data.session
      };
      const tamamlanmisOturum = await kendiTcKimliginiGetir(supabase, fallbackOturum);
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

    setOturum(null);

    try {
      const target = window.location.origin + window.location.pathname;
      if (window.location.hash || window.location.href !== target) {
        window.location.replace(target);
      }
    } catch (e) {
      console.error('Navigate hatası:', e);
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

  return { oturum, setOturum, kayitOl, girisYap, cikisYap, sifreSifirla };
}
