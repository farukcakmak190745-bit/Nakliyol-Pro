import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { YildizSecici } from "./Yildizlar";

const etiketler = {
  5: "Mükemmel!",
  4: "İyi",
  3: "Orta",
  2: "Kötü",
  1: "Çok kötü"
};

export default function DegerlendirmeModal({ hedefId, hedefAd, seferId, seferOzet, onKapat }) {
  const { degerlendirmeGonder } = useApp();
  const [puan, setPuan] = useState(5);
  const [yorum, setYorum] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [gonderildi, setGonderildi] = useState(false);
  const [hata, setHata] = useState(null);

  const gonder = async () => {
    if (!hedefId || !seferId) return;
    setYukleniyor(true);
    setHata(null);
    const sonuc = await degerlendirmeGonder({
      hedefId,
      seferId,
      puan,
      yorum: yorum.trim()
    });
    setYukleniyor(false);
    if (sonuc.ok) {
      setGonderildi(true);
      setTimeout(() => onKapat && onKapat(), 1400);
    } else {
      setHata(sonuc.error || "Değerlendirme gönderilemedi");
    }
  };

  return (
    <div className="sheet-overlay" onClick={() => !yukleniyor && onKapat && onKapat()}>
      <div className="sheet" onClick={e => e.stopPropagation()} style={{
        background: "var(--bg1)", borderRadius: "20px 20px 0 0",
        maxHeight: "85vh", overflowY: "auto"
      }}>
        <div style={{ maxWidth: 440, margin: "0 auto", padding: 24 }}>
          {gonderildi ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text)" }}>
                Değerlendirmeniz gönderildi!
              </div>
              <div style={{ fontSize: 13, color: "var(--text3)", marginTop: 6 }}>
                Teşekkürler, güvenilirlik puanına katkı sağladınız.
              </div>
            </div>
          ) : (
            <>
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text)" }}>
                  ⭐ {hedefAd} değerlendirin
                </div>
                {seferOzet && (
                  <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 6 }}>
                    {seferOzet}
                  </div>
                )}
              </div>

              <div style={{
                background: "var(--bg2)", borderRadius: 14, padding: "20px 16px",
                border: "1px solid var(--border2)", marginBottom: 16
              }}>
                <YildizSecici deger={puan} setDeger={setPuan} />
                <div style={{ textAlign: "center", marginTop: 10, fontSize: 14, fontWeight: 700, color: "#f59e0b" }}>
                  {etiketler[puan]}
                </div>
              </div>

              <textarea
                value={yorum}
                onChange={e => setYorum(e.target.value.slice(0, 300))}
                placeholder="Deneyiminizi kısaca paylaşın (isteğe bağlı)..."
                rows={3}
                style={{
                  width: "100%", padding: "12px 14px", boxSizing: "border-box",
                  background: "var(--bg2)", border: "1px solid var(--border2)",
                  borderRadius: 12, fontSize: 14, color: "var(--text)",
                  outline: "none", resize: "none", fontFamily: "inherit",
                  marginBottom: 6
                }}
              />
              <div style={{ textAlign: "right", fontSize: 11, color: "var(--text3)", marginBottom: 14 }}>
                {yorum.length}/300
              </div>

              {hata && (
                <div style={{
                  marginBottom: 12, padding: "10px 14px", fontSize: 12,
                  background: "rgba(239,68,68,0.1)", color: "#ef4444",
                  border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10
                }}>
                  ⚠️ {hata}
                </div>
              )}

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={onKapat}
                  disabled={yukleniyor}
                  style={{
                    flex: 1, padding: "13px", background: "var(--bg2)",
                    border: "1px solid var(--border2)", borderRadius: 12,
                    fontSize: 14, fontWeight: 600, color: "var(--text2)",
                    cursor: "pointer"
                  }}
                >
                  Vazgeç
                </button>
                <button
                  onClick={gonder}
                  disabled={yukleniyor}
                  style={{
                    flex: 1, padding: "13px",
                    background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                    color: "#fff", border: "none", borderRadius: 12,
                    fontSize: 14, fontWeight: 700, cursor: "pointer",
                    opacity: yukleniyor ? 0.6 : 1
                  }}
                >
                  {yukleniyor ? "⏳ Gönderiliyor..." : "Gönder"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
