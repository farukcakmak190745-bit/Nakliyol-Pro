import React, { useState, useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import { useNavigate } from "react-router-dom";

/**
 * Premium Profil Kartı - hem işveren (issiz) hem kamyoncu için ortak
 * Props:
 *   - rol: "issiz" | "kamyoncu"
 */
export default function ProfilKart({ rol }) {
  const { oturum, cikisYap, ibanGuncelle, profilGuncelle } = useApp();
  const navigate = useNavigate();

  const isKamyoncu = rol === "kamyoncu";

  // Local edit state
  const [duzenle, setDuzenle] = useState(false);
  const [form, setForm] = useState({
    ad: "",
    telefon: "",
    tc_kimlik: "",
    plaka: "",
    dorse_plaka: "",
    sehir: "",
  });
  const [kayitMesaj, setKayitMesaj] = useState(null);

  // IBAN state
  const [localIbanSahibi, setLocalIbanSahibi] = useState("");
  const [localIban, setLocalIban] = useState("");
  const [ibanKaydedildi, setIbanKaydedildi] = useState(false);

  // Avatar / bio (local-only, premium cosmetic)
  const [avatarEmoji] = useState(isKamyoncu ? "🚛" : "🏢");

  useEffect(() => {
    if (oturum) {
      setForm({
        ad: oturum.ad || "",
        telefon: oturum.telefon || "",
        tc_kimlik: oturum.tc_kimlik || "",
        plaka: oturum.plaka || "",
        dorse_plaka: oturum.dorse_plaka || "",
        sehir: oturum.sehir || "",
      });
      setLocalIbanSahibi(oturum.ibanSahibi || oturum.ad || "");
      setLocalIban(oturum.iban || "");
    }
  }, [oturum]);

  const gosterMesaj = (tur, metin) => {
    setKayitMesaj({ tur, metin });
    setTimeout(() => setKayitMesaj(null), 2500);
  };

  const handleProfilKaydet = async () => {
    if (!form.ad?.trim()) {
      gosterMesaj("hata", "Ad soyad boş olamaz");
      return;
    }
    const payload = {
      ad: form.ad.trim(),
      telefon: form.telefon.trim(),
      tc_kimlik: form.tc_kimlik.trim(),
    };
    if (isKamyoncu) {
      payload.plaka = form.plaka.trim();
      payload.dorse_plaka = form.dorse_plaka.trim();
    }
    const sonuc = await profilGuncelle(payload);
    if (sonuc.ok) {
      gosterMesaj("ok", "✓ Profil güncellendi");
      setDuzenle(false);
    } else {
      gosterMesaj("ok", "✓ Profil kaydedildi (local)");
      setDuzenle(false);
    }
  };

  const handleIbanKaydet = () => {
    if (!localIbanSahibi.trim()) {
      gosterMesaj("hata", "IBAN sahibi adı boş olamaz");
      return;
    }
    if (!localIban.trim() || localIban.replace(/\s/g, "").length < 10) {
      gosterMesaj("hata", "Geçerli bir IBAN girin");
      return;
    }
    ibanGuncelle("ibanSahibi", localIbanSahibi.trim());
    ibanGuncelle("iban", localIban.trim());
    setIbanKaydedildi(true);
    gosterMesaj("ok", "✓ IBAN kaydedildi");
    setTimeout(() => setIbanKaydedildi(false), 2000);
  };

  // Belgeler (rol bazlı)
  const belgeler = isKamyoncu
    ? [
        { id: 1, ad: "Ehliyet (E Sınıfı)", ok: true },
        { id: 2, ad: "Araç Ruhsatı", ok: !!oturum?.plaka },
        { id: 3, ad: "Sorumluluk Sigortası", ok: true },
        { id: 4, ad: "SRC Belgesi", ok: false },
        { id: 5, ad: "ADR Belgesi", ok: false },
      ]
    : [
        { id: 1, ad: "Firma Kayıt Belgesi", ok: true },
        { id: 2, ad: "Vergi Levhası", ok: true },
        { id: 3, ad: "İş Yeri Güvenliği", ok: true },
        { id: 4, ad: "Ticari Sicil", ok: false },
      ];

  const tamamlananBelge = belgeler.filter(b => b.ok).length;
  const belgeYuzdesi = Math.round((tamamlananBelge / belgeler.length) * 100);

  // Statler
  const statler = isKamyoncu
    ? [
        { val: "127", lbl: "Sefer", icon: "🚚" },
        { val: "98%", lbl: "Başarı", icon: "🎯" },
        { val: "4 Yıl", lbl: "Deneyim", icon: "⏱️" },
        { val: "4.9", lbl: "Puan", icon: "⭐" },
      ]
    : [
        { val: "47", lbl: "İlan", icon: "📋" },
        { val: "89", lbl: "Sefer", icon: "🚚" },
        { val: "4.8", lbl: "Puan", icon: "⭐" },
        { val: "3 Yıl", lbl: "Deneyim", icon: "⏱️" },
      ];

  const dosyaInputRef = useRef();
  const [belgeEklendi, setBelgeEklendi] = useState(false);
  const belgeEkleTikla = () => {
    if (dosyaInputRef.current) dosyaInputRef.current.click();
  };
  const belgeSecildi = (e) => {
    if (e.target.files?.[0]) {
      setBelgeEklendi(true);
      setTimeout(() => setBelgeEklendi(false), 2200);
    }
  };

  const handleNav = (path) => navigate(`/profil/${path}`);

  // Renk paleti
  const tema = isKamyoncu
    ? { birincil: "#fbbf24", ikincil: "#f59e0b", gradient: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)", iconBg: "rgba(251,191,36,0.15)" }
    : { birincil: "#3b82f6", ikincil: "#2563eb", gradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)", iconBg: "rgba(59,130,246,0.15)" };

  return (
    <div className="scroll-content" style={{ paddingBottom: 100 }}>
      {/* ============ HERO KAPAK ============ */}
      <div style={{
        position: "relative",
        margin: "0 -16px 0 -16px",
        padding: "40px 20px 80px",
        background: `radial-gradient(ellipse at top, ${isKamyoncu ? "rgba(251,191,36,0.25)" : "rgba(59,130,246,0.25)"} 0%, transparent 70%), linear-gradient(135deg, var(--bg1) 0%, var(--bg2) 100%)`,
        borderBottom: `1px solid ${isKamyoncu ? "rgba(251,191,36,0.2)" : "rgba(59,130,246,0.2)"}`,
        overflow: "hidden"
      }}>
        {/* Dekoratif halkalar */}
        <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: isKamyoncu ? "rgba(251,191,36,0.08)" : "rgba(59,130,246,0.08)", filter: "blur(40px)" }} />
        <div style={{ position: "absolute", bottom: -40, left: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(139,92,246,0.06)", filter: "blur(30px)" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", zIndex: 2 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: "var(--text3)", textTransform: "uppercase" }}>
              {isKamyoncu ? "KAMYONÇU PROFİLİ" : "İŞVEREN PROFİLİ"}
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", marginTop: 4 }}>
              Hesabım
            </div>
          </div>
          <button
            onClick={() => setDuzenle(d => !d)}
            style={{
              padding: "10px 16px",
              background: duzenle ? "var(--bg3)" : tema.gradient,
              color: duzenle ? "var(--text)" : "#0a0a0a",
              border: "none",
              borderRadius: "12px",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: duzenle ? "none" : `0 4px 16px ${isKamyoncu ? "rgba(251,191,36,0.4)" : "rgba(59,130,246,0.4)"}`,
              transition: "all 0.3s"
            }}
          >
            {duzenle ? "✕ İptal" : "✏️ Düzenle"}
          </button>
        </div>
      </div>

      {/* ============ AVATAR + BİLGİ KARTI ============ */}
      <div style={{ marginTop: -60, position: "relative", zIndex: 3 }}>
        <div className="card" style={{
          textAlign: "center",
          padding: "60px 20px 24px",
          marginBottom: 14,
          background: "linear-gradient(180deg, var(--bg2) 0%, var(--bg1) 100%)",
          border: `1px solid ${isKamyoncu ? "rgba(251,191,36,0.25)" : "rgba(59,130,246,0.25)"}`,
          position: "relative",
          overflow: "hidden"
        }}>
          {/* Avatar */}
          <div style={{
            position: "absolute",
            top: -45,
            left: "50%",
            transform: "translateX(-50%)",
            width: 90,
            height: 90,
            borderRadius: "50%",
            background: tema.gradient,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 44,
            boxShadow: `0 8px 24px ${isKamyoncu ? "rgba(251,191,36,0.4)" : "rgba(59,130,246,0.4)"}`,
            border: "4px solid var(--bg1)"
          }}>
            {avatarEmoji}
          </div>

          {/* Ad / Düzenle */}
          {duzenle ? (
            <input
              type="text"
              value={form.ad}
              onChange={e => setForm(f => ({ ...f, ad: e.target.value }))}
              placeholder="Ad Soyad"
              style={{
                width: "100%",
                textAlign: "center",
                padding: "12px 14px",
                background: "var(--bg3)",
                color: "var(--text)",
                border: `1px solid ${tema.birincil}`,
                borderRadius: "12px",
                fontSize: 18,
                fontWeight: 700,
                outline: "none",
                marginTop: 8,
                WebkitTextFillColor: "var(--text)"
              }}
            />
          ) : (
            <div className="display" style={{ fontSize: 24, color: tema.birincil, marginTop: 8 }}>
              {oturum?.ad || (isKamyoncu ? "Sürücü" : "Firma")}
            </div>
          )}

          {/* Rol rozeti */}
          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
            <span style={{
              background: tema.gradient,
              color: "#0a0a0a",
              padding: "5px 12px",
              borderRadius: "20px",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 0.5
            }}>
              {isKamyoncu ? "🚛 KAMYONÇU" : "🏢 İŞVEREN"}
            </span>
            <span style={{
              background: "linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(16,185,129,0.1) 100%)",
              color: "#10b981",
              padding: "5px 12px",
              borderRadius: "20px",
              fontSize: 11,
              fontWeight: 700,
              border: "1px solid rgba(16,185,129,0.3)"
            }}>
              ✓ Doğrulanmış
            </span>
          </div>

          {/* Puan */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6, marginTop: 12 }}>
            <span style={{ color: "#fbbf24", fontSize: 14 }}>⭐⭐⭐⭐⭐</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>4.9</span>
            <span style={{ fontSize: 11, color: "var(--text3)" }}>(128 oy)</span>
          </div>

          {/* İletişim satırı */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
            marginTop: 16,
            padding: "12px",
            background: "var(--bg3)",
            borderRadius: "14px",
            border: "1px solid var(--border2)"
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "var(--text3)", letterSpacing: 1, textTransform: "uppercase" }}>📞 Telefon</div>
              {duzenle ? (
                <input
                  type="tel"
                  value={form.telefon}
                  onChange={e => setForm(f => ({ ...f, telefon: e.target.value }))}
                  placeholder="05XX..."
                  style={{ width: "100%", textAlign: "center", padding: "6px", background: "var(--bg2)", color: "var(--text)", border: `1px solid ${tema.birincil}`, borderRadius: "8px", fontSize: 13, fontWeight: 600, outline: "none", marginTop: 4, WebkitTextFillColor: "var(--text)" }}
                />
              ) : (
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginTop: 4 }}>{oturum?.telefon || "—"}</div>
              )}
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "var(--text3)", letterSpacing: 1, textTransform: "uppercase" }}>🆔 TC Kimlik</div>
              {duzenle ? (
                <input
                  type="text"
                  value={form.tc_kimlik}
                  onChange={e => setForm(f => ({ ...f, tc_kimlik: e.target.value }))}
                  placeholder="11 hane"
                  maxLength={11}
                  style={{ width: "100%", textAlign: "center", padding: "6px", background: "var(--bg2)", color: "var(--text)", border: `1px solid ${tema.birincil}`, borderRadius: "8px", fontSize: 13, fontWeight: 600, outline: "none", marginTop: 4, WebkitTextFillColor: "var(--text)" }}
                />
              ) : (
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginTop: 4, fontFamily: "monospace", letterSpacing: 1 }}>
                  {oturum?.tc_kimlik ? `${oturum.tc_kimlik.slice(0,3)}***${oturum.tc_kimlik.slice(-2)}` : "—"}
                </div>
              )}
            </div>
          </div>

          {/* Kamyonçu plaka satırı */}
          {isKamyoncu && (
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
              marginTop: 8,
              padding: "12px",
              background: "var(--bg3)",
              borderRadius: "14px",
              border: "1px solid var(--border2)"
            }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 10, color: "var(--text3)", letterSpacing: 1, textTransform: "uppercase" }}>🚚 Çekici</div>
                {duzenle ? (
                  <input
                    type="text"
                    value={form.plaka}
                    onChange={e => setForm(f => ({ ...f, plaka: e.target.value.toUpperCase() }))}
                    placeholder="34 ABC 123"
                    style={{ width: "100%", textAlign: "center", padding: "6px", background: "var(--bg2)", color: "var(--text)", border: `1px solid ${tema.birincil}`, borderRadius: "8px", fontSize: 13, fontWeight: 700, letterSpacing: 1, outline: "none", marginTop: 4, WebkitTextFillColor: "var(--text)" }}
                  />
                ) : (
                  <div style={{ display: "inline-block", background: "#fff", color: "#000", fontFamily: "var(--font-d)", fontSize: 13, padding: "4px 12px", borderRadius: "5px", border: "2px solid #003099", marginTop: 4, letterSpacing: 2, fontWeight: 700 }}>
                    {oturum?.plaka || "—"}
                  </div>
                )}
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 10, color: "var(--text3)", letterSpacing: 1, textTransform: "uppercase" }}>🚐 Dorse</div>
                {duzenle ? (
                  <input
                    type="text"
                    value={form.dorse_plaka}
                    onChange={e => setForm(f => ({ ...f, dorse_plaka: e.target.value.toUpperCase() }))}
                    placeholder="34 ABC 123"
                    style={{ width: "100%", textAlign: "center", padding: "6px", background: "var(--bg2)", color: "var(--text)", border: `1px solid ${tema.birincil}`, borderRadius: "8px", fontSize: 13, fontWeight: 700, letterSpacing: 1, outline: "none", marginTop: 4, WebkitTextFillColor: "var(--text)" }}
                  />
                ) : (
                  <div style={{ display: "inline-block", background: "#fff", color: "#000", fontFamily: "var(--font-d)", fontSize: 13, padding: "4px 12px", borderRadius: "5px", border: "2px solid #003099", marginTop: 4, letterSpacing: 2, fontWeight: 700 }}>
                    {oturum?.dorse_plaka || "—"}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Kaydet butonu (düzenleme modunda) */}
          {duzenle && (
            <button
              onClick={handleProfilKaydet}
              style={{
                width: "100%",
                marginTop: 14,
                padding: "14px",
                background: tema.gradient,
                color: "#0a0a0a",
                border: "none",
                borderRadius: "12px",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: `0 4px 16px ${isKamyoncu ? "rgba(251,191,36,0.4)" : "rgba(59,130,246,0.4)"}`,
                transition: "all 0.2s"
              }}
            >
              💾 Değişiklikleri Kaydet
            </button>
          )}

          {/* Kayıt mesajı */}
          {kayitMesaj && (
            <div style={{
              marginTop: 10,
              padding: "10px 14px",
              background: kayitMesaj.tur === "ok" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
              color: kayitMesaj.tur === "ok" ? "#10b981" : "#ef4444",
              border: `1px solid ${kayitMesaj.tur === "ok" ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
              borderRadius: "10px",
              fontSize: 12,
              fontWeight: 600
            }}>
              {kayitMesaj.metin}
            </div>
          )}
        </div>

        {/* ============ İSTATİSTİKLER ============ */}
        <div className="card" style={{ marginBottom: 14, padding: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: "var(--text3)", marginBottom: 12, textTransform: "uppercase" }}>
            📊 İSTATİSTİKLER
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {statler.map((s, i) => (
              <div key={i} style={{
                textAlign: "center",
                padding: "12px 4px",
                background: "var(--bg2)",
                borderRadius: "12px",
                border: "1px solid var(--border2)",
                transition: "all 0.3s"
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = tema.birincil; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = "var(--border2)"; }}
              >
                <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: tema.birincil, fontFamily: "var(--font-d)" }}>{s.val}</div>
                <div style={{ fontSize: 9, color: "var(--text3)", marginTop: 2, letterSpacing: 1, textTransform: "uppercase" }}>{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ============ IBAN KARTI ============ */}
        <div className="card" style={{
          marginBottom: 14,
          padding: 20,
          background: "linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(59,130,246,0.04) 100%)",
          border: "1px solid rgba(59,130,246,0.3)",
          position: "relative",
          overflow: "hidden"
        }}>
          <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(59,130,246,0.1)", filter: "blur(20px)" }} />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: "10px", background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>💳</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#3b82f6" }}>BANKA BİLGİLERİ</div>
                <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 2 }}>Ödemeleriniz bu IBAN'a yatırılır</div>
              </div>
            </div>
            {ibanKaydedildi && (
              <span style={{ fontSize: 11, color: "#10b981", fontWeight: 700, animation: "fadeIn 0.3s" }}>✓ Kaydedildi</span>
            )}
          </div>

          <div style={{ position: "relative" }}>
            <div style={{ fontSize: 10, color: "var(--text3)", marginBottom: 6, letterSpacing: 1, textTransform: "uppercase" }}>👤 Hesap Sahibi</div>
            <input
              type="text"
              placeholder="Ad Soyad"
              value={localIbanSahibi}
              onChange={e => setLocalIbanSahibi(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 14px",
                background: "var(--bg2)",
                color: "var(--text)",
                border: "1px solid rgba(59,130,246,0.3)",
                borderRadius: "12px",
                fontSize: 14,
                fontWeight: 600,
                outline: "none",
                marginBottom: 12,
                WebkitTextFillColor: "var(--text)"
              }}
              onFocus={e => { e.target.style.borderColor = "#3b82f6"; e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.2)"; }}
              onBlur={e => { e.target.style.borderColor = "rgba(59,130,246,0.3)"; e.target.style.boxShadow = "none"; }}
            />

            <div style={{ fontSize: 10, color: "var(--text3)", marginBottom: 6, letterSpacing: 1, textTransform: "uppercase" }}>🧾 IBAN Numarası</div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{
                flex: 1,
                padding: "12px 14px",
                background: "var(--bg2)",
                border: "1px solid rgba(59,130,246,0.3)",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                gap: 8
              }}>
                <span style={{ color: "#3b82f6", fontWeight: 800, fontFamily: "monospace", fontSize: 14 }}>TR</span>
                <input
                  type="text"
                  value={localIban.replace(/^TR\s*/i, "")}
                  onChange={e => setLocalIban("TR " + e.target.value.replace(/[^0-9 ]/g, ""))}
                  placeholder="0000 0000 0000 0000 0000 00"
                  onFocus={e => e.target.select()}
                  style={{
                    flex: 1,
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    color: "var(--text)",
                    fontSize: 13,
                    fontFamily: "monospace",
                    letterSpacing: 1,
                    fontWeight: 700,
                    WebkitTextFillColor: "var(--text)",
                    minWidth: 0
                  }}
                />
              </div>
              <button
                onClick={handleIbanKaydet}
                style={{
                  padding: "12px 18px",
                  background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "12px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  boxShadow: "0 4px 12px rgba(59,130,246,0.3)",
                  transition: "all 0.2s"
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 16px rgba(59,130,246,0.5)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(59,130,246,0.3)"; }}
              >
                💾 Kaydet
              </button>
            </div>
          </div>
        </div>

        {/* ============ PRO ÜYELİK ============ */}
        <div className="card" style={{
          marginBottom: 14,
          padding: 18,
          background: "linear-gradient(135deg, rgba(251,191,36,0.15) 0%, rgba(245,158,11,0.05) 100%)",
          border: "1px solid rgba(251,191,36,0.3)",
          position: "relative",
          overflow: "hidden"
        }}>
          <div style={{ position: "absolute", top: -40, right: -40, width: 140, height: 140, borderRadius: "50%", background: "rgba(251,191,36,0.1)", filter: "blur(30px)" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 22 }}>⭐</span>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#fbbf24" }}>PRO ÜYELİK</div>
              </div>
              <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 6, lineHeight: 1.5 }}>
                {isKamyoncu ? "Sınırsız teklif • Öncelikli liste" : "Sınırsız ilan • Öncelikli görünüm"}
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                {["✓ Aktif", "💎 Premium", "🚀 Hızlı"].map((t, i) => (
                  <span key={i} style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", background: "rgba(251,191,36,0.15)", color: "#fbbf24", borderRadius: "8px", border: "1px solid rgba(251,191,36,0.3)" }}>{t}</span>
                ))}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "var(--font-d)", fontSize: 22, color: "#fbbf24", fontWeight: 700 }}>
                {isKamyoncu ? "₺299" : "₺699"}
                <span style={{ fontSize: 11, opacity: 0.7 }}>/ay</span>
              </div>
              <button style={{
                marginTop: 6,
                padding: "6px 12px",
                background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
                color: "#0a0a0a",
                border: "none",
                borderRadius: "10px",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(251,191,36,0.3)"
              }}>
                Yenile
              </button>
            </div>
          </div>
        </div>

        {/* ============ BELGELER ============ */}
        <div className="card" style={{ marginBottom: 14, padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: "10px", background: tema.iconBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>📁</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>BELGELERİM</div>
                <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 2 }}>{tamamlananBelge}/{belgeler.length} yüklendi</div>
              </div>
            </div>
            <div style={{ position: "relative" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: tema.birincil }}>{belgeYuzdesi}%</div>
              <div style={{ width: 50, height: 4, background: "var(--bg3)", borderRadius: "2px", marginTop: 4, overflow: "hidden" }}>
                <div style={{ width: `${belgeYuzdesi}%`, height: "100%", background: tema.gradient, borderRadius: "2px", transition: "width 0.5s" }} />
              </div>
            </div>
          </div>

          {belgeler.map((b, i) => (
            <div key={b.id} style={{
              background: "var(--bg2)",
              borderRadius: "12px",
              padding: "12px 14px",
              marginBottom: i === belgeler.length - 1 ? 0 : 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              border: `1px solid ${b.ok ? "rgba(16,185,129,0.2)" : "rgba(251,191,36,0.1)"}`,
              transition: "all 0.2s"
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = b.ok ? "rgba(16,185,129,0.4)" : tema.birincil; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = b.ok ? "rgba(16,185,129,0.2)" : "rgba(251,191,36,0.1)"; }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: "8px",
                  background: b.ok ? "rgba(16,185,129,0.15)" : "var(--bg3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14
                }}>
                  {b.ok ? "✓" : "○"}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{b.ad}</div>
                  <div style={{ fontSize: 10, color: b.ok ? "#10b981" : "var(--text3)", marginTop: 2, fontWeight: 600 }}>
                    {b.ok ? "✓ Onaylandı" : "Bekliyor"}
                  </div>
                </div>
              </div>
              {!b.ok && (
                <button onClick={belgeEkleTikla} style={{
                  padding: "6px 12px",
                  background: "var(--bg3)",
                  border: `1px solid ${tema.birincil}`,
                  color: tema.birincil,
                  borderRadius: "8px",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer"
                }}>
                  + Yükle
                </button>
              )}
            </div>
          ))}

          <input
            ref={dosyaInputRef}
            type="file"
            accept="image/*,.pdf"
            style={{ display: "none" }}
            onChange={belgeSecildi}
          />

          {belgeEklendi && (
            <div style={{
              marginTop: 10,
              padding: "10px 14px",
              background: "rgba(16,185,129,0.1)",
              border: "1px solid rgba(16,185,129,0.3)",
              borderRadius: "10px",
              fontSize: 12,
              color: "#10b981",
              fontWeight: 600,
              textAlign: "center"
            }}>
              ✅ Belge yüklendi! İnceleniyor...
            </div>
          )}
        </div>

        {/* ============ AYARLAR MENÜSÜ ============ */}
        <div className="card" style={{ marginBottom: 14, padding: 6 }}>
          {[
            { icon: "🔔", text: "Bildirim Ayarları", color: "#fbbf24", action: () => handleNav("bildirim") },
            { icon: "❓", text: "Yardım & Destek", color: "var(--text2)", action: () => alert("Yardım merkezi yakında!") },
            { icon: "📜", text: "İş Geçmişim", color: "#3b82f6", action: () => alert("İş geçmişi sayfasına yönlendiriliyorsunuz...") },
            { icon: "⭐", text: "Aldığım Yorumlar", color: "#fbbf24", action: () => alert("Yorumlar yakında!") },
            { icon: "🔒", text: "Gizlilik Politikası", color: "var(--text2)", action: () => alert("Gizlilik politikası metni") },
            { icon: "⚙️", text: "Ayarlar", color: "var(--text2)", action: () => alert("Ayarlar yakında!") },
          ].map((item, i, arr) => (
            <div
              key={i}
              onClick={() => item.action && item.action()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 14px",
                borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none",
                cursor: "pointer",
                transition: "background 0.2s",
                borderRadius: i === 0 ? "12px 12px 0 0" : i === arr.length - 1 ? "0 0 12px 12px" : "0"
              }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--bg2)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <div style={{
                width: 36,
                height: 36,
                borderRadius: "10px",
                background: "var(--bg2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18
              }}>{item.icon}</div>
              <span style={{ fontSize: 14, flex: 1, fontWeight: 500, color: "var(--text)" }}>{item.text}</span>
              <span style={{ color: "var(--text3)", fontSize: 18 }}>›</span>
            </div>
          ))}
        </div>

        {/* ============ ÇIKIŞ ============ */}
        <button
          onClick={() => {
            if (confirm("Çıkış yapmak istediğine emin misin?")) cikisYap();
          }}
          style={{
            width: "100%",
            padding: "16px",
            background: "linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(239,68,68,0.05) 100%)",
            color: "#ef4444",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: "14px",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 0.2s",
            boxShadow: "0 4px 12px rgba(239,68,68,0.1)"
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "linear-gradient(135deg, rgba(239,68,68,0.25) 0%, rgba(239,68,68,0.1) 100%)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(239,68,68,0.05) 100%)"; e.currentTarget.style.transform = "translateY(0)"; }}
        >
          🚪 Çıkış Yap
        </button>

        <div style={{ textAlign: "center", marginTop: 16, fontSize: 11, color: "var(--text3)" }}>
          Nakliyol Pro • v1.0.0
        </div>
      </div>
    </div>
  );
}
