import { useEffect } from "react";
import { useApp } from "../context/AppContext";
import { formatTarih } from "./UI";

export function BildirimlerModal() {
  const { gosterenBildirim, setGosterenBildirim, bildirimiOkunduYap } = useApp();

  // Modal açıldığında bildirimi okundu olarak işaretle (DB + yerel state)
  useEffect(() => {
    if (gosterenBildirim?.id) {
      bildirimiOkunduYap(gosterenBildirim.id);
    }
  }, [gosterenBildirim?.id, bildirimiOkunduYap]);

  if (!gosterenBildirim) return null;

  return (
    <div className="sheet-overlay" onClick={() => setGosterenBildirim(null)}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <button
          onClick={() => setGosterenBildirim(null)}
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            background: 'var(--bg1)',
            border: '1px solid var(--border2)',
            borderRadius: '12px',
            padding: '12px 16px',
            fontSize: 18,
            cursor: 'pointer',
            zIndex: 101,
            transition: 'var(--tr)'
          }}
        >
          ✕
        </button>

        <div style={{ maxWidth: 440, margin: '0 auto', padding: 24, paddingTop: 60 }}>
          <div style={{ fontSize: 28, color: '#fbbf24', marginBottom: 16 }}>
            {gosterenBildirim?.icon || '🔔'}
          </div>

          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
            {gosterenBildirim?.baslik || 'Bildirimsiz'}
          </div>

          <div
            style={{
              fontSize: 14,
              color: 'var(--text2)',
              lineHeight: 1.8,
              background: 'rgba(255,255,255,0.95)',
              padding: 14,
              borderRadius: '12px',
              border: '1px solid rgba(251,191,36,0.1)',
              whiteSpace: 'pre-line',
              marginBottom: 24
            }}
          >
            {gosterenBildirim?.icerik || 'İçerik yok'}
          </div>

          <div style={{ fontSize: 10, color: 'var(--text3)', textAlign: 'center' }}>
            {gosterenBildirim?.olusturma_zamani ? formatTarih(gosterenBildirim.olusturma_zamani) : '—'}
          </div>
        </div>
      </div>
    </div>
  );
}
