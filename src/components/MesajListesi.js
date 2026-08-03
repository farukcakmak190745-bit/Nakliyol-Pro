// Mesaj listesi için ortak, profesyonel görünümlü bileşenler.

const SEFER_DURUM = {
  "bekliyor":        { label: "Başvuru",  renk: "#6b7280", ikon: "⏳" },
  "yolda":           { label: "Yolda",    renk: "#1d4ed8", ikon: "🚚" },
  "teslima_bekleniyor": { label: "Teslim", renk: "#f59e0b", ikon: "📦" },
  "odendi":          { label: "Ödendi",   renk: "#10b981", ikon: "✅" },
  "reddedildi":      { label: "Reddedildi", renk: "#ef4444", ikon: "✕" },
  "tamamlandı":      { label: "Tamamlandı", renk: "#10b981", ikon: "✓" },
  "iptal_edildi":    { label: "İptal",    renk: "#ef4444", ikon: "✕" },
};

export const seferDurumBilgi = (sefer) => {
  if (!sefer) return { label: "Yeni", renk: "#6b7280", ikon: "💬" };
  return SEFER_DURUM[sefer.durum] || { label: sefer.durum, renk: "#6b7280", ikon: "⏳" };
};

export const basHarfler = (ad) => {
  if (!ad) return "?";
  return ad.trim().split(/\s+/).slice(0, 2).map(s => (s[0] || "").toUpperCase()).join("") || "?";
};

export const avatarRenk = (ad) => {
  let hash = 0;
  const metin = ad || "";
  for (let i = 0; i < metin.length; i++) hash = (hash * 31 + metin.charCodeAt(i)) % 360;
  return `linear-gradient(135deg, hsl(${hash}, 65%, 48%), hsl(${(hash + 45) % 360}, 65%, 36%))`;
};

export const goreceliZaman = (t) => {
  if (!t) return "";
  const d = new Date(t);
  if (isNaN(d.getTime())) return "";
  const now = new Date();
  const fark = now - d;
  const dk = Math.floor(fark / 60000);
  if (dk < 1) return "Şimdi";
  if (dk < 60) return `${dk} dk`;
  if (now.getDate() === d.getDate() && now.getMonth() === d.getMonth()) {
    return d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  }
  if (fark < 48 * 3600000) return "Dün";
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" });
};

export const sonMesajOzet = (konusma, benimId) => {
  const msgs = konusma?.mesajlar || [];
  const son = msgs[msgs.length - 1];
  if (!son) return konusma?.baslik || "";
  const veriTipi = son.veriTipi || "metin";
  const benimMi = son.gonderen === "ben";
  const onEk = benimMi ? "Sen: " : "";
  if (son.metin && son.metin.trim()) return onEk + son.metin;
  const ikon = veriTipi === "img" ? "🖼️" : "📎";
  const ad = son.veri?.ad || (veriTipi === "img" ? "Fotoğraf" : "Dosya");
  return onEk + `${ikon} ${ad}`;
};

export function Avatar({ ad, boyut = 50, rol, durumRenk, durumLabel }) {
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <div style={{
        width: boyut,
        height: boyut,
        borderRadius: "50%",
        background: avatarRenk(ad),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontWeight: 700,
        fontSize: Math.round(boyut * 0.36),
        letterSpacing: 1,
        boxShadow: "0 4px 14px rgba(0,0,0,0.18)"
      }}>
        {basHarfler(ad)}
      </div>
      {durumRenk && (
        <div style={{
          position: "absolute",
          bottom: 0,
          right: 0,
          width: Math.round(boyut * 0.32),
          height: Math.round(boyut * 0.32),
          borderRadius: "50%",
          background: durumRenk,
          border: `2px solid var(--bg1)`
        }} title={durumLabel} />
      )}
    </div>
  );
}

export function MesajListeKart({ konusma, sefer, onClick }) {
  const durum = seferDurumBilgi(sefer);
  return (
    <div
      className="card"
      onClick={onClick}
      style={{
        marginBottom: 10,
        padding: 14,
        cursor: "pointer",
        border: konusma.okunmamis > 0 ? "1px solid rgba(251,191,36,0.4)" : "1px solid transparent",
        transition: "all 0.2s ease",
        background: konusma.okunmamis > 0
          ? "linear-gradient(135deg, rgba(251,191,36,0.06) 0%, var(--bg1) 100%)"
          : "var(--bg1)"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Avatar ad={konusma.partnerAd} rol={konusma.partnerRol} durumRenk={durum.renk} durumLabel={durum.label} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {konusma.partnerAd}
              </span>
              <span style={{
                fontSize: 10,
                padding: "2px 8px",
                borderRadius: 10,
                background: "var(--bg3)",
                color: "var(--text3)",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: 3
              }}>
                {konusma.partnerRol === "kamyoncu" ? "🚛 Taşıyıcı" : "🏢 İşveren"}
              </span>
            </div>
            <span style={{ fontSize: 11, color: "var(--text3)", flexShrink: 0, whiteSpace: "nowrap" }}>
              {goreceliZaman(konusma.sonGuncelleme || konusma.sonOkuma)}
            </span>
          </div>

          {sefer && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, fontSize: 11.5, color: "var(--text2)" }}>
              <span>📍 {sefer.nereden}</span>
              <span style={{ color: "var(--text3)" }}>→</span>
              <span>🎯 {sefer.nereye}</span>
              <span style={{
                marginLeft: "auto",
                fontSize: 10,
                fontWeight: 700,
                color: durum.renk,
                background: `${durum.renk}1a`,
                padding: "2px 8px",
                borderRadius: 10,
                whiteSpace: "nowrap",
                flexShrink: 0
              }}>
                {durum.ikon} {durum.label}
              </span>
            </div>
          )}

          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginTop: 4,
            minWidth: 0
          }}>
            <span style={{
              fontSize: 12.5,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              flex: 1,
              color: konusma.okunmamis > 0 ? "var(--text2)" : "var(--text3)",
              fontWeight: konusma.okunmamis > 0 ? 600 : 400
            }}>
              {sonMesajOzet(konusma)}
            </span>
            {konusma.okunmamis > 0 && (
              <span style={{
                background: "linear-gradient(135deg, #f59e0b, #ea580c)",
                color: "#fff",
                borderRadius: 12,
                minWidth: 20,
                height: 20,
                fontSize: 11,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 6px",
                boxShadow: "0 4px 10px rgba(251,191,36,0.35)",
                flexShrink: 0
              }}>
                {konusma.okunmamis}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
