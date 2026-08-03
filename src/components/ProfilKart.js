import React, { useState, useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import { supabase } from "../supabaseClient";
import { IconMap } from "./Icons";
import { Yildizlar } from "./Yildizlar";
import { formatTarih } from "./UI";
import { harfFiltre, plakaFiltre, rakamFiltre } from "../utils/inputFilters";
import { kullaniciSeferOzeti, yorumDagilimi } from "../utils/istatistik";
import { belgeleriGetir as belgeleriGetirApi } from "../utils/belgeler";

// TC Kimlik No doğrulama: 11 hane + algoritma (ilk 10 hane toplamı vs 11. hane)
const tcDogrula = (tc) => {
  if (!/^\d{11}$/.test(tc)) return false;
  if (tc[0] === "0") return false;
  const haneler = tc.split("").map(Number);
  const tekToplam = haneler[0] + haneler[2] + haneler[4] + haneler[6] + haneler[8];
  const ciftToplam = haneler[1] + haneler[3] + haneler[5] + haneler[7];
  const ilk10Toplam = haneler.slice(0, 10).reduce((a, b) => a + b, 0);
  return (tekToplam * 7 - ciftToplam) % 10 === haneler[9] && ilk10Toplam % 10 === haneler[10];
};

const renkler = {
  kamyoncu: {
    a: "#f59e0b", b: "#b45309",
    grad: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 45%, #d97706 100%)",
    soft: "rgba(245,158,11,0.12)", text: "#d97706",
    rozet: "🚛 Kamyoncu", emoji: "🚛"
  },
  issiz: {
    a: "#3b82f6", b: "#0f172a",
    grad: "linear-gradient(135deg, #60a5fa 0%, #2563eb 45%, #1e3a8a 100%)",
    soft: "rgba(59,130,246,0.12)", text: "#2563eb",
    rozet: "🏢 İşveren", emoji: "🏢"
  }
};

export default function ProfilKart({ rol, userId }) {
  const { oturum, cikisYap, profilGuncelle, ibanGuncelle, kullaniciBelgesiYukle, kullaniciBilgileri, ilanlar, setIlanlar, seferler, degerlendirmeleriGetir } = useApp();
  const isKamyoncu = rol === "kamyoncu";
  const c = renkler[isKamyoncu ? "kamyoncu" : "issiz"];

  const [seciliKullanici, setSeciliKullanici] = useState(null);
  const [duzenle, setDuzenle] = useState(false);
  const [form, setForm] = useState({ ad: "", telefon: "", tc_kimlik: "", plaka: "", dorse_plaka: "", sehir: "" });
  const [kayitMesaj, setKayitMesaj] = useState(null);
  const [aktifModal, setAktifModal] = useState(null);
  const [belgelerim, setBelgelerim] = useState([]);
  const [belgeYukleniyor, setBelgeYukleniyor] = useState(null);
  const [belgeEklendi, setBelgeEklendi] = useState(false);
  const [fotoUrl, setFotoUrl] = useState(null);
  const [yorumListesi, setYorumListesi] = useState([]);
  const dosyaInputRef = useRef();

  const kullanici = userId && kullaniciBilgileri ? kullaniciBilgileri.find(u => u.id === userId) || seciliKullanici : seciliKullanici || oturum;

  const { seferler: kullaniciSeferleri, tamamlanan: tamamlananSefer, basariOrani } = kullaniciSeferOzeti(seferler, kullanici?.id, isKamyoncu);
  const kullaniciIlanlari = ilanlar?.filter(i => i.olusturan_id === kullanici?.id) || [];

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

  useEffect(() => {
    if (kullanici?.id) {
      degerlendirmeleriGetir(kullanici.id).then(setYorumListesi);
    }
  }, [kullanici?.id, degerlendirmeleriGetir]);

  const gosterMesaj = (tur, metin) => {
    setKayitMesaj({ tur, metin });
    setTimeout(() => setKayitMesaj(null), 3000);
  };

  const belgeleriGetir = async () => {
    if (!seciliKullanici?.id) return;
    try {
      const { data } = await belgeleriGetirApi(supabase, {
        kullaniciId: seciliKullanici.id,
        rol: isKamyoncu ? 'kamyoncu' : 'issiz'
      });
      setBelgelerim(data || []);
    } catch (err) {
      console.error('Belgeler yüklenemedi:', err);
    }
  };

  const handleProfilKaydet = async () => {
    if (!form.ad?.trim()) { gosterMesaj("hata", "Ad soyad boş olamaz"); return; }
    if (!oturum?.id) { gosterMesaj("hata", "Oturum bulunamadı"); return; }

    const tcKimlik = form.tc_kimlik.trim().replace(/\D/g, "").slice(0, 11);
    if (tcKimlik && !tcDogrula(tcKimlik)) {
      gosterMesaj("hata", "Geçersiz TC Kimlik No");
      return;
    }
    if (form.telefon?.trim() && form.telefon.trim().replace(/\D/g, "").length < 10) {
      gosterMesaj("hata", "Geçerli bir telefon numarası girin");
      return;
    }

    const payload = {
      ad: form.ad.trim(),
      telefon: form.telefon.trim(),
      tc_kimlik: tcKimlik,
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
        gosterMesaj("hata", "Güncelleme başarısız: " + (sonuc?.error || "Bilinmeyen hata"));
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
        rol: oturum.role || oturum.rol || 'kamyoncu',
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

  const { dagilim, ortalama, oySayisi: yorumSayisi } = yorumDagilimi(yorumListesi, kullanici?.puan);
  const oySayisi = yorumSayisi || Number(kullanici?.oy_sayisi) || 0;

  const stl = {
    kapsayici: { padding: 0, paddingBottom: 130 },
    kart: {
      margin: "0 16px 14px", padding: 16,
      background: "var(--bg1)", borderRadius: 18,
      border: "1px solid var(--border)",
      boxShadow: "0 4px 20px rgba(15,23,42,0.06)"
    },
    baslik: {
      display: "flex", alignItems: "center", gap: 8,
      fontSize: 12, fontWeight: 800, letterSpacing: 1.5,
      color: "var(--text3)", textTransform: "uppercase"
    },
    input: (ekle = {}) => ({
      width: "100%",
      padding: "10px 12px",
      background: "#faf8f5",
      border: "1px solid var(--border)",
      borderRadius: 12,
      fontSize: 13,
      color: "var(--text)",
      outline: "none",
      transition: "all 0.2s",
      ...ekle
    }),
    btn: (birincilMi = true, kucuk = false) => ({
      padding: kucuk ? "8px 12px" : "11px 18px",
      background: birincilMi ? c.grad : "var(--bg1)",
      color: birincilMi ? "#fff" : c.text,
      border: birincilMi ? "none" : "1px solid var(--border)",
      borderRadius: 12,
      fontSize: 12,
      fontWeight: 800,
      cursor: "pointer",
      transition: "all 0.25s",
      boxShadow: birincilMi ? `0 4px 18px ${c.a}44` : "none",
      whiteSpace: "nowrap"
    }),
    hucreLabel: {
      display: "flex", alignItems: "center", gap: 5,
      fontSize: 10, color: "var(--text3)", letterSpacing: 1,
      textTransform: "uppercase", fontWeight: 600
    },
    hucreVal: {
      fontSize: 14, fontWeight: 700, color: "var(--text)", marginTop: 5
    }
  };

  return (
    <div className="scroll-content" style={stl.kapsayici}>
      {/* ===== STICKY ÜST BAR ===== */}
      <div style={{
        position: "sticky", top: 0, zIndex: 30,
        display: "flex", alignItems: "center", gap: 10,
        padding: "12px 16px",
        background: "rgba(245,241,234,0.82)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        borderBottom: "1px solid rgba(0,0,0,0.05)"
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", letterSpacing: 0.5 }}>HESABIM</div>
          <div style={{ fontSize: 11, color: "var(--text3)" }}>{isKamyoncu ? "Kamyoncu profili & belgeler" : "Firma profili & belgeler"}</div>
        </div>
        <button
          onClick={() => setDuzenle(d => !d)}
          style={{
            padding: "9px 14px", borderRadius: 12,
            background: duzenle ? "var(--bg3)" : c.grad,
            color: duzenle ? "var(--text)" : "#fff",
            border: "1px solid " + (duzenle ? "var(--border2)" : "transparent"),
            fontSize: 12, fontWeight: 800, cursor: "pointer",
            boxShadow: duzenle ? "none" : `0 4px 18px ${c.a}44`,
            transition: "all 0.25s", whiteSpace: "nowrap"
          }}
        >
          {duzenle ? "✕" : "Düzenle"}
        </button>
      </div>

      {/* ===== KAPAK ===== */}
      <div style={{ position: "relative", height: 132, overflow: "hidden", background: c.grad }}>
        <div style={{ position: "absolute", top: -46, right: -30, width: 190, height: 190, borderRadius: "50%", background: "rgba(255,255,255,0.16)", filter: "blur(6px)" }} />
        <div style={{ position: "absolute", bottom: -70, left: -30, width: 220, height: 220, borderRadius: "50%", background: "rgba(255,255,255,0.10)", filter: "blur(8px)" }} />
        <div style={{ position: "absolute", top: 16, right: 20, fontSize: 72, opacity: 0.18, transform: "rotate(-12deg)" }}>{c.emoji}</div>
        <div style={{ position: "absolute", bottom: 12, left: 18, color: "rgba(255,255,255,0.9)", fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase" }}>
          Nakliyol Pro
        </div>
      </div>

      <div style={{ padding: "0 16px" }}>
        {/* ===== AVATAR + BİLGİ ===== */}
        <div style={{ textAlign: "center", marginTop: -46, position: "relative" }}>
          <div style={{ position: "relative", width: 96, height: 96, margin: "0 auto", borderRadius: "50%", padding: 3, background: "var(--bg1)", boxShadow: "0 8px 28px rgba(15,23,42,0.18)" }}>
            <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: c.grad, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", overflow: "hidden" }}>
              {(fotoUrl || kullanici?.fotograf) ? (
                <img src={fotoUrl || kullanici.fotograf} alt="profil" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <IconMap.user size={42} style={{ color: "#fff" }} />
              )}
            </div>
            <div style={{
              position: "absolute", right: 0, bottom: 0, width: 26, height: 26,
              borderRadius: "50%", background: "#10b981", border: "3px solid var(--bg1)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13
            }}>✓</div>
            {duzenle && (
              <label style={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                background: "rgba(0,0,0,0.55)", color: "#fff",
                fontSize: 11, fontWeight: 700, padding: "4px 0",
                cursor: "pointer", textAlign: "center",
                borderRadius: "0 0 48px 48px", backdropFilter: "blur(4px)", zIndex: 3
              }}>
                📷
                <input type="file" accept="image/*" onChange={fotoYukle} style={{ display: "none" }} />
              </label>
            )}
          </div>

          {duzenle ? (
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              <input
                type="text" value={form.ad}
                onChange={e => setForm(f => ({ ...f, ad: harfFiltre(e.target.value, 60) }))}
                placeholder="Ad Soyad"
                style={stl.input({ textAlign: "center", fontSize: 16, fontWeight: 700 })}
              />
              <input
                type="text" value={form.sehir}
                onChange={e => setForm(f => ({ ...f, sehir: harfFiltre(e.target.value, 40) }))}
                placeholder="Şehir"
                style={stl.input({ textAlign: "center", fontSize: 13 })}
              />
            </div>
          ) : (
            <>
              <div style={{ fontSize: 23, fontWeight: 800, color: "var(--text)", marginTop: 10, letterSpacing: 0.3 }}>
                {kullanici?.ad || (isKamyoncu ? "Sürücü" : "Firma")}
              </div>
              {kullanici?.sehir && (
                <div style={{ fontSize: 13, color: "var(--text3)", marginTop: 2 }}>📍 {kullanici.sehir}</div>
              )}
            </>
          )}

          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
            <span style={{ padding: "5px 14px", borderRadius: 20, fontSize: 11, fontWeight: 800, color: "#fff", background: c.grad, boxShadow: `0 4px 14px ${c.a}44` }}>
              {c.rozet}
            </span>
            <span style={{ padding: "5px 14px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: "rgba(16,185,129,0.13)", color: "#059669", border: "1px solid rgba(16,185,129,0.25)" }}>
              ✓ Doğrulanmış
            </span>
          </div>
        </div>

        {/* ===== MESAJ ===== */}
        {kayitMesaj && (
          <div style={{
            margin: "14px 0 0", padding: "11px 14px",
            background: kayitMesaj.tur === "ok" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
            color: kayitMesaj.tur === "ok" ? "#10b981" : "#ef4444",
            border: `1px solid ${kayitMesaj.tur === "ok" ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
            borderRadius: 12, fontSize: 13, fontWeight: 600,
            textAlign: "center", backdropFilter: "blur(8px)"
          }}>
            {kayitMesaj.metin}
          </div>
        )}

        {/* ===== PUAN KARTI ===== */}
        <div style={stl.kart}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <span style={stl.baslik}>⭐ Değerlendirme</span>
            {oySayisi > 0 && <span style={{ fontSize: 11, color: "var(--text3)" }}>{oySayisi} değerlendirme</span>}
          </div>
          {oySayisi > 0 ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 80, height: 80, borderRadius: 18, background: c.soft, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 30, fontWeight: 900, color: c.text, lineHeight: 1 }}>{ortalama.toFixed(1)}</span>
                  <span style={{ fontSize: 9, color: c.text, opacity: 0.7, fontWeight: 600, letterSpacing: 0.5 }}>ORTALAMA</span>
                </div>
                <div style={{ flex: 1 }}>
                  <Yildizlar deger={ortalama} boyut={18} />
                  <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 4 }}>
                    {[5,4,3,2,1].map(p => (
                      <div key={p} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 10, color: "var(--text3)", width: 10 }}>{p}</span>
                        <span style={{ fontSize: 10, color: "#f59e0b" }}>★</span>
                        <div style={{ flex: 1, height: 5, background: "var(--bg3)", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ width: `${oySayisi ? (dagilim[p] / oySayisi) * 100 : 0}%`, height: "100%", background: c.grad, borderRadius: 3, transition: "width 0.5s ease" }} />
                        </div>
                        <span style={{ fontSize: 10, color: "var(--text3)", width: 16, textAlign: "right" }}>{dagilim[p]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <button onClick={() => setAktifModal("yorumlar")} style={{
                width: "100%", marginTop: 14, padding: "11px",
                background: c.soft, color: c.text, border: "none", borderRadius: 12,
                fontSize: 13, fontWeight: 800, cursor: "pointer", transition: "all 0.2s"
              }}>
                💬 Yorumları Gör
              </button>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "12px 0 4px", color: "var(--text3)", fontSize: 13 }}>
              Henüz değerlendirme yok — ilk güvenilirlik sinyali burada görünecek
            </div>
          )}
        </div>

        {/* ===== İLETİŞİM ===== */}
        <div style={stl.kart}>
          <span style={stl.baslik}>📞 İletişim</span>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
            <div style={{ background: "var(--bg2)", borderRadius: 14, padding: 12, border: "1px solid var(--border)" }}>
              <div style={stl.hucreLabel}><IconMap.phone size={12} /> Telefon</div>
              {duzenle ? (
                <input
                  type="tel" value={form.telefon}
                  onChange={e => setForm(f => ({ ...f, telefon: rakamFiltre(e.target.value, 11) }))}
                  placeholder="05XX XXX XX XX"
                  style={stl.input({ textAlign: "center", marginTop: 7, padding: "8px 10px", fontSize: 12, fontWeight: 700 })}
                />
              ) : (
                <div style={stl.hucreVal}>{kullanici?.telefon || "—"}</div>
              )}
            </div>
            <div style={{ background: "var(--bg2)", borderRadius: 14, padding: 12, border: "1px solid var(--border)" }}>
              <div style={stl.hucreLabel}><IconMap.idcard size={12} /> TC Kimlik</div>
              {duzenle ? (
                <input
                  type="text" value={form.tc_kimlik}
                  onChange={e => setForm(f => ({ ...f, tc_kimlik: e.target.value.replace(/\D/g, "") }))}
                  placeholder="11 hane" maxLength={11}
                  style={stl.input({ textAlign: "center", marginTop: 7, padding: "8px 10px", fontSize: 12, fontWeight: 700, fontFamily: "monospace", letterSpacing: 2 })}
                />
              ) : (
                <div style={{ ...stl.hucreVal, fontFamily: "monospace", letterSpacing: 1.5 }}>
                  {kullanici?.tc_kimlik ? `${kullanici.tc_kimlik.slice(0,3)}***${kullanici.tc_kimlik.slice(-2)}` : "—"}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ===== ARAÇ (KAMYONCU) ===== */}
        {isKamyoncu && (
          <div style={stl.kart}>
            <span style={stl.baslik}>🚚 Araç Bilgileri</span>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
              <div style={{ background: "var(--bg2)", borderRadius: 14, padding: 12, border: "1px solid var(--border)", textAlign: "center" }}>
                <div style={stl.hucreLabel}>Çekici</div>
                {duzenle ? (
                  <input
                    type="text" value={form.plaka}
                    onChange={e => setForm(f => ({ ...f, plaka: plakaFiltre(e.target.value) }))}
                    placeholder="34 ABC 123"
                    style={stl.input({ textAlign: "center", marginTop: 7, padding: "8px 10px", fontSize: 12, fontWeight: 700, fontFamily: "monospace", letterSpacing: 1 })}
                  />
                ) : (
                  <div style={{ display: "inline-block", marginTop: 7, background: "#fff", color: "#000", fontFamily: "monospace", fontSize: 13, padding: "5px 14px", borderRadius: 6, border: "2px solid #003099", letterSpacing: 2, fontWeight: 700, boxShadow: "0 2px 6px rgba(0,0,0,0.08)" }}>
                    {kullanici?.plaka || "—"}
                  </div>
                )}
              </div>
              <div style={{ background: "var(--bg2)", borderRadius: 14, padding: 12, border: "1px solid var(--border)", textAlign: "center" }}>
                <div style={stl.hucreLabel}>Dorse</div>
                {duzenle ? (
                  <input
                    type="text" value={form.dorse_plaka}
                    onChange={e => setForm(f => ({ ...f, dorse_plaka: plakaFiltre(e.target.value) }))}
                    placeholder="34 ABC 123"
                    style={stl.input({ textAlign: "center", marginTop: 7, padding: "8px 10px", fontSize: 12, fontWeight: 700, fontFamily: "monospace", letterSpacing: 1 })}
                  />
                ) : (
                  <div style={{ display: "inline-block", marginTop: 7, background: "#fff", color: "#000", fontFamily: "monospace", fontSize: 13, padding: "5px 14px", borderRadius: 6, border: "2px solid #003099", letterSpacing: 2, fontWeight: 700, boxShadow: "0 2px 6px rgba(0,0,0,0.08)" }}>
                    {kullanici?.dorse_plaka || "—"}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===== KAYDET ===== */}
        {duzenle && (
          <button onClick={handleProfilKaydet} style={{
            width: "100%", margin: "0 0 14px", padding: "14px",
            background: c.grad, color: "#fff",
            border: "none", borderRadius: 14,
            fontSize: 14, fontWeight: 800, cursor: "pointer",
            boxShadow: `0 6px 24px ${c.a}44`, transition: "all 0.25s"
          }}>
            💾 Değişiklikleri Kaydet
          </button>
        )}

        {/* ===== İSTATİSTİKLER ===== */}
        <div style={stl.kart}>
          <span style={stl.baslik}>📊 İstatistikler</span>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginTop: 12 }}>
            {statlar.map((s, i) => (
              <div key={i} style={{ textAlign: "center", padding: "12px 4px", background: "var(--bg2)", borderRadius: 14, border: "1px solid var(--border)", transition: "transform 0.15s" }}>
                <div style={{ fontSize: 17, marginBottom: 3 }}>{s.icon}</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: c.text, lineHeight: 1.2 }}>{s.val}{s.suffix || ""}</div>
                <div style={{ fontSize: 8, color: "var(--text3)", marginTop: 2, letterSpacing: 1, textTransform: "uppercase" }}>{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ===== BELGELER ===== */}
        <div style={stl.kart}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 12,
                background: c.soft, display: "flex",
                alignItems: "center", justifyContent: "center", fontSize: 16, color: c.text
              }}>
                📁
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Belgelerim</div>
                <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 1 }}>
                  {tamamlananBelge}/{belgeTanimlari.length} onaylı
                </div>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: c.text }}>{belgeYuzdesi}%</div>
              <div style={{ width: 56, height: 4, background: "var(--bg3)", borderRadius: 2, marginTop: 4, overflow: "hidden" }}>
                <div style={{ width: `${belgeYuzdesi}%`, height: "100%", background: c.grad, borderRadius: 2, transition: "width 0.6s" }} />
              </div>
            </div>
          </div>

          {kullanicininBelgeleri.length > 0 && (
            <div style={{ marginBottom: 10, display: "flex", flexDirection: "column", gap: 6 }}>
              {kullanicininBelgeleri.map(b => (
                <div key={b.id} style={{
                  padding: "10px 12px",
                  background: "var(--bg2)", borderRadius: 12,
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  border: "1px solid rgba(16,185,129,0.2)"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: 8,
                      background: "rgba(16,185,129,0.15)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 13, color: "#10b981"
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

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {belgeTanimlari.map(bt => {
              const yuklendi = kullanicininBelgeleri.some(kb => kb.dosya_adi === bt.ad);
              return (
                <div key={bt.id} style={{
                  padding: "10px 12px",
                  background: "var(--bg2)", borderRadius: 12,
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  border: `1px solid ${yuklendi ? "rgba(16,185,129,0.2)" : "var(--border)"}`
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: 8,
                      background: yuklendi ? "rgba(16,185,129,0.15)" : "var(--bg3)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 13, color: yuklendi ? "#10b981" : "var(--text3)"
                    }}>
                      {yuklendi ? "✓" : "○"}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{bt.ad}</div>
                  </div>
                  {!yuklendi && (
                    <button onClick={() => dosyaInputRef.current?.click()} style={stl.btn(false, true)}>
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
        <div style={{ margin: "0 16px 14px", padding: 6, background: "var(--bg1)", borderRadius: 18, border: "1px solid var(--border)", boxShadow: "0 4px 20px rgba(15,23,42,0.06)" }}>
          {[
            { icon: "help", text: "Yardım & Destek", color: "var(--text2)", action: () => setAktifModal("yardim") },
            { icon: "file", text: "İş Geçmişim", color: c.text, action: () => { window.location.hash = isKamyoncu ? "#/app?sekme=ilanlar" : "#/app?sekme=ilanlarim"; } },
            { icon: "star", text: "Aldığım Yorumlar", color: "#f59e0b", action: () => setAktifModal("yorumlar") },
            { icon: "lock", text: "Gizlilik Politikası", color: "var(--text2)", action: () => setAktifModal("gizlilik") },
            { icon: "settings", text: "Ayarlar", color: "var(--text2)", action: () => { window.location.hash = "#/ayarlar"; } },
          ].map((item, i) => (
            <div key={item.text}
              onClick={() => item.action()}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 10px",
                borderBottom: i < 4 ? "1px solid var(--border)" : "none",
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
              <span style={{ fontSize: 14, flex: 1, fontWeight: 600, color: "var(--text)" }}>{item.text}</span>
              <span style={{ color: "var(--text3)", fontSize: 18 }}>›</span>
            </div>
          ))}
        </div>

        {/* ===== ÇIKIŞ ===== */}
        <button
          onClick={() => { if (confirm("Çıkış yapmak istediğinize emin misiniz?")) cikisYap(); }}
          style={{
            width: "100%", padding: "15px",
            background: "linear-gradient(135deg, rgba(239,68,68,0.12) 0%, rgba(239,68,68,0.04) 100%)",
            color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)",
            borderRadius: 14, fontSize: 14, fontWeight: 800, cursor: "pointer",
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
              background: "var(--bg1)", border: "1px solid var(--border)",
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
              {aktifModal === "yorumlar" ? (
                <div style={{
                  background: "var(--bg2)", padding: 16, borderRadius: 12,
                  border: "1px solid var(--border)", marginBottom: 24
                }}>
                  {yorumListesi.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text3)", fontSize: 13 }}>
                      Henüz değerlendirme yok
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {yorumListesi.map(y => (
                        <div key={y.id} style={{ background: "var(--bg1)", borderRadius: 12, padding: 12, border: "1px solid var(--border2)" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
                              {y.degerlendiren?.ad || "Kullanıcı"}
                            </span>
                            <span style={{ fontSize: 10, color: "var(--text3)" }}>{formatTarih(y.olusturulma_zamani)}</span>
                          </div>
                          <Yildizlar deger={y.puan} boyut={12} />
                          {y.yorum && (
                            <div style={{ fontSize: 13, color: "var(--text2)", marginTop: 6, lineHeight: 1.55, whiteSpace: "pre-line" }}>
                              {y.yorum}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{
                  fontSize: 14, color: "var(--text2)", lineHeight: 1.8,
                  background: "var(--bg2)", padding: 16, borderRadius: 12,
                  border: "1px solid var(--border)", whiteSpace: "pre-line",
                  marginBottom: 24
                }}>
                  {aktifModal === "yardim" && "Merhaba! Nakliyol Pro uygulamasında yardıma mı ihtiyacınız var?\n\n📞 Destek Hattı: 0850 XXX XXXX\n📧 E-posta: destek@nakliyol.com\n💬 Canlı Destek: Uygulama içi mesajlaşma\n\nSıkça Sorulan Sorular:\n• İlan nasıl oluşturulur? 'İlan Ver' sekmesinden yeni ilan oluşturabilirsiniz.\n• Teklif nasıl verilir? İlan detay sayfasından 'Teklif Ver' butonunu kullanın.\n• Sefer takibi nasıl yapılır? 'Seferlerim' sekmesinden seferlerinizi takip edebilirsiniz.\n• Ödeme nasıl alınır? IBAN bilgilerinizi profil sayfanıza ekleyin."}
                  {aktifModal === "gizlilik" && "Nakliyol Pro Gizlilik Politikası\n\n✅ Verileriniz şifrelenerek saklanır\n✅ Kişisel bilgileriniz yalnızca işverenlerle paylaşılır\n✅ Kullanım verileriyle hizmet kalitesi analiz edilir\n✅ Supabase altyapısı ile çalışıyor\n✅ KVKK / GDPR uyumlu\n✅ Üçüncü taraflarla veri paylaşılmaz\n✅ Hesap silme talepleri 24 saat içinde işleme alınır\n\nDetaylı bilgi için: destek@nakliyol.com"}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
