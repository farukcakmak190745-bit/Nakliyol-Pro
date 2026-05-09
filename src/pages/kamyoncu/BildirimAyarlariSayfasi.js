import { useApp } from "../../context/AppContext";

export default function BildirimAyarlariSayfasi() {
  const { bildirimler, bildirimGuncelle, oturum } = useApp();

  const toggleBildirim = (tur) => {
    bildirimGuncelle(tur, !bildirimler[tur]);
  };

  // İşveren sadece ilan ve teklif bildirimlerine sahip
  const bildirimlerList = oturum?.rol === "issiz"
    ? [
        { icon: "📢", tur: "ilan", label: "Yeni İlan Bildirimi", desc: "Yeni ilan yayınlandığında bildir" },
        { icon: "📋", tur: "teklif", label: "Teklif Bildirimi", desc: "Kamyoncu teklif verdiğinde bildir" },
      ]
    : [
        { icon: "📢", tur: "ilan", label: "Yeni İlan Bildirimi", desc: "Yeni ilan yayınlandığında bildir" },
        { icon: "📋", tur: "teklif", label: "Teklif Bildirimi", desc: "Kamyoncu teklif verdiğinde bildir" },
        { icon: "💬", tur: "mesaj", label: "Mesaj Bildirimi", desc: "Yeni mesaj gelince bildir" },
        { icon: "🗺️", tur: "sefer", label: "Sefer Bildirimi", desc: "Sefer durumu değişince bildir" },
      ];

  return (
    <div className="scroll-content">
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 14, color: "var(--text3)", marginBottom: 8 }}>Bildirim Türleri</div>

        {bildirimlerList.map((item, i) => (
          <div key={item.tur} style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 14px",
            borderBottom: i < 3 ? "1px solid rgba(251,191,36,0.1)" : "none"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 24 }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{item.label}</div>
                <div style={{ fontSize: 12, color: "var(--text3)" }}>{item.desc}</div>
              </div>
            </div>

            <div
              onClick={() => toggleBildirim(item.tur)}
              style={{
                width: 52,
                height: 30,
                borderRadius: 15,
                background: bildirimler[item.tur] ? "#10b981" : "var(--bg1)",
                border: `1px solid ${bildirimler[item.tur] ? "#10b981" : "var(--border2)"}`,
                cursor: "pointer",
                position: "relative",
                transition: "var(--tr)"
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 3,
                  left: bildirimler[item.tur] ? "23px" : "3px",
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: "#fff",
                  border: `1px solid ${bildirimler[item.tur] ? "#10b981" : "var(--border2)"}`,
                  transition: "var(--tr)",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, letterSpacing: 1.5 }}>Bildirim Yeri</div>

        {[
          { icon: "📱", label: "Push Bildirimi", desc: "Telefonda bildirim gönder" },
          { icon: "✉️", label: "E-posta", desc: "Günlük özet e-posta" },
          { icon: "🔔", label: "Sesli Bildirim", desc: "Bildirim geldiğinde ses" },
        ].map((item, i) => (
          <div key={item.label} style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 14px",
            borderBottom: i < 2 ? "1px solid rgba(251,191,36,0.1)" : "none"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 24 }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{item.label}</div>
                <div style={{ fontSize: 12, color: "var(--text3)" }}>{item.desc}</div>
              </div>
            </div>

            <div
              onClick={() => alert(`${item.label} ayarlanıyor...`)}
              style={{
                width: 52,
                height: 30,
                borderRadius: 15,
                background: "var(--bg1)",
                border: "1px solid var(--border2)",
                cursor: "pointer",
                position: "relative"
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 3,
                  left: "3px",
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: "#fff",
                  border: "1px solid var(--border2)",
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 14, background: "linear-gradient(135deg, rgba(251,191,36,0.08) 0%, rgba(251,191,36,0.04) 100%)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 24 }}>🔔</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>Tümünü Aç</div>
            <div style={{ fontSize: 12, color: "var(--text3)" }}>Tüm bildirimleri etkinleştir</div>
          </div>
        </div>
        <button
          onClick={() => {
            bildirimlerList.forEach(item => bildirimGuncelle(item.tur, true));
          }}
          style={{ marginTop: 12, width: "100%", padding: "12px", background: "var(--guldum-gradient)", border: "none", borderRadius: "12px", fontSize: 14, fontWeight: 600, color: "#0a0a0a", cursor: "pointer" }}
        >
          Tümünü Aç
        </button>
      </div>

      <div className="card" style={{ background: "linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(239,68,68,0.04) 100%)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 24 }}>🔕</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>Tümünü Kapat</div>
            <div style={{ fontSize: 12, color: "var(--text3)" }}>Tüm bildirimleri devre dışı bırak</div>
          </div>
        </div>
        <button
          onClick={() => {
            bildirimlerList.forEach(item => bildirimGuncelle(item.tur, false));
          }}
          style={{ marginTop: 12, width: "100%", padding: "12px", background: "var(--bg1)", border: "1px solid var(--border2)", borderRadius: "12px", fontSize: 14, fontWeight: 600, color: "var(--text)", cursor: "pointer" }}
        >
          Tümünü Kapat
        </button>
      </div>

      <div style={{ padding: "16px", textAlign: "center", fontSize: 12, color: "var(--text3)" }}>
        Bildirim ayarları otomatik olarak kaydediliyor
      </div>
    </div>
  );
}
