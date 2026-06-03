import { useApp } from "../context/AppContext";
import { useMesaj } from "../context/MesajContext";

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
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--bg3)", border: "1px solid var(--border2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>
                {oturum.role === "kamyoncu" ? "🚛" : "🏢"}
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
      { key: "ilanlar",  icon: "📢", label: "İlanlar" },
      { key: "seferler", icon: "🗺️", label: "Seferlerim" },
      { key: "bildirimler", icon: "🔔", label: "Bildirimler" },
      { key: "mesajlar", icon: "💬", label: "Mesajlar", badge: okunmamisMesajSayisi },
      { key: "profil",   icon: "👤", label: "Profil" },
    ];
    const issizMenu = [
      { key: "ilanver",   icon: "➕",  label: "İlan Ver" },
      { key: "ilanlarim", icon: "📋",  label: "İlanlarım" },
      { key: "teklifler", icon: "🚚",  label: "Teklifler", badge: bekleyenSayisi },
      { key: "mesajlar",  icon: "💬",  label: "Mesajlar", badge: okunmamisMesajSayisi },
      { key: "profil",    icon: "👤",  label: "Profil" },
    ];
    const menu = rol === "kamyoncu" ? kamyoncuMenu : issizMenu;

    return (
      <div className="bottom-nav">
        {menu.map(m => (
          <button
            key={m.key}
            className={`nav-btn ${aktif === m.key ? "active" : ""}`}
            onClick={() => setAktif(m.key)}
            style={{ position: "relative", cursor: "pointer", border: "none", outline: "none", background: "none", padding: 0 }}
          >
            <span className="nav-icon">{m.icon}</span>
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

export const EmptyState = ({ icon, text }) => (
  <div className="empty">
    <div className="empty-icon">{icon}</div>
    <div style={{ fontSize: 14 }}>{text}</div>
  </div>
);