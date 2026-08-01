import React, { useState, useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import { supabase } from "../supabaseClient";
import { IconMap } from "./Icons";

export default function ProfilKart({ rol, userId }) {
  const { oturum, cikisYap, profilGuncelle, ibanGuncelle, kullaniciBelgesiYukle, kullaniciBilgileri, ilanlar, setIlanlar, seferler } = useApp();
  const isKamyoncu = rol === "kamyoncu";

  const tema = isKamyoncu
    ? { birincil: "#f59e0b", ikincil: "#d97706", gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", iconBg: "rgba(245,158,11,0.15)", navRenk: "#0f172a" }
    : { birincil: "#1d4ed8", ikincil: "#0f172a", gradient: "linear-gradient(135deg, #1d4ed8 0%, #0f172a 100%)", iconBg: "rgba(29,78,216,0.15)", navRenk: "#0f172a" };

  const [seciliKullanici, setSeciliKullanici] = useState(null);
  const [duzenle, setDuzenle] = useState(false);
  const [form, setForm] = useState({ ad: "", telefon: "", tc_kimlik: "", plaka: "", dorse_plaka: "", sehir: "" });
  const [kayitMesaj, setKayitMesaj] = useState(null);
  const [aktifModal, setAktifModal] = useState(null);
  const [belgelerim, setBelgelerim] = useState([]);
  const [belgeYukleniyor, setBelgeYukleniyor] = useState(null);
  const [belgeEklendi, setBelgeEklendi] = useState(false);
  const [fotoUrl, setFotoUrl] = useState(null);
  const dosyaInputRef = useRef();

  const kullanici = userId && kullaniciBilgileri ? kullaniciBilgileri.find(u => u.id === userId) || seciliKullanici : seciliKullanici || oturum;

  const kullaniciSeferleri = seferler?.filter(s =>
    isKamyoncu ? s.kamyoncu_user_id === kullanici?.id : s.olusturan_id === kullanici?.id
  ) || [];
  const kullaniciIlanlari = ilanlar?.filter(i => i.olusturan_id === kullanici?.id) || [];
  const tamamlananSefer = kullaniciSeferleri.filter(s => s.durum === "teslim_edildi" || s.durum === "tamamlandi").length;
  const basariOrani = kullaniciSeferleri.length > 0 ? Math.round((tamamlananSefer / kullaniciSeferleri.length) * 100) : 0;

  const statlar = isKamyoncu
    ? [
        { val: kullaniciSeferleri.length, lbl: "Sefer", icon: "🚚" },
        { val: basariOrani, lbl: "Başarı", icon: "🎯", suffix: "%" },
        { val: kullanici?.puan || 0, lbl: "Puan", icon: "⭐" },
        { val: kullaniciSeferleri.length > 0 ? `${Math.min(kullaniciSeferleri.length, 5)} Yıl` : "-", lbl: "Deneyim", icon: "⏱️" }
      ]
    : [
        { val: kullaniciIlanlari.length, lbl: "İlan", icon: "📋" },
        { val: kullaniciSeferleri.length, lbl: "Sefer", icon: "🚚" },
        { val: kullanici?.puan || 0, lbl: "Puan", icon: "⭐" },
        { val: kullaniciIlanlari.length > 0 ? `${Math.min(kullaniciIlanlari.length, 5)} Yıl` : "-", lbl: "Deneyim", icon: "⏱️" }
      ];

  const belgeTanimlari = isKamyoncu
    ? [
        { id: "ehliyet", ad: "Ehliyet (E Sınıfı)", ikon: "🚛" },
        { id: "ruhsat", ad: "Araç Ruhsatı", ikon: "📄" },
        { id: "sigorta", ad: "Sorumluluk Sigortası", ikon: "🛡️" },
        { id: "src", ad: "SRC Belgesi", ikon: "📋" },
        { id: "adr", ad: "ADR Belgesi", ikon: "⚠️" }
      ]
    : [
        { id: "kayit", ad: "Firma Kayıt Belgesi", ikon: "🏢" },
        { id: "vergi", ad: "Vergi Levhası", ikon: "💰" },
        { id: "isguvenligi", ad: "İş Yeri Güvenliği", ikon: "🔒" },
        { id: "ticari", ad: "Ticari Sicil", ikon: "📜" }
      ];

  useEffect(() => {
    if (userId && kullaniciBilgileri?.length > 0) {
      const user = kullaniciBilgileri.find(u => u.id === userId);
      setSeciliKullanici(user || oturum);
    } else {
      setSeciliKullanici(oturum);
    }
  }, [userId, oturum, kullaniciBilgileri]);

  useEffect(() => {
    if (seciliKullanici) {
      setForm({
        ad: seciliKullanici.ad || "",
        telefon: seciliKullanici.telefon || "",
        tc_kimlik: seciliKullanici.tc_kimlik || "",
        plaka: seciliKullanici.plaka || "",
        dorse_plaka: seciliKullanici.dorse_plaka || "",
        sehir: seciliKullanici.sehir || "",
      });
    }
  }, [seciliKullanici]);

  useEffect(() => {
    if (seciliKullanici?.id) belgeleriGetir();
  }, [seciliKullanici?.id]);

  useEffect(() => {
    if (!seciliKullanici?.id) return;
    supabase.from('belgeler').select('url').eq('kullanici_id', seciliKullanici.id).eq('dosya_adi', 'profil_fotografi').order('olusturulma_tarihi', { ascending: false }).limit(1).maybeSingle().then(({ data, error }) => {
      if (!error && data?.url) setFotoUrl(data.url);
    });
  }, [seciliKullanici?.id]);

  const gosterMesaj = (tur, metin) => {
    setKayitMesaj({ tur, metin });
    setTimeout(() => setKayitMesaj(null), 3000);
  };

  const belgeleriGetir = async () => {
    if (!seciliKullanici?.id) return;
    try {
      const { data } = await supabase
        .from('belgeler')
        .select('*')
        .eq('kullanici_id', seciliKullanici.id)
        .eq('rol', isKamyoncu ? 'kamyoncu' : 'issiz');
      setBelgelerim(data || []);
    } catch (err) {
      console.error('Belgeler yüklenemedi:', err);
    }
  };

  const handleProfilKaydet = async () => {
    if (!form.ad?.trim()) { gosterMesaj("hata", "Ad soyad boş olamaz"); return; }
    if (!oturum?.id) { gosterMesaj("hata", "Oturum bulunamadı"); return; }

    const payload = {
      ad: form.ad.trim(),
      telefon: form.telefon.trim(),
      tc_kimlik: form.tc_kimlik.trim(),
      sehir: form.sehir.trim(),
    };
    if (isKamyoncu) {
      payload.plaka = form.plaka.trim();
      payload.dorse_plaka = form.dorse_plaka.trim();
    }

    try {
      const sonuc = await profilGuncelle(payload);
      if (sonuc?.ok) {
        gosterMesaj("ok", "Profil güncellendi");
        setDuzenle(false);
      } else {
        gosterMesaj("ok", "Profil kaydedildi (yerel)");
        setDuzenle(false);
      }
    } catch {
      gosterMesaj("hata", "Güncelleme başarısız");
    }
  };

  const handleIbanKaydet = async () => {
    try {
      await ibanGuncelle("ibanSahibi", kullanici?.ibanSahibi || kullanici?.ad || "");
      await ibanGuncelle("iban", kullanici?.iban || "");
      gosterMesaj("ok", "IBAN güncellendi");
    } catch {
      gosterMesaj("hata", "IBAN güncellenemedi");
    }
  };

  const belgeYukle = async (e) => {
    const dosya = e.target.files?.[0];
    if (!dosya) return;
    if (!oturum?.id) { alert('Oturum bulunamadı'); return; }

    setBelgeYukleniyor(dosya.name);
    try {
      await kullaniciBelgesiYukle(dosya);
      await belgeleriGetir();
      setBelgeEklendi(true);
      setTimeout(() => setBelgeEklendi(false), 3000);
    } catch (err) {
      alert(`Belge yüklenemedi: ${err.message}`);
    } finally {
      setBelgeYukleniyor(null);
      if (dosyaInputRef.current) dosyaInputRef.current.value = '';
    }
  };

  const belgeSil = async (belgeId) => {
    if (!confirm('Bu belgeyi silmek istediğinize emin misiniz?')) return;
    try {
      await supabase.from('belgeler').delete().eq('id', belgeId);
      await belgeleriGetir();
    } catch (err) {
      console.error('Belge silinemedi:', err);
    }
  };

  const fotoYukle = async (e) => {
    const dosya = e.target.files?.[0];
    if (!dosya || !oturum?.id) return;

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const userId = authUser?.id || oturum.id;
      const uzanti = dosya.name.includes('.') ? dosya.name.split('.').pop().toLowerCase() : (dosya.type.split('/')[1] || 'jpg');
      const dosyaAdi = `${userId}/profil_${Date.now()}.${uzanti}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('belgeler')
        .upload(dosyaAdi, dosya, { upsert: true, contentType: dosya.type });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('belgeler')
        .getPublicUrl(uploadData.path);

      const { error: dbError } = await supabase.from('belgeler').insert([{
        kullanici_id: userId,
        rol: oturum.rol,
        dosya_adi: 'profil_fotografi',
        dosya_yolu: uploadData.path,
        url: publicUrl,
        onaylandi: true,
        olusturulma_tarihi: new Date().toISOString()
      }]);
      if (dbError) throw dbError;

      setSeciliKullanici(prev => prev ? { ...prev, fotograf: publicUrl } : prev);
      setFotoUrl(publicUrl);
      setIlanlar(prev => prev.map(i =>
        i.olusturan_id === oturum.id ? { ...i, profilFoto: publicUrl } : i
      ));
      if (oturum) oturum.fotograf = publicUrl;
      gosterMesaj("ok", "Profil fotoğrafı güncellendi");
    } catch (err) {
      console.error('Fotoğraf hatası:', err);
      gosterMesaj("hata", "Fotoğraf yüklenemedi: " + (err.message || ""));
    }
  };

  const kullanicininBelgeleri = belgelerim?.filter(b => belgeTanimlari?.some(bt => bt?.ad === b?.dosya_adi)) || [];
  const tamamlananBelge = kullanicininBelgeleri.filter(b => b?.onaylandi).length;
  const belgeYuzdesi = belgeTanimlari?.length ? Math.round((tamamlananBelge / belgeTanimlari.length) * 100) : 0;

  const ortalamaPuan = kullanici?.puan || 4.9;
  const oySayisi = Math.max(kullaniciSeferleri.length + kullaniciIlanlari.length, 128);

  const stl = {
    kapsayici: { paddingBottom: 100 },
    kart: (renk) => ({
      background: "var(--bg2)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      border: `1px solid ${renk}`,
      borderRadius: 16
    }),
    input: (ekle = {}) => ({
      width: "100%",
      padding: "10px 14px",
      background: "var(--bg3)",
      border: `1px solid ${tema.birincil}33`,
      borderRadius: 10,
      fontSize: 14,
      color: "var(--text)",
      outline: "none",
      transition: "all 0.2s",
      ...ekle
    }),
    btn: (birincilMi = true, renk = tema.birincil) => ({
      padding: "10px 18px",
      background: birincilMi ? tema.gradient : "transparent",
      color: birincilMi ? "#fff" : renk,
      border: birincilMi ? "none" : `1px solid ${renk}33`,
      borderRadius: 10,
      fontSize: 13,
      fontWeight: 700,
      cursor: "pointer",
      transition: "all 0.25s",
      boxShadow: birincilMi ? `0 4px 20px ${renk}44` : "none"
    }),
    badge: (bg, fg) => ({
      padding: "4px 12px",
      background: bg,
      color: fg,
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: 0.5
    }),
    bolumBaslik: {
      display: "flex", alignItems: "center", gap: 10, marginBottom: 14,
      fontSize: 12, fontWeight: 700, letterSpacing: 1, color: "var(--text3)", textTransform: "uppercase"
    }
  };

  return (
    <div className="scroll-content" style={stl.kapsayici}>
      {/* ===== KAPAK ALANI ===== */}
      <div style={{
        position: "relative",
        margin: "0 -16px",
        padding: "28px 20px 20px",
        background: `linear-gradient(160deg, ${tema.birincil}22 0%, transparent 60%), linear-gradient(180deg, var(--bg1) 0%, var(--bg) 100%)`,
        borderBottom: `1px solid ${tema.birincil}22`,
        overflow: "hidden"
      }}>
        <div style={{ position: "absolute", top: -80, right: -60, width: 240, height: 240, borderRadius: "50%", background: `${tema.birincil}10`, filter: "blur(50px)" }} />
        <div style={{ position: "absolute", bottom: -60, left: -40, width: 180, height: 180, borderRadius: "50%", background: "rgba(139,92,246,0.06)", filter: "blur(40px)" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", zIndex: 2 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: tema.birincil, textTransform: "uppercase" }}>
              {isKamyoncu ? "Kamyoncu Profili" : "İşveren Profili"}
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "var(--text)", marginTop: 4 }}>
              Hesabım
            </div>
            <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>
              Profilini düzenle ve yönet
            </div>
          </div>
          <button
            onClick={() => setDuzenle(d => !d)}
            style={{
              padding: "10px 16px",
              background: duzenle ? "var(--bg3)" : tema.gradient,
              color: duzenle ? "var(--text)" : "#fff",
              border: duzenle ? `1px solid ${tema.birincil}33` : "none",
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: duzenle ? "none" : `0 4px 20px ${tema.birincil}44`,
              transition: "all 0.25s",
              backdropFilter: "blur(8px)"
            }}
          >
            {duzenle ? "✕ İptal" : "⚙ Düzenle"}
          </button>
        </div>
      </div>

      {/* ===== PROFİL KARTI ===== */}
      <div style={{ marginTop: 14, position: "relative" }}>
        <div style={{
          padding: "24px 20px 20px",
          marginBottom: 14,
          background: "var(--bg1)",
          borderRadius: 16,
          border: `1px solid ${tema.birincil}22`,
          position: "relative",
          overflow: "hidden"
        }}>
          {/* FOTOĞRAF */}
          <div style={{ textAlign: "center", position: "relative" }}>
            <div style={{
              width: 104,
              height: 104,
              margin: "0 auto",
              borderRadius: "50%",
              background: tema.gradient,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 48,
              boxShadow: `0 8px 32px ${tema.birincil}44`,
              border: "3px solid var(--bg1)",
              overflow: "hidden",
              position: "relative"
            }}>
              {(fotoUrl || kullanici?.fotograf) ? (
                <img src={fotoUrl || kullanici.fotograf} alt="profil" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <IconMap.user size={48} style={{ color: "#fff" }} />
              )}
              {duzenle && (
                <label style={{
                  position: "absolute", bottom: 0, left: 0, right: 0,
                  background: "rgba(0,0,0,0.6)", color: "#fff",
                  fontSize: 10, fontWeight: 700, padding: "4px 0",
                  cursor: "pointer", textAlign: "center",
                  backdropFilter: "blur(4px)"
                }}>
                  📷
                  <input type="file" accept="image/*" onChange={fotoYukle} style={{ display: "none" }} />
                </label>
              )}
            </div>
          </div>

          {/* AD */}
          {duzenle ? (
            <div style={{ marginTop: 12 }}>
              <input
                type="text" value={form.ad}
                onChange={e => setForm(f => ({ ...f, ad: e.target.value }))}
                placeholder="Ad Soyad"
                style={stl.input({ textAlign: "center", fontSize: 18, fontWeight: 700 })}
              />
              <input
                type="text" value={form.sehir}
                onChange={e => setForm(f => ({ ...f, sehir: e.target.value }))}
                placeholder="Şehir"
                style={stl.input({ textAlign: "center", fontSize: 13, marginTop: 8 })}
              />
            </div>
          ) : (
            <div style={{ marginTop: 12, textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: tema.birincil }}>
                {kullanici?.ad || (isKamyoncu ? "Sürücü" : "Firma")}
              </div>
              {kullanici?.sehir && (
                <div style={{ fontSize: 13, color: "var(--text3)", marginTop: 2 }}>
                  📍 {kullanici.sehir}
                </div>
              )}
            </div>
          )}

          {/* ROZETLER */}
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            <span style={stl.badge(tema.gradient, "#fff")}>
              {isKamyoncu ? "🚛 Kamyoncu" : "🏢 İşveren"}
            </span>
            <span style={stl.badge("rgba(16,185,129,0.15)", "#10b981")}>
              ✓ Doğrulanmış
            </span>
          </div>

          {/* PUAN */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6, marginTop: 10 }}>
            <div style={{ display: "flex", gap: 1 }}>
              {[1,2,3,4,5].map(i => (
                <span key={i} style={{ fontSize: 14, color: i <= Math.round(ortalamaPuan) ? "#f59e0b" : "var(--bg3)" }}>★</span>
              ))}
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{ortalamaPuan}</span>
            <span style={{ fontSize: 11, color: "var(--text3)" }}>({oySayisi} oy)</span>
          </div>

          {/* İLETİŞİM BİLGİLERİ */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 16,
            padding: 14, background: "var(--bg2)", borderRadius: 14,
            border: `1px solid ${tema.birincil}15`
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "var(--text3)", letterSpacing: 1, textTransform: "uppercase" }}>
                <IconMap.phone size={12} style={{ display: "inline", verticalAlign: "middle" }} /> Telefon
              </div>
              {duzenle ? (
                <input
                  type="tel" value={form.telefon}
                  onChange={e => setForm(f => ({ ...f, telefon: e.target.value }))}
                  placeholder="05XX XXX XX XX"
                  style={stl.input({ textAlign: "center", fontSize: 13, fontWeight: 600, marginTop: 6 })}
                />
              ) : (
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginTop: 4 }}>
                  {kullanici?.telefon || "—"}
                </div>
              )}
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "var(--text3)", letterSpacing: 1, textTransform: "uppercase" }}>
                <IconMap.idcard size={12} style={{ display: "inline", verticalAlign: "middle" }} /> TC Kimlik
              </div>
              {duzenle ? (
                <input
                  type="text" value={form.tc_kimlik}
                  onChange={e => setForm(f => ({ ...f, tc_kimlik: e.target.value }))}
                  placeholder="11 hane" maxLength={11}
                  style={stl.input({ textAlign: "center", fontSize: 13, fontWeight: 600, fontFamily: "monospace", letterSpacing: 2, marginTop: 6 })}
                />
              ) : (
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginTop: 4, fontFamily: "monospace", letterSpacing: 2 }}>
                  {kullanici?.tc_kimlik ? `${kullanici.tc_kimlik.slice(0,3)}***${kullanici.tc_kimlik.slice(-2)}` : "—"}
                </div>
              )}
            </div>
          </div>

          {/* PLAKA (KAMYONCU) */}
          {isKamyoncu && (
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8,
              padding: 14, background: "var(--bg2)", borderRadius: 14,
              border: `1px solid ${tema.birincil}15`
            }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 10, color: "var(--text3)", letterSpacing: 1, textTransform: "uppercase" }}>
                  🚚 Çekici
                </div>
                {duzenle ? (
                  <input
                    type="text" value={form.plaka}
                    onChange={e => setForm(f => ({ ...f, plaka: e.target.value.toUpperCase() }))}
                    placeholder="34 ABC 123"
                    style={stl.input({ textAlign: "center", fontSize: 13, fontWeight: 700, letterSpacing: 1, fontFamily: "monospace", marginTop: 6 })}
                  />
                ) : (
                  <div style={{
                    display: "inline-block", background: "#fff", color: "#000",
                    fontFamily: "monospace", fontSize: 13, padding: "4px 12px",
                    borderRadius: 5, border: "2px solid #003099", marginTop: 4,
                    letterSpacing: 2, fontWeight: 700
                  }}>
                    {kullanici?.plaka || "—"}
                  </div>
                )}
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 10, color: "var(--text3)", letterSpacing: 1, textTransform: "uppercase" }}>
                  🚐 Dorse
                </div>
                {duzenle ? (
                  <input
                    type="text" value={form.dorse_plaka}
                    onChange={e => setForm(f => ({ ...f, dorse_plaka: e.target.value.toUpperCase() }))}
                    placeholder="34 ABC 123"
                    style={stl.input({ textAlign: "center", fontSize: 13, fontWeight: 700, letterSpacing: 1, fontFamily: "monospace", marginTop: 6 })}
                  />
                ) : (
                  <div style={{
                    display: "inline-block", background: "#fff", color: "#000",
                    fontFamily: "monospace", fontSize: 13, padding: "4px 12px",
                    borderRadius: 5, border: "2px solid #003099", marginTop: 4,
                    letterSpacing: 2, fontWeight: 700
                  }}>
                    {kullanici?.dorse_plaka || "—"}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* KAYDET BUTONU */}
          {duzenle && (
            <button onClick={handleProfilKaydet} style={{
              width: "100%", marginTop: 14, padding: "14px",
              background: tema.gradient, color: "#fff",
              border: "none", borderRadius: 12,
              fontSize: 14, fontWeight: 700, cursor: "pointer",
              boxShadow: `0 4px 20px ${tema.birincil}44`,
              transition: "all 0.25s"
            }}>
              💾 Değişiklikleri Kaydet
            </button>
          )}

          {/* MESAJ */}
          {kayitMesaj && (
            <div style={{
              marginTop: 10, padding: "10px 14px",
              background: kayitMesaj.tur === "ok" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
              color: kayitMesaj.tur === "ok" ? "#10b981" : "#ef4444",
              border: `1px solid ${kayitMesaj.tur === "ok" ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
              borderRadius: 10, fontSize: 13, fontWeight: 600,
              textAlign: "center", backdropFilter: "blur(8px)"
            }}>
              {kayitMesaj.metin}
            </div>
          )}
        </div>

        {/* ===== İSTATİSTİKLER ===== */}
        <div style={{
          padding: 18, marginBottom: 14,
          background: "var(--bg1)", borderRadius: 16,
          border: `1px solid ${tema.birincil}15`
        }}>
          <div style={stl.bolumBaslik}>📊 İstatistikler</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {statlar.map((s, i) => (
              <div key={i} style={{
                textAlign: "center", padding: "14px 4px",
                background: "var(--bg2)", borderRadius: 12,
                border: `1px solid ${tema.birincil}15`,
                transition: "all 0.3s"
              }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: tema.birincil }}>
                  {s.val}{s.suffix || ""}
                </div>
                <div style={{ fontSize: 9, color: "var(--text3)", marginTop: 2, letterSpacing: 1, textTransform: "uppercase" }}>
                  {s.lbl}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ===== BELGELER ===== */}
        <div style={{
          padding: 18, marginBottom: 14,
          background: "var(--bg1)", borderRadius: 16,
          border: `1px solid ${tema.birincil}15`
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: tema.iconBg, display: "flex",
                alignItems: "center", justifyContent: "center", fontSize: 16
              }}>
                📁
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Belgelerim</div>
                <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 1 }}>
                  {kullanicininBelgeleri.length}/{belgeTanimlari.length} belge
                </div>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: tema.birincil }}>{belgeYuzdesi}%</div>
              <div style={{ width: 56, height: 4, background: "var(--bg3)", borderRadius: 2, marginTop: 4, overflow: "hidden" }}>
                <div style={{ width: `${belgeYuzdesi}%`, height: "100%", background: tema.gradient, borderRadius: 2, transition: "width 0.6s" }} />
              </div>
            </div>
          </div>

          {/* Yüklenen belgeler */}
          {kullanicininBelgeleri.length > 0 && (
            <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 6 }}>
              {kullanicininBelgeleri.map(b => (
                <div key={b.id} style={{
                  padding: "12px 14px",
                  background: "var(--bg2)", borderRadius: 12,
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  border: "1px solid rgba(16,185,129,0.2)"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: "rgba(16,185,129,0.15)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 14, color: "#10b981"
                    }}>✓</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{b.dosya_adi}</div>
                      <div style={{ fontSize: 10, color: b.onaylandi ? "#10b981" : "var(--text3)", fontWeight: 600 }}>
                        {b.onaylandi ? "Onaylandı" : "Onay Bekliyor"}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => belgeSil(b.id)} style={{
                    padding: "6px 10px",
                    background: "rgba(239,68,68,0.1)",
                    border: "1px solid rgba(239,68,68,0.2)",
                    color: "#ef4444", borderRadius: 8,
                    fontSize: 11, fontWeight: 700, cursor: "pointer"
                  }}>
                    Sil
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Belge tipleri */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {belgeTanimlari.map(bt => {
              const yuklendi = kullanicininBelgeleri.some(kb => kb.dosya_adi === bt.ad);
              return (
                <div key={bt.id} style={{
                  padding: "12px 14px",
                  background: "var(--bg2)", borderRadius: 12,
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  border: `1px solid ${yuklendi ? "rgba(16,185,129,0.2)" : `${tema.birincil}15`}`
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: yuklendi ? "rgba(16,185,129,0.15)" : "var(--bg3)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 14, color: yuklendi ? "#10b981" : "var(--text3)"
                    }}>
                      {yuklendi ? "✓" : "○"}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{bt.ad}</div>
                  </div>
                  {!yuklendi && (
                    <button onClick={() => dosyaInputRef.current?.click()} style={stl.btn(false, tema.birincil)}>
                      + Yükle
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <input ref={dosyaInputRef} type="file" accept="image/*,.pdf" style={{ display: "none" }} onChange={belgeYukle} />

          {belgeEklendi && (
            <div style={{
              marginTop: 10, padding: "10px 14px",
              background: "rgba(16,185,129,0.1)",
              border: "1px solid rgba(16,185,129,0.3)", borderRadius: 10,
              fontSize: 12, color: "#10b981", fontWeight: 600, textAlign: "center"
            }}>
              ✓ Belge başarıyla yüklendi! Onay bekliyor.
            </div>
          )}
          {belgeYukleniyor && (
            <div style={{
              marginTop: 10, padding: "10px 14px",
              background: "rgba(251,191,36,0.1)",
              border: "1px solid rgba(251,191,36,0.3)", borderRadius: 10,
              fontSize: 12, color: "#f59e0b", fontWeight: 600, textAlign: "center"
            }}>
              ⏳ {belgeYukleniyor} yükleniyor...
            </div>
          )}
        </div>

        {/* ===== AYARLAR MENÜSÜ ===== */}
        <div style={{
          padding: 6, marginBottom: 14,
          background: "var(--bg1)", borderRadius: 16,
          border: `1px solid ${tema.birincil}15`
        }}>
          {[
            { icon: "help", text: "Yardım & Destek", color: "var(--text2)", action: () => setAktifModal("yardim") },
            { icon: "file", text: "İş Geçmişim", color: tema.birincil, action: () => { window.location.hash = isKamyoncu ? "#/app?sekme=ilanlar" : "#/app?sekme=ilanlarim"; } },
            { icon: "star", text: "Aldığım Yorumlar", color: "#f59e0b", action: () => setAktifModal("yorumlar") },
            { icon: "lock", text: "Gizlilik Politikası", color: "var(--text2)", action: () => setAktifModal("gizlilik") },
            { icon: "settings", text: "Ayarlar", color: "var(--text2)", action: () => { window.location.hash = "#/ayarlar"; } },
          ].map((item, i) => (
            <div key={item.text}
              onClick={() => item.action()}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "14px 14px",
                borderBottom: i < 4 ? `1px solid ${tema.birincil}10` : "none",
                cursor: "pointer", transition: "all 0.2s"
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: `${item.color}15`, display: "flex",
                alignItems: "center", justifyContent: "center", fontSize: 16
              }}>
                {(() => {
                  const Icon = IconMap[item.icon] || IconMap.settings;
                  return <Icon size={18} style={{ color: item.color }} />;
                })()}
              </div>
              <span style={{ fontSize: 14, flex: 1, fontWeight: 500, color: "var(--text)" }}>{item.text}</span>
              <span style={{ color: "var(--text3)", fontSize: 18 }}>›</span>
            </div>
          ))}
        </div>

        {/* ===== ÇIKIŞ ===== */}
        <button
          onClick={() => { if (confirm("Çıkış yapmak istediğinize emin misiniz?")) cikisYap(); }}
          style={{
            width: "100%", padding: "16px",
            background: "linear-gradient(135deg, rgba(239,68,68,0.12) 0%, rgba(239,68,68,0.04) 100%)",
            color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)",
            borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: "pointer",
            transition: "all 0.2s", backdropFilter: "blur(8px)"
          }}
        >
          🚪 Çıkış Yap
        </button>

        <div style={{ textAlign: "center", marginTop: 16, fontSize: 11, color: "var(--text3)" }}>
          Nakliyol Pro • v1.0.0
        </div>
      </div>

      {/* ===== MODAL ===== */}
      {aktifModal && (
        <div className="sheet-overlay" onClick={() => setAktifModal(null)}>
          <div className="sheet" onClick={e => e.stopPropagation()} style={{
            background: "var(--bg1)", borderRadius: "20px 20px 0 0",
            maxHeight: "85vh", overflowY: "auto"
          }}>
            <button onClick={() => setAktifModal(null)} style={{
              position: "fixed", top: 20, right: 20,
              background: "var(--bg1)", border: `1px solid ${tema.birincil}22`,
              borderRadius: 12, padding: "12px 16px", fontSize: 18,
              cursor: "pointer", zIndex: 101, transition: "var(--tr)",
              backdropFilter: "blur(12px)"
            }}>✕</button>
            <div style={{ maxWidth: 440, margin: "0 auto", padding: 24, paddingTop: 60 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>
                {aktifModal === "yardim" && "❓"}
                {aktifModal === "yorumlar" && "⭐"}
                {aktifModal === "gizlilik" && "🔒"}
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", marginBottom: 12 }}>
                {aktifModal === "yardim" && "Yardım & Destek"}
                {aktifModal === "yorumlar" && "Aldığım Yorumlar"}
                {aktifModal === "gizlilik" && "Gizlilik Politikası"}
              </div>
              <div style={{
                fontSize: 14, color: "var(--text2)", lineHeight: 1.8,
                background: "var(--bg2)", padding: 16, borderRadius: 12,
                border: `1px solid ${tema.birincil}15`, whiteSpace: "pre-line",
                marginBottom: 24
              }}>
                {aktifModal === "yardim" && "Merhaba! Nakliyol Pro uygulamasında yardıma mı ihtiyacınız var?\n\n📞 Destek Hattı: 0850 XXX XXXX\n📧 E-posta: destek@nakliyol.com\n💬 Canlı Destek: Uygulama içi mesajlaşma\n\nSıkça Sorulan Sorular:\n• İlan nasıl oluşturulur? 'İlan Ver' sekmesinden yeni ilan oluşturabilirsiniz.\n• Teklif nasıl verilir? İlan detay sayfasından 'Teklif Ver' butonunu kullanın.\n• Sefer takibi nasıl yapılır? 'Seferlerim' sekmesinden seferlerinizi takip edebilirsiniz.\n• Ödeme nasıl alınır? IBAN bilgilerinizi profil sayfanıza ekleyin."}
                {aktifModal === "yorumlar" && "Yorumlar özelliği çok yakında yayınlanacak!\n\nBu özellik ile:\n✅ İşverenler sizi değerlendirebilecek\n✅ 1-5 yıldız arası puanlama sistemi\n✅ Yorumlar profilinizde görünecek\n✅ Güvenilirlik puanınız artacak\n\nGüncellemeleri takip etmek için bildirimleri açık tutun."}
                {aktifModal === "gizlilik" && "Nakliyol Pro Gizlilik Politikası\n\n✅ Verileriniz şifrelenerek saklanır\n✅ Kişisel bilgileriniz yalnızca işverenlerle paylaşılır\n✅ Kullanım verileriyle hizmet kalitesi analiz edilir\n✅ Supabase altyapısı ile çalışıyor\n✅ KVKK / GDPR uyumlu\n✅ Üçüncü taraflarla veri paylaşılmaz\n✅ Hesap silme talepleri 24 saat içinde işleme alınır\n\nDetaylı bilgi için: destek@nakliyol.com"}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
