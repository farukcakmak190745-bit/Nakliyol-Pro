import { useApp } from "../context/AppContext";
import { useMesaj } from "../context/MesajContext";
import { IconMap } from "./Icons";

export const Header = ({ baslik, geri, sag, cikisYap: handleCikisYap }) => {
  const { oturum, cikisYap } = useApp();
  try {
    return (
      <div className="header">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {geri && <button onClick={geri} style={{ color: "var(--text3)", fontSize: 20, lineHeight: 1 }}>‹</button>}
          <div>
            <div className="logo">NAKLI<span className="logo-accent">YOL</span></div>
            {baslik && <div className="label" style={{ marginTop: 1 }}>{baslik}</div>}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {sag}
          {oturum && (
            <>
              <button
                onClick={async () => {
                  const fn = handleCikisYap || cikisYap;
                  try { await fn(); } catch (e) { console.error(e); }
                }}
                style={{ color: "var(--text3)", fontSize: 13, background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                Çıkış
              </button>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--bg3)", border: "1px solid var(--border2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <IconMap.kamyon size={16} className="icon-primary" />
              </div>
            </>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Header Component Error:', error);
    return <div>Header Error: {error.message}</div>;
  }
};

export const BottomNav = ({ aktif, setAktif, rol }) => {
  try {
    const { teklifler = [] } = useApp();
    const { konusmalar = [] } = useMesaj() || {};
    const bekleyenSayisi = (teklifler || []).filter(t => t.durum === "bekliyor").length;
    const okunmamisMesajSayisi = (konusmalar || []).reduce((top, k) => top + (k.okunmamis || 0), 0);

    const kamyoncuMenu = [
      { key: "ilanlar",  icon: "ilan", label: "İlanlar" },
      { key: "seferler", icon: "list", label: "Seferlerim" },
      { key: "bildirimler", icon: "bell", label: "Bildirimler", badge: okunmamisMesajSayisi },
      { key: "mesajlar", icon: "mesaj", label: "Mesajlar", badge: okunmamisMesajSayisi },
      { key: "profil",   icon: "profil", label: "Profil" },
    ];
    const issizMenu = [
      { key: "ilanver",   icon: "plus",  label: "İlan Ver" },
      { key: "ilanlarim", icon: "file",  label: "İlanlarım" },
      { key: "teklifler", icon: "truck",  label: "Teklifler", badge: bekleyenSayisi },
      { key: "mesajlar",  icon: "mesaj", label: "Mesajlar", badge: okunmamisMesajSayisi },
      { key: "profil",    icon: "profil", label: "Profil" },
    ];
    const menu = (rol && rol === "kamyoncu") ? kamyoncuMenu : (rol && rol === "issiz" ? issizMenu : []);

    return (
      <div className="bottom-nav">
        {menu.map(m => (
          <button
            key={m.key}
            className={`nav-btn ${aktif === m.key ? "active" : ""}`}
            onClick={() => setAktif(m.key)}
            style={{ position: "relative", cursor: "pointer", border: "none", outline: "none", background: "none", padding: 0 }}
          >
            <span className="nav-icon">
            {(() => {
              const Icon = IconMap[m.icon] || IconMap.truck;
              return <Icon size={22} className="icon-primary" />;
            })()}
          </span>
            <span className="nav-label">{m.label}</span>
            {m.badge > 0 && <span className="badge-count">{m.badge}</span>}
          </button>
        ))}
      </div>
    );
  } catch (error) {
    console.error('BottomNav Component Error:', error);
    return <div>BottomNav Error: {error.message}</div>;
  }
};

export const Sheet = ({ onClose, children }) => (
  <div className="sheet-overlay" onClick={onClose}>
    <div className="sheet" onClick={e => e.stopPropagation()}>
      <div className="sheet-handle" />
      {children}
    </div>
  </div>
);

export const Pill = ({ durum }) => {
  const map = {
    aktif: { cls: "pill-green", label: "Aktif" },
    onaylandı: { cls: "pill-green", label: "✓ Onaylandı" },
    bekliyor: { cls: "pill-amber", label: "⏳ Bekliyor" },
    reddedildi: { cls: "pill-red", label: "✕ Reddedildi" },
    tamamlandı: { cls: "pill-blue", label: "✓ Tamamlandı" },
    dolu: { cls: "pill-red", label: "⛔ Stok Doldu" },
    issiz: { cls: "pill-orange", label: "İş Veren" },
    kamyoncu: { cls: "pill-blue", label: "Kamyoncu" },
  };
  const { cls, label } = map[durum] || { cls: "pill-gray", label: durum };
  return <span className={`pill ${cls}`}>{label}</span>;
};

export const StokBar = ({ kalan, toplam }) => {
  const oran = toplam > 0 ? (kalan / toplam) * 100 : 0;
  const renk = oran > 60 ? "var(--yesil)" : oran > 30 ? "var(--sari)" : "var(--kirmizi)";
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 10, color: "var(--text3)" }}>STOK</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: renk }}>{kalan}/{toplam} TIR</span>
      </div>
      <div className="stok-bar">
        <div className="stok-fill" style={{ width: `${oran}%`, background: renk }} />
      </div>
    </div>
  );
};

export const EmptyState = ({ icon, text, title, alt, cta }) => (
  <div style={{
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    padding: "64px 24px", textAlign: "center", position: "relative", overflow: "hidden"
  }}>
    <div style={{
      position: "absolute", top: 30, left: "50%", transform: "translateX(-50%)",
      width: 200, height: 200, borderRadius: "50%",
      background: "radial-gradient(circle, rgba(251,191,36,0.08) 0%, transparent 70%)",
      pointerEvents: "none"
    }} />
    <div style={{
      position: "relative", width: 96, height: 96, borderRadius: 28,
      background: "linear-gradient(135deg, var(--bg2) 0%, var(--bg3) 100%)",
      border: "1px solid var(--border)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 42, marginBottom: 18, boxShadow: "0 12px 32px rgba(15,23,42,0.08)",
      animation: "float 3.2s ease-in-out infinite"
    }}>
      {icon}
    </div>
    <div style={{ position: "relative" }}>
      <div style={{ fontSize: title ? 17 : 15, fontWeight: 800, color: "var(--text)", letterSpacing: 0.3 }}>
        {title || text}
      </div>
      {title && alt && (
        <div style={{ fontSize: 13, color: "var(--text3)", marginTop: 8, lineHeight: 1.6 }}>
          {alt}
        </div>
      )}
      {!title && <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 6 }}>{alt}</div>}
      {cta && (
        <div style={{ marginTop: 20 }}>
          {typeof cta === "function" ? (
            <button onClick={cta} className="btn btn-primary" style={{ fontSize: 13, padding: "12px 24px" }}>
              Başla
            </button>
          ) : cta}
        </div>
      )}
    </div>
  </div>
);

/**
 * Tarih formatlama: YYYY-MM-DD, ISO string, Date objesi ya da
 * "DD.MM.YYYY" formatındaki string -> "DD.MM.YYYY" çıktısı.
 *
 * Kullanım:  formatTarih("2026-06-04")          -> "04.06.2026"
 *            formatTarih(new Date())            -> "04.06.2026"
 *            formatTarih("04.06.2026")          -> "04.06.2026"  (passthrough)
 *            formatTarih(null)                  -> "—"
 */
export const formatTarih = (tarih) => {
  if (!tarih) return "—";
  const d = new Date(tarih);
  if (isNaN(d.getTime())) return String(tarih);
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
};

// Seferin vade tarihi: teslim tarihi + ödeme günü. Peşin/seferlik yoksa null.
export const vadeTarihiniBul = (sefer) => {
  if (!sefer) return null;
  const gun = Number(sefer?.odeme_gun ?? sefer?.odemeGun ?? 0);
  if (gun <= 0) return null;
  const taban = sefer?.teslim_tarihi || new Date().toISOString().split("T")[0];
  const d = new Date(taban);
  if (isNaN(d.getTime())) return null;
  d.setDate(d.getDate() + gun);
  return d.toISOString().split("T")[0];
};

// Vade tarihi geçmiş mi? (bugün > vade)
export const vadeGectiMi = (vadeTarihi) => {
  if (!vadeTarihi) return false;
  const vade = new Date(vadeTarihi + "T00:00:00");
  const bugun = new Date();
  bugun.setHours(0, 0, 0, 0);
  return vade.getTime() < bugun.getTime();
};