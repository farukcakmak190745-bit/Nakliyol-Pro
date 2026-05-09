import React, { useState, useEffect, useRef } from "react";
import { useApp } from "../../context/AppContext";
import { useNavigate } from "react-router-dom";

export default function KamyoncuProfil() {
  const { oturum, cikisYap, ibanGuncelle } = useApp();
  const navigate = useNavigate();
  const [belgeEklendi, setBelgeEklendi] = useState(false);

  const [localIbanSahibi, setLocalIbanSahibi] = useState("");
  const [localIban, setLocalIban] = useState("");

  const handleIbanSahibiGuncelle = (deger) => {
    setLocalIbanSahibi(deger);
  };

  const handleIbanGuncelle = (deger) => {
    setLocalIban(deger);
    // Formdan çıkıldığında veya "Güncelle" butonuna basıldığında oturuma kaydet
    if (deger.trim()) {
      ibanGuncelle("ibanSahibi", localIbanSahibi);
      ibanGuncelle("iban", localIban);
      alert("IBAN bilgileriniz güncellendi!");
    }
  };

  // Component mount olduğunda oturum değerlerini local state'e kopyala
  useEffect(() => {
    if (oturum?.ibanSahibi) setLocalIbanSahibi(oturum.ibanSahibi);
    if (oturum?.iban) setLocalIban(oturum.iban);
  }, [oturum]);

  const handleNav = (path) => {
    navigate(`/profil/${path}`);
  };

  const belgeler = [
    { id: 1, ad: "Ehliyet (E Sınıfı)", ok: true, tarih: "2018-03-15" },
    { id: 2, ad: "Araç Ruhsatı", ok: true, tarih: "2019-07-20" },
    { id: 3, ad: "Sorumluluk Sigortası", ok: true, tarih: "2024-01-10" },
    { id: 4, ad: "SRC Belgesi", ok: false, tarih: "-" },
    { id: 5, ad: "ADR Belgesi", ok: false, tarih: "-" },
  ];

  const statler = [
    { val: "127", lbl: "Sefer" },
    { val: "98%", lbl: "Başarı" },
    { val: "4 Yıl", lbl: "Deneyim" },
    { val: "274", lbl: "KM" },
    { val: "4.9", lbl: "Puan" },
  ];

  const dosyaInputRef = useRef();

  const belgeEkle = () => {
    if (dosyaInputRef.current?.value) {
      setBelgeEklendi(true);
      setTimeout(() => setBelgeEklendi(false), 2000);
    }
  };

  return (
    <div className="scroll-content">
      <div className="card" style={{ textAlign: "center", padding: 28, marginBottom: 14 }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>🚛</div>
        <div className="display" style={{ fontSize: 28, color: "#fbbf24" }}>{oturum?.ad || "Mehmet Yılmaz"}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
          <span>⭐</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#fbbf24" }}>4.9 — Güvenilir Sürücü</span>
        </div>
        <div style={{ marginTop: 14 }}>
          <span style={{ background: "linear-gradient(135deg, var(--guldum-gradient), var(--purple-gradient))", color: "#fff", padding: "8px 16px", borderRadius: "20px", fontSize: 12, fontWeight: 700, letterSpacing: 0.5 }}>34 TYK 421</span>
        </div>
        <div style={{ marginTop: 6, fontSize: 12, color: "var(--text2)" }}>TIR • İstanbul</div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginTop: 18 }}>
          {statler.map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#fbbf24" }}>{s.val}</div>
              <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 2, letterSpacing: 1.5 }}>{s.lbl}</div>
            </div>
          ))}
        </div>

        {/* BANKA BİLGİLERİ */}
        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#3b82f6", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <span>💳</span>
            <span>BANKA BİLGİLERİ</span>
          </div>

          <div style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(59,130,246,0.05) 100%)", borderRadius: "12px", padding: 20, border: "1px solid rgba(59,130,246,0.3)" }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 8 }}>👤 SAHİBİNİN ADI</div>
              <input
                type="text"
                placeholder="Ad Soyad"
                value={localIbanSahibi}
                onChange={e => setLocalIbanSahibi(e.target.value)}
                style={{ width: "100%", padding: "12px 16px", background: "var(--bg2)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: "12px", fontSize: 14, outline: "none", color: "#fff" }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#3b82f6";
                  e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.2)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(59,130,246,0.3)";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 8 }}>🧾 IBAN</div>
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{
                  flex: 1,
                  padding: "12px 16px",
                  background: "var(--bg2)",
                  border: "1px solid rgba(59,130,246,0.3)",
                  borderRadius: "12px",
                  fontSize: 15,
                  outline: "none",
                  fontFamily: "monospace",
                  letterSpacing: "1px",
                  color: "transparent",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  cursor: "text"
                }}>
                  <span style={{ color: "#fff" }}>TR</span>
                  <input
                    type="text"
                    value={localIban.replace(/^TR\s*/i, "")}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setLocalIban("TR " + newValue);
                    }}
                    onFocus={(e) => {
                      e.target.select();
                    }}
                    style={{
                      flex: 1,
                      border: "none",
                      outline: "none",
                      background: "transparent",
                      fontSize: 15,
                      fontFamily: "monospace",
                      letterSpacing: "1px",
                      color: "#fff",
                      fontWeight: 700,
                      cursor: "text",
                      lineHeight: "1.2"
                    }}
                  />
                </div>
                <button
                  onClick={() => handleIbanGuncelle(localIban)}
                  style={{
                    padding: "12px 20px",
                    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "12px",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    boxShadow: "0 2px 8px rgba(59,130,246,0.3)"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(59,130,246,0.5)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(59,130,246,0.3)";
                  }}
                >
                  Güncelle
                </button>
              </div>
              {localIban && !localIban.match(/^TR\s*\d+\s*$/i) && (
                <div style={{ fontSize: 11, color: "#3b82f6", marginTop: 6 }}>
                  ⚠️ Tam IBAN formatı: TR + sayılar
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14, background: "linear-gradient(135deg, rgba(251,191,36,0.08) 0%, rgba(251,191,36,0.04) 100%)", border: "1px solid rgba(251,191,36,0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: "#fbbf24" }}>⭐ Pro Üye</div>
            <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>Sınırsız teklif • Öncelikli görünüm</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "var(--font-d)", fontSize: 20, color: "#fbbf24" }}>₺299/ay</div>
            <div style={{ fontSize: 11, color: "#10b981" }}>✓ Aktif</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 20 }}>📁</span>
            <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1.5, color: "#fbbf24" }}>BELGELERİM</span>
          </div>
          {belgeEklendi && (
            <div style={{ fontSize: 12, color: "#10b981", animation: "fadeIn 0.3s" }}>✅ Eklendi!</div>
          )}
        </div>

        {belgeler.map((b) => (
          <div key={b.id} style={{
            background: "var(--bg2)",
            borderRadius: "12px",
            padding: "14px",
            marginBottom: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            border: "1px solid rgba(251,191,36,0.1)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {b.ok ? (
                <span style={{ color: "#10b981", fontSize: 22 }}>✓</span>
              ) : (
                <span style={{ color: "var(--text3)", fontSize: 22 }}>○</span>
              )}
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{b.ad}</div>
                {b.tarih !== "-" && <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>{b.tarih}</div>}
              </div>
            </div>
            <div style={{ fontSize: 11, color: "var(--text3)" }}> {b.tarih}</div>
          </div>
        ))}

        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <input
            ref={dosyaInputRef}
            type="file"
            id={`belge-input`}
            accept="image/*,.pdf"
            style={{ display: "none" }}
          />
          <label htmlFor={`belge-input`} style={{ flex: 1 }}>
            <button className="btn btn-secondary" style={{ width: "100%", fontSize: 13, padding: "12px" }}>
              + Belge Ekle
            </button>
          </label>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 10 }}>
        {[
          { icon: "🔔", text: "Bildirim Ayarları", color: "#fbbf24", action: () => handleNav("bildirim") },
          { icon: "❓", text: "Yardım & Destek", color: "var(--text2)" },
          { icon: "🔒", text: "Gizlilik Politikası", color: "var(--text2)" },
          { icon: "⚙️", text: "Ayarlar", color: "var(--text2)" },
        ].map((item, i) => (
          <div
            key={i}
            onClick={() => item.action && item.action()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "16px 14px",
              borderBottom: i < 3 ? "1px solid rgba(251,191,36,0.1)" : "none",
              cursor: item.action ? "pointer" : "default",
              transition: "background 0.2s",
              borderRadius: i === 0 ? "12px 12px 0 0" : i === 3 ? "0 0 12px 12px" : "0",
              border: "1px solid transparent",
              borderBottom: "none"
            }}
            onMouseEnter={e => {
              if (item.action) {
                e.currentTarget.style.background = "var(--bg2)";
                e.currentTarget.style.borderColor = "rgba(251,191,36,0.1)";
              }
            }}
            onMouseLeave={e => {
              if (item.action) {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.borderColor = "transparent";
                e.currentTarget.style.borderBottom = i < 3 ? "1px solid rgba(251,191,36,0.1)" : "none";
              }
            }}
          >
            <span style={{ fontSize: 22, width: 36 }}>{item.icon}</span>
            <span style={{ fontSize: 14, flex: 1 }}>{item.text}</span>
            <span style={{ color: "var(--text3)" }}>›</span>
          </div>
        ))}
      </div>

      <button onClick={cikisYap} className="btn btn-danger btn-full" style={{ marginTop: 10, padding: "14px" }}>
        🚪 Çıkış Yap
      </button>
    </div>
  );
}
