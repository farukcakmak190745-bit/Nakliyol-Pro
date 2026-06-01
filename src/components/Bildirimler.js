import { useApp } from "../context/AppContext";

export function BildirimlerModal() {
  const { bildirimlerList, gosterenBildirim, setGosterenBildirim } = useApp();

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
            {gosterenBildirim.icon || '🔔'}
          </div>

          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
            {gosterenBildirim.baslik}
          </div>

          <div
            style={{
              fontSize: 14,
              color: 'var(--text2)',
              lineHeight: 1.8,
              background: 'rgba(22,22,22,0.5)',
              padding: 14,
              borderRadius: '12px',
              border: '1px solid rgba(251,191,36,0.1)',
              whiteSpace: 'pre-line',
              marginBottom: 24
            }}
          >
            {gosterenBildirim.icerik}
          </div>

          <div style={{ fontSize: 10, color: 'var(--text3)', textAlign: 'center' }}>
            {new Date(gosterenBildirim.olusturma_zamani).toLocaleString('tr-TR')}
          </div>
        </div>
      </div>
    </div>
  );
}
