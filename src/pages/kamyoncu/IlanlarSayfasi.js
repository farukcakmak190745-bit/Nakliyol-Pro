import { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { EmptyState, formatTarih } from "../../components/UI";
import { IconMap } from "../../components/Icons";
import IlIlceSecici from "../../components/IlIlceSecici";
import { harfFiltre, plakaFiltre, rakamFiltre } from "../../utils/inputFilters";
import { kullaniciSeferOzeti } from "../../utils/istatistik";

const ilAdiniAl = (sehir) => {
  if (!sehir) return "";
  return String(sehir).split(" / ")[0].trim();
};

const IlanKart = ({ ilan, onClick, donus = false }) => {
  const { profiliGoster, seferler } = useApp();
  const ilanSahibiOzeti = kullaniciSeferOzeti(seferler, ilan.olusturan_id, false);
  const getYukIcon = (yuk) => {
    if (yuk.includes("kömür")) return "fire";
    if (yuk.includes("çelik") || yuk.includes("boru")) return "wrench";
    if (yuk.includes("soğutma") || yuk.includes("gıda")) return "snowflake";
    if (yuk.includes("meyve") || yuk.includes("sebze")) return "package";
    if (yuk.includes("inşaat") || yuk.includes("damper")) return "hammer";
    if (yuk.includes("elektronik") || yuk.includes("bilgisayar")) return "monitor";
    if (yuk.includes("teknoloji")) return "radio";
    if (yuk.includes("ambalaj")) return "box";
    if (yuk.includes("bebek") || yuk.includes("giyim")) return "baby";
    if (yuk.includes("madde")) return "flask";
    return "truck";
  };

  const aracIkon = {
    "TIR": "tr",
    "10 Teker Açık": "tr",
    "10 Teker Tenteli": "tr",
    "Kırkayak Açık": "tr",
    "Kamyonet": "arac",
    "50 NC Kamyon": "arac",
    "Diğer": "box",
  };

  return (
    <div className="card" style={{ marginBottom: 14 }} onClick={onClick}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 32 }}>
            {(() => {
              const Icon = IconMap[getYukIcon(ilan.yuk)] || IconMap.truck;
              return <Icon size={32} className="icon-primary" />;
            })()}
          </div>
          <div>
            <div className="display" style={{ fontSize: 18, color: "#fbbf24", letterSpacing: 0.5 }}>{ilan.yuk}</div>
            <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 2, letterSpacing: 1.5, textTransform: "uppercase" }}>Yük Tipi</div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="price">₺{ilan.ucret?.toLocaleString()}</div>
          {ilan.kdvOrani > 0 && <div style={{ fontSize: 10, color: "#10b981", marginTop: 2 }}>+KDV</div>}
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
        {donus && (
          <div style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(16,185,129,0.1) 100%)", padding: "6px 12px", borderRadius: "12px", fontSize: 11, fontWeight: 700, color: "#10b981", border: "1px solid rgba(16,185,129,0.35)", letterSpacing: 0.5 }}>
            🔄 DÖNÜŞ YÜKÜ
          </div>
        )}
        <div style={{ background: "linear-gradient(135deg, rgba(251,191,36,0.15) 0%, rgba(251,191,36,0.08) 100%)", padding: "6px 12px", borderRadius: "12px", fontSize: 11, fontWeight: 600, color: "#fbbf24", border: "1px solid rgba(251,191,36,0.2)" }}>
          <IconMap.calendar size={12} className="icon-primary" /> {formatTarih(ilan.tarih)}
        </div>
        <div style={{ background: "linear-gradient(135deg, rgba(29,78,216,0.15) 0%, rgba(29,78,216,0.08) 100%)", padding: "6px 12px", borderRadius: "12px", fontSize: 11, fontWeight: 600, color: "#1d4ed8", border: "1px solid rgba(29,78,216,0.2)" }}>
          {(() => {
            const AracIcon = IconMap[aracIkon[ilan.aracTip] || "truck"];
            return AracIcon ? <AracIcon size={14} className="icon-primary" /> : <IconMap.truck size={14} className="icon-primary" />;
          })()} {ilan.aracTip}
        </div>
        <div style={{ background: "linear-gradient(135deg, rgba(251,191,36,0.15) 0%, rgba(251,191,36,0.08) 100%)", padding: "6px 12px", borderRadius: "12px", fontSize: 11, fontWeight: 600, color: "#fbbf24", border: "1px solid rgba(251,191,36,0.2)" }}>
          <IconMap.creditcard size={12} className="icon-primary" /> {!ilan.odemeGun || ilan.odemeGun === 0 ? "💰 Peşin" : `${ilan.odemeGun} Gün Ödeme`}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTop: "1px solid rgba(251,191,36,0.15)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", flex: 1 }} onClick={(e) => { e.stopPropagation(); profiliGoster(ilan.olusturan_id); }}>
          {ilan.profilFoto ? (
            <img src={ilan.profilFoto} alt="" style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(251,191,36,0.3)" }} />
          ) : (
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, #fbbf24, #f59e0b)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: "bold", color: "#0a0a0a" }}>
            {ilan.olusturan?.charAt(0).toUpperCase() || "?"}
          </div>
          )}
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{ilan.olusturan}</span>
              {ilan.firmaAdi && <span style={{ fontSize: 11, fontWeight: 500, color: "var(--text3)" }}>• {ilan.firmaAdi}</span>}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3, flexWrap: "wrap" }}>
              {ilan.olusturanOySayisi > 0 ? (
                <>
                  {ilan.olusturanPuan >= 4.5 ? "⭐" : ilan.olusturanPuan >= 4 ? "✦" : "•"}
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#fbbf24" }}>{Number(ilan.olusturanPuan).toFixed(1)}</span>
                  <span style={{ fontSize: 10, color: "var(--text3)" }}>puan • {ilan.olusturanOySayisi} değerlendirme</span>
                </>
              ) : (
                <span style={{ fontSize: 10, color: "var(--text3)" }}>{ilan.istekSayisi} istek aldı</span>
              )}
              {ilanSahibiOzeti.tamamlanan > 0 && (
                <span style={{ fontSize: 10, color: "var(--text3)" }}>• {ilanSahibiOzeti.tamamlanan} tamamlanan sefer</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function IlanlarSayfasi() {
  const { ilanlar, ilanAl, başvuruGonder, oturum, seferler } = useApp();
  const [filtre, setFiltre] = useState("");
  const [secilen, setSecilen] = useState(null);
  const [secilenBasvuru, setSecilenBasvuru] = useState(null);
  const [simdi, setSimdi] = useState(Date.now());

  // Dönüş Yükü: kamyoncunun boşaltma şehri (son seferin varış şehri otomatik tespit)
  const [donusSehir, setDonusSehir] = useState(() => {
    try { return localStorage.getItem("donus_yuk_sehir") || ""; } catch { return ""; }
  });

  // Cooldown sayacı (fazla iptal sonrası başvuru yasağı)
  useEffect(() => {
    const timer = setInterval(() => setSimdi(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Debug: ilanları ve oturumu logla
  console.log("IlanlarSayfasi - ilanlar:", ilanlar.length, "oturum:", oturum);

  const cooldownBitisMs = oturum?.iptal_cooldown_bitis ? new Date(oturum.iptal_cooldown_bitis).getTime() : 0;
  const cooldownAktif = cooldownBitisMs > simdi;

  const formatKalanSure = (ms) => {
    if (ms <= 0) return "0:00";
    const dk = Math.floor(ms / 60000);
    const sn = Math.floor((ms % 60000) / 1000);
    return `${dk}:${String(sn).padStart(2, "0")}`;
  };

  const liste = ilanlar.filter(i =>
    (i.nereden || "").toLowerCase().includes(filtre.toLowerCase()) ||
    (i.nereye || "").toLowerCase().includes(filtre.toLowerCase()) ||
    (i.yuk || "").toLowerCase().includes(filtre.toLowerCase())
  );

  // Kamyoncunun son seferinin varış şehri = boşaltma şehri (dönüş yükü tespiti)
  const otomatikSehir = ilAdiniAl((seferler || [])
    .filter(s => s?.kamyoncu_user_id === oturum?.id || s?.kamyoncu_tel === oturum?.telefon)
    .sort((a, b) => new Date(b?.tarih || 0) - new Date(a?.tarih || 0))[0]?.nereye || "");

  const aktifDonusSehir = donusSehir || otomatikSehir;

  const donusYuku = (i) =>
    aktifDonusSehir && ilAdiniAl(i.nereden) === aktifDonusSehir;

  const donusIlanlar = liste.filter(donusYuku);
  const digerIlanlar = liste.filter(i => !donusYuku(i));

  const setDonusSehirKalici = (sehir) => {
    setDonusSehir(sehir);
    try { localStorage.setItem("donus_yuk_sehir", sehir || ""); } catch {}
  };

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
      {cooldownAktif && (
        <div style={{
          background: "linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(239,68,68,0.08) 100%)",
          border: "1px solid rgba(239,68,68,0.35)",
          borderRadius: "12px", padding: "14px 16px", marginBottom: 14,
          display: "flex", alignItems: "center", gap: 10
        }}>
          <span style={{ fontSize: 22 }}>🚫</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#ef4444" }}>
              Fazla iptal yaptığınız için başvuru yapamıyorsunuz
            </div>
            <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>
              Kalan süre: {formatKalanSure(cooldownBitisMs - simdi)} · {new Date(cooldownBitisMs).toLocaleDateString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
        </div>
      )}
      <div className="search-bar" style={{ marginBottom: 18 }}>
        <span className="search-icon">🔍</span>
        <input placeholder="Şehir veya yük türü ara..." value={filtre} onChange={e => setFiltre(e.target.value)} />
        {filtre && <button onClick={() => setFiltre("")} style={{ color: "var(--text3)", fontSize: 16, transition: "var(--tr)" }}>✕</button>}
      </div>

      {/* DÖNÜŞ YÜKÜ */}
      <div style={{
        background: "linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(16,185,129,0.04) 100%)",
        border: "1px solid rgba(16,185,129,0.3)",
        borderRadius: "16px",
        padding: "16px",
        marginBottom: 16,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <span style={{ fontSize: 24 }}>🔄</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#10b981", letterSpacing: 0.5 }}>DÖNÜŞ YÜKÜ</div>
            <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>
              Boşaltma şehrini seç; oradan kalkan yükler önce listelenir, boş dönme.
            </div>
          </div>
        </div>
        <IlIlceSecici
          value={aktifDonusSehir}
          onChange={(val) => setDonusSehirKalici(ilAdiniAl(val))}
          placeholder="Boşaltma şehrini seç..."
        />
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
          {otomatikSehir && (
            <span style={{ fontSize: 11, color: "var(--text2)", background: "rgba(16,185,129,0.1)", padding: "4px 10px", borderRadius: "20px" }}>
              📍 Son boşaltma: <b style={{ color: "#10b981" }}>{otomatikSehir}</b>
            </span>
          )}
          {donusSehir && (
            <button
              onClick={() => setDonusSehirKalici("")}
              style={{ fontSize: 11, color: "#ef4444", background: "rgba(239,68,68,0.1)", padding: "4px 10px", borderRadius: "20px", border: "1px solid rgba(239,68,68,0.25)", cursor: "pointer" }}
            >
              ✕ Sıfırla
            </button>
          )}
          {aktifDonusSehir && (
            <span style={{ fontSize: 11, fontWeight: 700, color: "#10b981", marginLeft: "auto" }}>
              {donusIlanlar.length} dönüş yükü bulundu
            </span>
          )}
        </div>
      </div>

      {aktifDonusSehir && donusIlanlar.length > 0 && (
        <div className="section-title" style={{ color: "#10b981" }}>🔄 DÖNÜŞ YÜKÜ · {aktifDonusSehir} ({donusIlanlar.length})</div>
      )}
      <div className="section-title">AKTİF İLANLAR ({liste.length})</div>

      {liste.length === 0
        ? <EmptyState icon="🔍" title="Sonuç bulunamadı" alt={filtre ? "Arama kriterlerine uyan ilan yok." : "Henüz aktif ilan yok."} />
        : <>
            {aktifDonusSehir && donusIlanlar.map(i => <IlanKart key={i.id} ilan={i} donus onClick={() => setSecilen(i)} />)}
            {aktifDonusSehir && donusIlanlar.length > 0 && digerIlanlar.length > 0 && (
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text3)", letterSpacing: 1, textTransform: "uppercase", padding: "8px 2px", marginTop: 8 }}>
                Diğer İlanlar
              </div>
            )}
            {digerIlanlar.map(i => <IlanKart key={i.id} ilan={i} onClick={() => setSecilen(i)} />)}
          </>
      }

      {secilen && (
        <div className="sheet-overlay" onClick={() => setSecilen(null)}>
          <div className="sheet">
            <button onClick={() => setSecilen(null)} style={{ position: "fixed", top: 20, right: 20, background: "var(--bg1)", border: "1px solid var(--border2)", borderRadius: "12px", padding: "12px 16px", fontSize: 18, cursor: "pointer", zIndex: 101, transition: "var(--tr)" }} onMouseEnter={e => e.currentTarget.style.borderColor = "var(--sari)"} onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border2)"}>✕</button>
            <div style={{ maxWidth: 440, margin: "0 auto", padding: 24, paddingTop: 60 }}>
              <div className="display" style={{ fontSize: 28, color: "#fbbf24", marginBottom: 8 }}>{secilen?.yuk || "İlan Detay"}</div>
              <div style={{ display: "inline-block", background: "var(--guldum-gradient)", color: "#0a0a0a", padding: "6px 16px", borderRadius: "20px", fontSize: 11, fontWeight: 700, marginBottom: 12 }}>
                ₺{secilen?.ucret?.toLocaleString() || 0} - {formatTarih(secilen?.tarih)}
              </div>
              <div className="rota" style={{ marginBottom: 16 }}>
                <span className="rota-city">{secilen?.nereden || "-"}</span>
                <span className="rota-arrow">→</span>
                <span className="rota-city">{secilen?.nereye || "-"}</span>
              </div>
              <div style={{ color: "var(--text2)", fontSize: 13, lineHeight: 1.8, marginBottom: 24, background: "rgba(255,255,255,0.9)", padding: 14, borderRadius: "12px", border: "1px solid rgba(251,191,36,0.1)" }}>
                {secilen?.aciklama || "Açıklama yok"}
              </div>

              {/* OLUSTURAN BILGILERI */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, cursor: "pointer" }} onClick={() => window.location.href = `/profil/${secilen?.olusturan_id}`}>
                  {secilen?.profilFoto ? (
                    <img src={secilen.profilFoto} alt="" style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(251,191,36,0.3)" }} />
                  ) : (
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg, #fbbf24, #f59e0b)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: "bold", color: "#0a0a0a" }}>
                    {secilen?.olusturan?.charAt(0).toUpperCase() || "?"}
                  </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>{secilen?.olusturan}</div>
                    {secilen?.firmaAdi && <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text3)" }}>{secilen?.firmaAdi}</div>}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2, flexWrap: "wrap" }}>
                      {secilen?.olusturanPuan >= 4.5 ? "⭐" : secilen?.olusturanPuan >= 4 ? "✦" : "•"}
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#fbbf24" }}>{secilen?.olusturanPuan?.toFixed(1)}</span>
                      <span style={{ fontSize: 11, color: "var(--text3)" }}>puan • {secilen?.istekSayisi} istek</span>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
                {[
                  { k: "Ödeme Planı", v: !secilen?.odemeGun || secilen.odemeGun === 0 ? "💰 Peşin" : `${secilen.odemeGun} Gün Sonra` },
                  { k: "Ücret", v: <>₺{secilen?.ucret?.toLocaleString() || 0} {secilen?.kdvOrani > 0 ? <span style={{color:"#10b981"}}> +KDV</span> : ""}</> },
                  { k: "Araç Tipi", v: secilen?.aracTip || "Belirtilmedi" },
                  { k: "Tarih", v: <><IconMap.calendar size={14} className="icon-primary" /> {formatTarih(secilen?.tarih)}</> },
                ].map(({ k, v }, idx) => (
                  <div key={k} style={{ background: "var(--bg2)", borderRadius: "12px", padding: "14px 12px", border: "1px solid rgba(251,191,36,0.1)" }}>
                    <div style={{ fontSize: 10, color: "var(--text3)", marginBottom: 6, letterSpacing: 1.5, textTransform: "uppercase" }}>{k}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{v}</div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setSecilenBasvuru({
                  id: secilen?.id,
                  bilgiler: {
                    // Profildeki bilgilerle ön doldur — istenirse değiştirilebilir
                    ad: oturum?.ad || "",
                    tel: oturum?.telefon || "",
                    tc_kimlik: oturum?.tc_kimlik || "",
                    cekiciPlaka: oturum?.plaka || "",
                    dorsePlaka: oturum?.dorse_plaka || ""
                  }
                })}
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
                      bilgiler: { ad: harfFiltre(e.target.value, 60), tel: p?.bilgiler?.tel || "", dorsePlaka: p?.bilgiler?.dorsePlaka || "", cekiciPlaka: p?.bilgiler?.cekiciPlaka || "", tc_kimlik: p?.bilgiler?.tc_kimlik || "" }
                    }))}
                    style={{
                      padding: "16px 14px 16px 50px",
                      background: "var(--bg2)",
                      color: "var(--text)",
                      border: "1px solid var(--border2)",
                      borderRadius: "16px",
                      fontSize: 14,
                      outline: "none",
                      transition: "all 0.3s ease",
                      boxShadow: "inset 0 2px 8px rgba(0,0,0,0.2)",
                      WebkitTextFillColor: "var(--text)"
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#fbbf24";
                      e.target.style.boxShadow = "inset 0 2px 8px rgba(0,0,0,0.04), 0 0 0 3px rgba(29,78,216,0.15)";
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
                      bilgiler: { ad: p?.bilgiler?.ad || "", tel: rakamFiltre(e.target.value, 11), dorsePlaka: p?.bilgiler?.dorsePlaka || "", cekiciPlaka: p?.bilgiler?.cekiciPlaka || "", tc_kimlik: p?.bilgiler?.tc_kimlik || "" }
                    }))}
                    style={{
                      padding: "16px 14px 16px 50px",
                      background: "var(--bg2)",
                      color: "var(--text)",
                      border: "1px solid var(--border2)",
                      borderRadius: "16px",
                      fontSize: 14,
                      outline: "none",
                      transition: "all 0.3s ease",
                      boxShadow: "inset 0 2px 8px rgba(0,0,0,0.2)",
                      WebkitTextFillColor: "var(--text)"
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#fbbf24";
                      e.target.style.boxShadow = "inset 0 2px 8px rgba(0,0,0,0.04), 0 0 0 3px rgba(29,78,216,0.15)";
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
                      bilgiler: { ad: p?.bilgiler?.ad || "", tel: p?.bilgiler?.tel || "", cekiciPlaka: plakaFiltre(e.target.value), dorsePlaka: p?.bilgiler?.dorsePlaka || "", tc_kimlik: p?.bilgiler?.tc_kimlik || "" }
                    }))}
                    style={{
                      padding: "16px 14px 16px 50px",
                      background: "var(--bg2)",
                      color: "var(--text)",
                      border: "1px solid var(--border2)",
                      borderRadius: "16px",
                      fontSize: 14,
                      outline: "none",
                      transition: "all 0.3s ease",
                      boxShadow: "inset 0 2px 8px rgba(0,0,0,0.2)",
                      WebkitTextFillColor: "var(--text)"
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#fbbf24";
                      e.target.style.boxShadow = "inset 0 2px 8px rgba(0,0,0,0.04), 0 0 0 3px rgba(29,78,216,0.15)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "var(--border2)";
                      e.target.style.boxShadow = "inset 0 2px 8px rgba(0,0,0,0.2)";
                    }}
                  />
                  <div style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#1d4ed8", fontSize: "18px" }}>🚚</div>
                </div>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    placeholder="Dorse Plakası *"
                    value={secilenBasvuru?.bilgiler?.dorsePlaka || ""}
                    onChange={e => setSecilenBasvuru(p => ({
                      ...p,
                      bilgiler: { ad: p?.bilgiler?.ad || "", tel: p?.bilgiler?.tel || "", cekiciPlaka: p?.bilgiler?.cekiciPlaka || "", dorsePlaka: plakaFiltre(e.target.value), tc_kimlik: p?.bilgiler?.tc_kimlik || "" }
                    }))}
                    style={{
                      padding: "16px 14px 16px 50px",
                      background: "var(--bg2)",
                      color: "var(--text)",
                      border: "1px solid var(--border2)",
                      borderRadius: "16px",
                      fontSize: 14,
                      outline: "none",
                      transition: "all 0.3s ease",
                      boxShadow: "inset 0 2px 8px rgba(0,0,0,0.2)",
                      WebkitTextFillColor: "var(--text)"
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#fbbf24";
                      e.target.style.boxShadow = "inset 0 2px 8px rgba(0,0,0,0.04), 0 0 0 3px rgba(29,78,216,0.15)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "var(--border2)";
                      e.target.style.boxShadow = "inset 0 2px 8px rgba(0,0,0,0.2)";
                    }}
                  />
                  <div style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#1d4ed8", fontSize: "18px" }}>🚐</div>
                </div>
              </div>

              <div style={{ position: "relative", marginBottom: 20 }}>
                <input
                  type="text"
                  placeholder="TC Kimlik No *"
                  maxLength={11}
                  value={secilenBasvuru?.bilgiler?.tc_kimlik || ""}
                  onChange={e => setSecilenBasvuru(p => ({
                    ...p,
                    bilgiler: { ...p?.bilgiler, ad: p?.bilgiler?.ad || "", tel: p?.bilgiler?.tel || "", cekiciPlaka: p?.bilgiler?.cekiciPlaka || "", dorsePlaka: p?.bilgiler?.dorsePlaka || "", tc_kimlik: e.target.value.replace(/\D/g, "") }
                  }))}
                  style={{
                    width: "100%",
                    padding: "16px 14px 16px 50px",
                    background: "var(--bg2)",
                    color: "var(--text)",
                    border: "1px solid var(--border2)",
                    borderRadius: "16px",
                    fontSize: 14,
                    outline: "none",
                    transition: "all 0.3s ease",
                    boxShadow: "inset 0 2px 8px rgba(0,0,0,0.2)",
                    WebkitTextFillColor: "var(--text)"
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#fbbf24";
                    e.target.style.boxShadow = "inset 0 2px 8px rgba(0,0,0,0.04), 0 0 0 3px rgba(29,78,216,0.15)";
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
                    if ((secilenBasvuru?.bilgiler?.tc_kimlik || "").length !== 11) {
                      alert("TC Kimlik No 11 haneli olmalıdır!");
                      return;
                    }
                    if ((secilenBasvuru?.bilgiler?.tel || "").replace(/\D/g, "").length < 10) {
                      alert("Geçerli bir telefon numarası giriniz!");
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
