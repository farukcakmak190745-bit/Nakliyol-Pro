import { useApp } from "../context/AppContext";
import { IconMap } from "../components/Icons";

export function BildirimlerSayfasi() {
  const { bildirimler, setGosterenBildirim, setBildirimlerList } = useApp();

  return (
    <div className="scroll-content">
      <div className="section-title">BİLDİRİMLER ({bildirimler?.length || 0})</div>

      {(!bildirimler || bildirimler.length === 0) ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text3)" }}>
          <div style={{ fontSize: 56, marginBottom: 20 }}><IconMap.bell size={56} className="icon-primary" /></div>
          <div style={{ fontSize: 16, marginBottom: 8 }}>Henüz bildiriniz yok</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {bildirimler.map((b, index) => {
            if (!b) return null;
            return (
            <div
              key={b.id || `notification-${index}`}
              className="card"
              style={{ marginBottom: 0, border: "2px solid rgba(251,191,36,0.3)", cursor: "pointer", transition: "transform 0.2s" }}
              onClick={() => {
                if (index === 0 && bildirimler.length > 1) {
                  setBildirimlerList(prev => prev.slice(1));
                }
                setGosterenBildirim(b);
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 46, height: 46, borderRadius: "50%", background: "linear-gradient(135deg, var(--guldum-gradient), var(--purple-gradient))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: "#fff" }}>
                  {b.tur === 'basvuru' ? '⏳' : '✉️'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#fbbf24" }}>{b.baslik}</div>
                  <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {b.icerik.substring(0, 80)}...
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 4 }}>
                    {new Date(b.olusturma_zamani).toLocaleString('tr-TR')};
                  </div>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
