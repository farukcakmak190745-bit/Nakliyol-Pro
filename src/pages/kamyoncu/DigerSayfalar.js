import { useState } from "react";
import { useApp } from "../../context/AppContext";
import { useMesaj } from "../../context/MesajContext";
import { EmptyState } from "../../components/UI";
import ChatSayfasi from "../../components/ChatSayfasi";
import TeslimEdildiModal from "../../components/TeslimEdildiModal";
import { BildirimlerSayfasi } from "../../pages/BildirimlerSayfasi";

export function SeferlerSayfasi() {
  const { seferler, konusmaOluştur, oturum, islemiTeslimEt } = useApp();
  const [seciliSefer, setSeciliSefer] = useState(null);
  const [konusmaIdMap, setKonusmaIdMap] = useState({});
  const [teslimEdildiModal, setTeslimEdildiModal] = useState(null);

  const seferlerList = seferler || [];
  const aktifSeferler = seferlerList.filter(s => s.durum === "yolda" || s.durum === "teslima_bekleniyor");
  const bitmisSeferler = seferlerList.filter(s => s.durum === "tamamlandı");

  const konusmaAc = (sefer) => {
    const newConversationId = konusmaOluştur({
      partnerId: sefer.olusturan,
      partnerAd: sefer.olusturan,
      partnerRol: "issiz",
      baslik: `${sefer.yuk} - ${sefer.nereden} → ${sefer.nereye}`,
      resim: "https://api.dicebear.com/7.x/initials/svg?seed=" + sefer.olusturan.substring(0, 2).toUpperCase()
    });
    setKonusmaIdMap(prev => ({ ...prev, [sefer.id]: newConversationId }));
    return newConversationId;
  };

  if (aktifSeferler.length === 0 && bitmisSeferler.length === 0) {
    return (
      <div className="scroll-content">
        <div className="section-title">SEFERLERİM</div>
        <EmptyState icon="✈️" text="Henüz bir seferiniz yok" />
      </div>
    );
  }

  return (
    <div className="scroll-content">
      {aktifSeferler.length > 0 && (
        <>
          <div className="section-title">AKTİF SEFERLER ({aktifSeferler.length})</div>
          {aktifSeferler.map(sefer => (
            <div key={sefer.id} className="card" style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ fontSize: 32 }}>🚚</div>
                  <div>
                    <div className="display" style={{ fontSize: 18, color: "#fbbf24" }}>{sefer.yuk}</div>
                    <div style={{ fontSize: 10, color: "var(--text3)", letterSpacing: 1.5 }}>Yük Tipi</div>
                  </div>
                </div>
                <div style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(16,185,129,0.1) 100%)", color: "#10b981", padding: "6px 12px", borderRadius: "20px", fontSize: 11, fontWeight: 600, border: "1px solid rgba(16,185,129,0.3)" }}>
                  {sefer.durum === "yolda" ? "✓ Yolda" : sefer.durum === "teslima_bekleniyor" ? "⏳ Teslim Bekleniyor" : "✓ Tamamlandı"}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{sefer.nereden}</span>
                <span style={{ color: "#fbbf24", fontSize: 18 }}>→</span>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{sefer.nereye}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
                <div style={{ background: "var(--bg2)", borderRadius: "12px", padding: "12px", textAlign: "center", border: "1px solid rgba(251,191,36,0.1)" }}>
                  <div style={{ fontSize: 10, color: "var(--text3)" }}>Plaka</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#3b82f6" }}>{sefer.plaka}</div>
                </div>
                <div style={{ background: "var(--bg2)", borderRadius: "12px", padding: "12px", textAlign: "center", border: "1px solid rgba(251,191,36,0.1)" }}>
                  <div style={{ fontSize: 10, color: "var(--text3)" }}>Ücret</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#fbbf24" }}>₺{sefer.ucret.toLocaleString()}</div>
                </div>
                <div style={{ background: "var(--bg2)", borderRadius: "12px", padding: "12px", textAlign: "center", border: "1px solid rgba(251,191,36,0.1)" }}>
                  <div style={{ fontSize: 10, color: "var(--text3)" }}>Tonaj</div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{sefer.ton > 0 ? `${sefer.ton} Ton` : "🔥 Serbest"}</div>
                </div>
              </div>

              {sefer.durum === "yolda" && (
                <>
                  <button
                    onClick={() => setTeslimEdildiModal(sefer)}
                    className="btn btn-success"
                    style={{ width: "100%", fontSize: 13, padding: "12px", marginBottom: "12px" }}
                  >
                    🎉 İşi Teslim Et
                  </button>
                  <button
                    onClick={() => konusmaAc(sefer)}
                    className="btn btn-primary"
                    style={{ padding: "12px", fontSize: 13 }}
                  >
                    💬 Konuş
                  </button>
                </>
              )}

              {teslimEdildiModal && (
                <TeslimEdildiModal
                  sefer={teslimEdildiModal}
                  onClose={() => setTeslimEdildiModal(null)}
                />
              )}
            </div>
          ))}
        </>
      )}

      {bitmisSeferler.length > 0 && (
        <>
          {aktifSeferler.length > 0 && <div style={{ height: 20 }}></div>}
          <div className="section-title">GEÇMİŞ SEFERLER ({bitmisSeferler.length})</div>
          {bitmisSeferler.map(sefer => (
            <div key={sefer.id} className="card" style={{ marginBottom: 14, border: "1px solid rgba(16,185,129,0.2)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15, color: "#fbbf24" }}>{sefer.yuk}</div>
                  <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>{sefer.nereden} → {sefer.nereye}</div>
                  <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>🏢 {sefer.olusturan}</div>
                  <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 1 }}>🚛 {sefer.kamyoncu} • 📌 {sefer.plaka}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: "#fbbf24", fontWeight: 700, fontSize: 16 }}>₺{sefer.ucret.toLocaleString()}</div>
                  <div style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(16,185,129,0.1) 100%)", color: "#10b981", padding: "4px 10px", borderRadius: "20px", fontSize: 10, fontWeight: 600, marginTop: 4 }}>✓ Tamamlandı</div>
                </div>
              </div>
              {sefer.belgeler.length > 0 && (
                <div style={{ marginTop: 12, display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {sefer.belgeler.map((b, i) => (
                    <div key={i} style={{ background: "var(--bg2)", borderRadius: "8px", padding: "6px 10px", fontSize: 11, display: "flex", alignItems: "center", gap: 6, border: "1px solid rgba(251,191,36,0.1)" }}>
                      {b.tip === "img" ? "🖼️" : "📄"} {b.ad}
                    </div>
                  ))}
                </div>
              )}
              {sefer.odemeDurumu === "odendi" && (
                <div style={{ marginTop: 8, fontSize: 11, color: "#10b981", display: "flex", alignItems: "center", gap: 6 }}>
                  💰 Ödeme tamamlandı - {sefer.odemeTarihi}
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export function IlanlarSayfasi() {
  const { oturum, ilanlar, ilanSil, ilanAl } = useApp();

  const mevcutIlanlar = ilanlar.filter(i => i.olusturan_id === oturum?.id);

  const handleSil = async (ilanId) => {
    if (confirm("Bu ilanı silmek istediğinize emin misiniz?")) {
      ilanSil(ilanId);
      alert("İlan başarıyla silindi!");
    }
  };

  const handleAl = async (ilan) => {
    ilanAl(ilan.id, oturum);
  };

  return (
    <div className="scroll-content">
      <div className="section-title">KENDİ İLANLARIM ({mevcutIlanlar.length})</div>

      {mevcutIlanlar.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text3)" }}>
          <div style={{ fontSize: 56, marginBottom: 20 }}>📋</div>
          <div style={{ fontSize: 16, marginBottom: 8 }}>Henüz ilanınız yok</div>
          <div style={{ fontSize: 13 }}>Yeni ilan vererek başlayın!</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {mevcutIlanlar.map(ilan => (
            <div key={ilan.id} className="card" style={{ marginBottom: 0, border: ilan.durum === "aktif" ? "2px solid rgba(251,191,36,0.3)" : "1px solid rgba(239,68,68,0.2)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div className="display" style={{ fontSize: 18, color: "#fbbf24" }}>{ilan.yuk}</div>
                  <div style={{ fontSize: 12, color: "var(--text3)", letterSpacing: 1.5 }}>{ilan.nereden} → {ilan.nereye}</div>
                </div>
                <div style={{
                  padding: "6px 12px",
                  borderRadius: "20px",
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: "uppercase"
                }}>
                  {ilan.durum === "aktif" ? (
                    <span style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(16,185,129,0.1) 100%)", color: "#10b981" }}>
                      ✓ AKTİF
                    </span>
                  ) : (
                    <span style={{ background: "linear-gradient(135deg, rgba(239,68,68,0.2) 0%, rgba(239,68,68,0.1) 100%)", color: "#ef4444" }}>
                      ✗ PASİF
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#fbbf24" }}>₺{ilan.ucret.toLocaleString()}</div>

                <div style={{ display: "flex", gap: 8 }}>
                  {ilan.durum === "aktif" && (
                    <button
                      onClick={() => handleAl(ilan)}
                      className="btn btn-primary"
                      style={{ padding: "10px 18px", fontSize: 12 }}
                    >
                      ✓ Alındı
                    </button>
                  )}
                  <button
                    onClick={() => handleSil(ilan.id)}
                    className="btn btn-danger"
                    style={{ padding: "10px 18px", fontSize: 12 }}
                  >
                    🗑️ Sil
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function MesajlarSayfasi({ onGeri }) {
  const { oturum } = useApp();
  const { konusmalar } = useMesaj();
  const [secili, setSecili] = useState(null);

  if (secili) {
    const konusma = konusmalar?.find(k => k.id === secili);
    if (!konusma) {
      console.log("Konuşma bulunamadı, çıkılıyor:", secili);
      setSecili(null);
      return null;
    }
    return <ChatSayfasi konusmaId={secili} onGeri={() => setSecili(null)} isKamyoncu={oturum?.rol === "kamyoncu"} />;
  }

  return (
    <div className="scroll-content">
      <div className="section-title">MESAJLAR ({konusmalar?.length || 0})</div>
      {(!konusmalar || konusmalar.length === 0) ? (
        <EmptyState icon="💬" text="Henüz mesaj yok" />
      ) : (
        konusmalar.map(k => (
          <div key={k.id} className="card" style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }} onClick={() => setSecili(k.id)}>
            <div style={{ width: 46, height: 46, borderRadius: "50%", background: "linear-gradient(135deg, var(--guldum-gradient), var(--purple-gradient))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "#fff", flexShrink: 0 }}>
              {k.partnerRol === "kamyoncu" ? "🚛" : "🏢"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: "#fbbf24" }}>{k.partnerAd}</div>
              <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {k?.mesajlar?.length > 0 ? (k.mesajlar[k.mesajlar.length - 1].metin || "📄 Dosya gönderildi") : (k.baslik || "")}
              </div>
            </div>
            {k.okunmamis > 0 && (
              <div style={{
                background: "#3b82f6",
                color: "#fff",
                borderRadius: "50%",
                width: 22,
                height: 22,
                fontSize: 11,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                boxShadow: "0 4px 12px rgba(59,130,246,0.4)"
              }}>
                {k.okunmamis}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
