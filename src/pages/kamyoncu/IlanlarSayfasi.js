import { useState } from "react";
import { useApp } from "../../context/AppContext";
import { EmptyState } from "../../components/UI";

const IlanKart = ({ ilan, onClick }) => {
  const getIkon = (yuk) => {
    if (yuk.includes("kömür")) return "🔥";
    if (yuk.includes("çelik") || yuk.includes("boru")) return "🔩";
    if (yuk.includes("soğutma") || yuk.includes("gıda")) return "❄️";
    if (yuk.includes("meyve") || yuk.includes("sebze")) return "🍊";
    if (yuk.includes("inşaat") || yuk.includes("damper")) return "🏗️";
    if (yuk.includes("elektronik") || yuk.includes("bilgisayar")) return "💻";
    if (yuk.includes("teknoloji")) return "📡";
    if (yuk.includes("ambalaj")) return "📦";
    if (yuk.includes("bebek") || yuk.includes("giyim")) return "👶";
    if (yuk.includes("madde")) return "⚗️";
    return "🚚";
  };

  const aracIkon = {
    "TIR": "🚛",
    "10 Teker Açık": "🚚",
    "10 Teker Tenteli": "⛺",
    "Kırkayak Açık": "🚚",
    "Kamyonet": "🚐",
    "50 NC Kamyon": "🚐",
    "Diğer": "📦",
  };

  return (
    <div className="card" style={{ marginBottom: 14 }} onClick={onClick}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 32 }}>{getIkon(ilan.yuk)}</div>
          <div>
            <div className="display" style={{ fontSize: 18, color: "#fbbf24", letterSpacing: 0.5 }}>{ilan.yuk}</div>
            <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 2, letterSpacing: 1.5, textTransform: "uppercase" }}>Yük Tipi</div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="price">₺{ilan.toplamUcret?.toLocaleString() || ilan.ucret.toLocaleString()}</div>
          <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 2 }}>
            {ilan.kdvOrani > 0 ? "💵 +KDV" : "💵 Sabit"}
          </div>
        </div>
      </div>

      <div style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.6, marginBottom: 12, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
        {ilan.aciklama || "Açıklama yok"}
      </div>

      <div className="rota" style={{ marginBottom: 12 }}>
        <span className="rota-city">{ilan.nereden}</span>
        <span className="rota-arrow">→</span>
        <span className="rota-city">{ilan.nereye}</span>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        <div style={{ background: "linear-gradient(135deg, rgba(251,191,36,0.15) 0%, rgba(251,191,36,0.08) 100%)", padding: "6px 12px", borderRadius: "12px", fontSize: 11, fontWeight: 600, color: "#fbbf24", border: "1px solid rgba(251,191,36,0.2)" }}>
          📅 {ilan.tarih}
        </div>
        <div style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(59,130,246,0.08) 100%)", padding: "6px 12px", borderRadius: "12px", fontSize: 11, fontWeight: 600, color: "#3b82f6", border: "1px solid rgba(59,130,246,0.2)" }}>
          {aracIkon[ilan.aracTip] || "🚛"} {ilan.aracTip}
        </div>
        <div style={{ background: "linear-gradient(135deg, rgba(251,191,36,0.15) 0%, rgba(251,191,36,0.08) 100%)", padding: "6px 12px", borderRadius: "12px", fontSize: 11, fontWeight: 600, color: "#fbbf24", border: "1px solid rgba(251,191,36,0.2)" }}>
          📅 {ilan.odemeGun === 0 ? "💰 Peşin" : `${ilan.odemeGun} Gün Ödeme`}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTop: "1px solid rgba(251,191,36,0.15)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, var(--guldum-gradient), var(--purple-gradient))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
            {ilan.olusturanPuan >= 4.5 ? "⭐" : ilan.olusturanPuan >= 4 ? "✦" : "•"}
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{ilan.olusturan}</div>
            <div style={{ fontSize: 10, color: "var(--text3)" }}>{ilan.olusturanPuan?.toFixed(1)} puan</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "var(--text3)" }}>İstek:</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#3b82f6" }}>{ilan.istekSayisi}</span>
        </div>
      </div>
    </div>
  );
};

export default function IlanlarSayfasi() {
  const { ilanlar, ilanAl, başvuruGonder, oturum } = useApp();
  const [filtre, setFiltre] = useState("");
  const [secilen, setSecilen] = useState(null);
  const [secilenBasvuru, setSecilenBasvuru] = useState(null);

  // Debug: ilanları ve oturumu logla
  console.log("IlanlarSayfasi - ilanlar:", ilanlar.length, "oturum:", oturum);

  const liste = ilanlar.filter(i =>
    i.nereden.toLowerCase().includes(filtre.toLowerCase()) ||
    i.nereye.toLowerCase().includes(filtre.toLowerCase()) ||
    i.yuk.toLowerCase().includes(filtre.toLowerCase())
  );

  const sec = () => {
    if (!oturum) {
      console.log("Oturum yok, ilan alınamıyor");
      alert("Lütfen önce giriş yapın!");
      return;
    }
    ilanAl(secilen.id, oturum);
    setSecilen(null);
  };

  return (
    <div className="scroll-content">
      <div className="search-bar" style={{ marginBottom: 18 }}>
        <span className="search-icon">🔍</span>
        <input placeholder="Şehir veya yük türü ara..." value={filtre} onChange={e => setFiltre(e.target.value)} />
        {filtre && <button onClick={() => setFiltre("")} style={{ color: "var(--text3)", fontSize: 16, transition: "var(--tr)" }}>✕</button>}
      </div>

      <div className="section-title">AKTİF İLANLAR ({liste.length})</div>

      {liste.length === 0
        ? <EmptyState icon="🔍" text="Sonuç bulunamadı" />
        : liste.map(i => <IlanKart key={i.id} ilan={i} onClick={() => setSecilen(i)} />)
      }

      {secilen && (
        <div className="sheet-overlay" onClick={() => setSecilen(null)}>
          <div className="sheet">
            <button onClick={() => setSecilen(null)} style={{ position: "fixed", top: 20, right: 20, background: "var(--bg1)", border: "1px solid var(--border2)", borderRadius: "12px", padding: "12px 16px", fontSize: 18, cursor: "pointer", zIndex: 101, transition: "var(--tr)" }} onMouseEnter={e => e.currentTarget.style.borderColor = "var(--sari)"} onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border2)"}>✕</button>
            <div style={{ maxWidth: 440, margin: "0 auto", padding: 24, paddingTop: 60 }}>
              <div className="display" style={{ fontSize: 28, color: "#fbbf24", marginBottom: 8 }}>{secilen?.yuk || "İlan Detay"}</div>
              <div style={{ display: "inline-block", background: "var(--guldum-gradient)", color: "#0a0a0a", padding: "6px 16px", borderRadius: "20px", fontSize: 11, fontWeight: 700, marginBottom: 12 }}>
                ₺{secilen?.ucret?.toLocaleString() || 0} - {secilen?.tarih || "-"}
              </div>
              <div className="rota" style={{ marginBottom: 16 }}>
                <span className="rota-city">{secilen?.nereden || "-"}</span>
                <span className="rota-arrow">→</span>
                <span className="rota-city">{secilen?.nereye || "-"}</span>
              </div>
              <div style={{ color: "var(--text2)", fontSize: 13, lineHeight: 1.8, marginBottom: 24, background: "rgba(22,22,22,0.5)", padding: 14, borderRadius: "12px", border: "1px solid rgba(251,191,36,0.1)" }}>
                {secilen?.aciklama || "Açıklama yok"}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
                {[
                  { k: "Tonaj", v: secilen?.ton > 0 ? `${secilen.ton} Ton` : "🔥 Serbest" },
                  { k: "Ödeme Planı", v: secilen?.odemeGun === 0 ? "💰 Peşin" : `${secilen.odemeGun} Gün Sonra` },
                  { k: "Ücret", v: `₺${secilen?.ucret?.toLocaleString() || 0}` },
                  { k: "Araç Tipi", v: secilen?.aracTip || "-" },
                ].map(({ k, v }, idx) => (
                  <div key={k} style={{ background: "var(--bg2)", borderRadius: "12px", padding: "14px 12px", border: "1px solid rgba(251,191,36,0.1)" }}>
                    <div style={{ fontSize: 10, color: "var(--text3)", marginBottom: 6, letterSpacing: 1.5, textTransform: "uppercase" }}>{k}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{v}</div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setSecilenBasvuru({ id: secilen?.id, bilgiler: {} })}
                className="btn btn-display-gold btn-full"
                style={{ fontSize: 20, padding: "18px", letterSpacing: 3 }}
              >
                📝 BAŞVURU YAP
              </button>
            </div>
          </div>
        </div>
      )}

      {secilenBasvuru && (
        <div className="sheet-overlay" onClick={() => setSecilenBasvuru(null)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSecilenBasvuru(null)} style={{ position: "fixed", top: 20, right: 20, background: "var(--bg1)", border: "1px solid var(--border2)", borderRadius: "12px", padding: "12px 16px", fontSize: 18, cursor: "pointer", zIndex: 101 }}>✕</button>
            <div style={{ maxWidth: 440, margin: "0 auto", padding: 24, paddingTop: 60 }}>
              <div style={{ fontSize: 24, color: "#fbbf24", marginBottom: 8 }}>📝 BAŞVURU YAP</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", marginBottom: 20 }}>
                {secilen?.yuk} - {secilen?.nereden} → {secilen?.nereye}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    placeholder="Ad Soyad *"
                    value={secilenBasvuru?.bilgiler?.ad || ""}
                    onChange={e => setSecilenBasvuru(p => ({
                      ...p,
                      bilgiler: { ad: e.target.value, tel: p?.bilgiler?.tel || "", dorsePlaka: p?.bilgiler?.dorsePlaka || "", cekiciPlaka: p?.bilgiler?.cekiciPlaka || "", tc_kimlik: p?.bilgiler?.tc_kimlik || "" }
                    }))}
                    style={{
                      padding: "16px 14px 16px 50px",
                      background: "var(--bg2)",
                      border: "1px solid var(--border2)",
                      borderRadius: "16px",
                      fontSize: 14,
                      outline: "none",
                      transition: "all 0.3s ease",
                      boxShadow: "inset 0 2px 8px rgba(0,0,0,0.2)"
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#fbbf24";
                      e.target.style.boxShadow = "inset 0 2px 8px rgba(0,0,0,0.2), 0 0 0 3px rgba(251,191,36,0.2)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "var(--border2)";
                      e.target.style.boxShadow = "inset 0 2px 8px rgba(0,0,0,0.2)";
                    }}
                  />
                  <div style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#fbbf24", fontSize: "18px" }}>👤</div>
                </div>
                <div style={{ position: "relative" }}>
                  <input
                    type="tel"
                    placeholder="Telefon *"
                    value={secilenBasvuru?.bilgiler?.tel || ""}
                    onChange={e => setSecilenBasvuru(p => ({
                      ...p,
                      bilgiler: { ad: p?.bilgiler?.ad || "", tel: e.target.value, dorsePlaka: p?.bilgiler?.dorsePlaka || "", cekiciPlaka: p?.bilgiler?.cekiciPlaka || "", tc_kimlik: p?.bilgiler?.tc_kimlik || "" }
                    }))}
                    style={{
                      padding: "16px 14px 16px 50px",
                      background: "var(--bg2)",
                      border: "1px solid var(--border2)",
                      borderRadius: "16px",
                      fontSize: 14,
                      outline: "none",
                      transition: "all 0.3s ease",
                      boxShadow: "inset 0 2px 8px rgba(0,0,0,0.2)"
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#fbbf24";
                      e.target.style.boxShadow = "inset 0 2px 8px rgba(0,0,0,0.2), 0 0 0 3px rgba(251,191,36,0.2)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "var(--border2)";
                      e.target.style.boxShadow = "inset 0 2px 8px rgba(0,0,0,0.2)";
                    }}
                  />
                  <div style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#fbbf24", fontSize: "18px" }}>📱</div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    placeholder="Çekici Plakası *"
                    value={secilenBasvuru?.bilgiler?.cekiciPlaka || ""}
                    onChange={e => setSecilenBasvuru(p => ({
                      ...p,
                      bilgiler: { ad: p?.bilgiler?.ad || "", tel: p?.bilgiler?.tel || "", cekiciPlaka: e.target.value, dorsePlaka: p?.bilgiler?.dorsePlaka || "", tc_kimlik: p?.bilgiler?.tc_kimlik || "" }
                    }))}
                    style={{
                      padding: "16px 14px 16px 50px",
                      background: "var(--bg2)",
                      border: "1px solid var(--border2)",
                      borderRadius: "16px",
                      fontSize: 14,
                      outline: "none",
                      transition: "all 0.3s ease",
                      boxShadow: "inset 0 2px 8px rgba(0,0,0,0.2)"
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#fbbf24";
                      e.target.style.boxShadow = "inset 0 2px 8px rgba(0,0,0,0.2), 0 0 0 3px rgba(251,191,36,0.2)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "var(--border2)";
                      e.target.style.boxShadow = "inset 0 2px 8px rgba(0,0,0,0.2)";
                    }}
                  />
                  <div style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#3b82f6", fontSize: "18px" }}>🚚</div>
                </div>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    placeholder="Dorse Plakası *"
                    value={secilenBasvuru?.bilgiler?.dorsePlaka || ""}
                    onChange={e => setSecilenBasvuru(p => ({
                      ...p,
                      bilgiler: { ad: p?.bilgiler?.ad || "", tel: p?.bilgiler?.tel || "", cekiciPlaka: p?.bilgiler?.cekiciPlaka || "", dorsePlaka: e.target.value, tc_kimlik: p?.bilgiler?.tc_kimlik || "" }
                    }))}
                    style={{
                      padding: "16px 14px 16px 50px",
                      background: "var(--bg2)",
                      border: "1px solid var(--border2)",
                      borderRadius: "16px",
                      fontSize: 14,
                      outline: "none",
                      transition: "all 0.3s ease",
                      boxShadow: "inset 0 2px 8px rgba(0,0,0,0.2)"
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#fbbf24";
                      e.target.style.boxShadow = "inset 0 2px 8px rgba(0,0,0,0.2), 0 0 0 3px rgba(251,191,36,0.2)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "var(--border2)";
                      e.target.style.boxShadow = "inset 0 2px 8px rgba(0,0,0,0.2)";
                    }}
                  />
                  <div style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#3b82f6", fontSize: "18px" }}>🚐</div>
                </div>
              </div>

              <div style={{ position: "relative", marginBottom: 20 }}>
                <input
                  type="text"
                  placeholder="TC Kimlik No *"
                  value={secilenBasvuru?.bilgiler?.tc_kimlik || ""}
                  onChange={e => setSecilenBasvuru(p => ({
                    ...p,
                    bilgiler: { ...p?.bilgiler, ad: p?.bilgiler?.ad || "", tel: p?.bilgiler?.tel || "", cekiciPlaka: p?.bilgiler?.cekiciPlaka || "", dorsePlaka: p?.bilgiler?.dorsePlaka || "", tc_kimlik: e.target.value }
                  }))}
                  style={{
                    width: "100%",
                    padding: "16px 14px 16px 50px",
                    background: "var(--bg2)",
                    border: "1px solid var(--border2)",
                    borderRadius: "16px",
                    fontSize: 14,
                    outline: "none",
                    transition: "all 0.3s ease",
                    boxShadow: "inset 0 2px 8px rgba(0,0,0,0.2)"
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#fbbf24";
                    e.target.style.boxShadow = "inset 0 2px 8px rgba(0,0,0,0.2), 0 0 0 3px rgba(251,191,36,0.2)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "var(--border2)";
                    e.target.style.boxShadow = "inset 0 2px 8px rgba(0,0,0,0.2)";
                  }}
                />
                <div style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#fbbf24", fontSize: "18px" }}>🆔</div>
              </div>

              <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 24, lineHeight: 1.6 }}>
                <span style={{ color: "#fbbf24" }}>✓</span> Bu bilgiler işverene otomatik olarak gönderilecek
              </div>

              <button
                onClick={() => {
                  if (!secilenBasvuru?.bilgiler?.ad || !secilenBasvuru?.bilgiler?.tel || !secilenBasvuru?.bilgiler?.cekiciPlaka || !secilenBasvuru?.bilgiler?.dorsePlaka || !secilenBasvuru?.bilgiler?.tc_kimlik) {
                    alert("Lütfen tüm zorunlu alanları doldurun!");
                    return;
                  }
                  başvuruGonder(secilenBasvuru.id, {
                    ad: secilenBasvuru.bilgiler.ad,
                    tel: secilenBasvuru.bilgiler.tel,
                    cekiciPlaka: secilenBasvuru.bilgiler.cekiciPlaka,
                    dorsePlaka: secilenBasvuru.bilgiler.dorsePlaka,
                    tc_kimlik: secilenBasvuru.bilgiler.tc_kimlik,
                  });
                  setSecilenBasvuru(null);
                  alert("Başvurunuz gönderildi! İşveren onay bekliyor.");
                }}
                style={{
                  flex: 1,
                  padding: "18px",
                  background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
                  color: "#0a0a0a",
                  border: "none",
                  borderRadius: "16px",
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  position: "relative",
                  overflow: "hidden",
                  boxShadow: "0 4px 20px rgba(251, 191, 36, 0.3)"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 8px 25px rgba(251, 191, 36, 0.5)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 20px rgba(251, 191, 36, 0.3)";
                }}
              >
                📝 Gönder
              </button>

              <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
                <button
                  onClick={() => setSecilenBasvuru(null)}
                  style={{
                    flex: 1,
                    padding: "18px",
                    background: "var(--bg1)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    borderRadius: "16px",
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    position: "relative",
                    overflow: "hidden",
                    color: "#ef4444"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#ef4444";
                    e.currentTarget.style.background = "linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 4px 15px rgba(239, 68, 68, 0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.3)";
                    e.currentTarget.style.background = "var(--bg1)";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  ✕ İptal
                </button>
                <button
                  onClick={() => {
                    if (!secilenBasvuru?.bilgiler?.ad || !secilenBasvuru?.bilgiler?.tel || !secilenBasvuru?.bilgiler?.cekiciPlaka || !secilenBasvuru?.bilgiler?.dorsePlaka || !secilenBasvuru?.bilgiler?.tc_kimlik) {
                      alert("Lütfen tüm zorunlu alanları doldurun!");
                      return;
                    }
                    başvuruGonder(secilenBasvuru.id, {
                      ad: secilenBasvuru.bilgiler.ad,
                      tel: secilenBasvuru.bilgiler.tel,
                      cekiciPlaka: secilenBasvuru.bilgiler.cekiciPlaka,
                      dorsePlaka: secilenBasvuru.bilgiler.dorsePlaka,
                      tc_kimlik: secilenBasvuru.bilgiler.tc_kimlik,
                    });
                    setSecilenBasvuru(null);
                    alert("Başvurunuz gönderildi! İşveren onay bekliyor.");
                  }}
                  style={{
                    flex: 1,
                    padding: "18px",
                    background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
                    color: "#0a0a0a",
                    border: "none",
                    borderRadius: "16px",
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    position: "relative",
                    overflow: "hidden",
                    boxShadow: "0 4px 20px rgba(251, 191, 36, 0.3)"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 8px 25px rgba(251, 191, 36, 0.5)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 20px rgba(251, 191, 36, 0.3)";
                  }}
                >
                  📝 Gönder
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
