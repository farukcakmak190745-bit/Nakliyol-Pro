import { useApp } from "../context/AppContext";
import { formatTarih, EmptyState } from "../components/UI";

export function BildirimlerSayfasi() {
  const { bildirimler, setGosterenBildirim, tumBildirimleriOkunduYap } = useApp();

  const okunmamisSayi = (bildirimler || []).filter(b => b && !b.okundu).length;

  const goster = (b) => {
    setGosterenBildirim(b);
  };

  return (
    <div className="scroll-content">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div className="section-title" style={{ marginBottom: 0 }}>
          BİLDİRİMLER{okunmamisSayi > 0 && (
            <span style={{
              marginLeft: 8,
              fontSize: 11,
              background: "linear-gradient(135deg, #f59e0b, #ea580c)",
              color: "#fff",
              borderRadius: 12,
              padding: "2px 10px",
              fontWeight: 700,
              verticalAlign: "middle"
            }}>
              {okunmamisSayi} yeni
            </span>
          )}
        </div>
        {okunmamisSayi > 0 && (
          <button
            onClick={() => tumBildirimleriOkunduYap()}
            style={{
              padding: "8px 14px",
              background: "linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(16,185,129,0.06) 100%)",
              color: "#059669",
              border: "1px solid rgba(16,185,129,0.3)",
              borderRadius: "10px",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap"
            }}
          >
            ✓ Tümünü okundu işaretle
          </button>
        )}
      </div>

      {(!bildirimler || bildirimler.length === 0) ? (
        <EmptyState icon="🔔" title="Henüz bildiriminiz yok" alt="Teklif, mesaj ve sefer gelişmeleri burada görünecek." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {bildirimler.map((b, index) => {
            if (!b) return null;
            const okunmamis = !b.okundu;
            return (
            <div
              key={b.id || `notification-${index}`}
              className="card"
              style={{
                marginBottom: 0,
                cursor: "pointer",
                transition: "transform 0.2s",
                border: okunmamis
                  ? "2px solid rgba(251,191,36,0.45)"
                  : "1px solid var(--border)",
                position: "relative",
                overflow: "hidden",
                background: okunmamis ? "rgba(251,191,36,0.04)" : undefined
              }}
              onClick={() => goster(b)}
            >
              {okunmamis && (
                <span style={{
                  position: "absolute", top: 14, right: 14,
                  width: 9, height: 9, borderRadius: "50%",
                  background: "linear-gradient(135deg, #f59e0b, #ea580c)"
                }} />
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 46, height: 46, borderRadius: "50%",
                  background: okunmamis
                    ? "linear-gradient(135deg, var(--guldum-gradient), var(--purple-gradient))"
                    : "var(--bg3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20, color: okunmamis ? "#fff" : "var(--text3)"
                }}>
                  {b.tur === 'basvuru' ? '⏳' : '✉️'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: okunmamis ? 800 : 600, fontSize: 15, color: okunmamis ? "#fbbf24" : "var(--text)" }}>
                    {b?.baslik || 'Bildirimsiz'}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {(b?.icerik || '').substring(0, 80)}...
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 4 }}>
                    {b?.olusturma_zamani ? formatTarih(b.olusturma_zamani) : '—'}
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
