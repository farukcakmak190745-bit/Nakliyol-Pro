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

export const EmptyState = ({ icon, text }) => (
  <div className="empty">
    <div className="empty-icon">{icon}</div>
    <div style={{ fontSize: 14 }}>{text}</div>
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