import { useState, useEffect, useRef } from "react";
import { useApp } from "../../context/AppContext";
import { useMesaj } from "../../context/MesajContext";
import { Pill } from "../../components/UI";
import { IconMap } from "../../components/Icons";

export default function ChatSayfasi({ konusmaId, onGeri, isKamyoncu }) {
  const { oturum } = useApp();
  const {
    konusmalar,
    mesajGonder,
    mesajiOkundu,
    tumMesajlariOkundu,
    dosyaYukle
  } = useMesaj();

  const [mesaj, setMesaj] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [dosya, setDosya] = useState(null);
  const messagesEndRef = useRef(null);
  const messageContainerRef = useRef(null);

  const konusma = konusmalar?.find(k => k.id === konusmaId);
  const isBenKamyoncu = oturum?.rol === "kamyoncu";
  const partnerAd = konusma?.partnerAd || "";
  const partnerRol = konusma?.partnerRol || "";
  const baslik = konusma?.baslik || "";
  const okunmamis = konusma?.okunmamis || 0;

  useEffect(() => {
    if (konusma) {
      messageContainerRef.current?.scrollTo({ top: messageContainerRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [konusma?.mesajlar]);

  // Her seferinde okunmamıs mesajları 0 yap
  useEffect(() => {
    if (okunmamis > 0) {
      tumMesajlariOkundu(konusmaId);
    }
  }, [konusmaId, tumMesajlariOkundu]);

  if (!konusma) return (
    <div className="scroll-content" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
      <div style={{ textAlign: "center" }}>
        <button onClick={onGeri} style={{ fontSize: 24, background: "none", border: "none", cursor: "pointer" }}>‹</button>
        <div className="display" style={{ fontSize: 20, marginTop: 16 }}>Konuşma bulunamadı</div>
      </div>
    </div>
  );

  const dosyaSecVeGonder = async (e) => {
    const dosya = e.target.files[0];
    if (!dosya) return;

    setYukleniyor(true);
    try {
      const yukluDosya = await dosyaYukle(dosya);
      await mesajGonder(konusmaId, "", yukluDosya.veriTipi, yukluDosya);
      setMesaj("");
      setDosya(null);
    } catch (err) {
      console.error("Dosya yükleme hatası:", err);
      alert("Dosya yüklenemedi: " + err.message);
    } finally {
      setYukleniyor(false);
    }
  };

  const gonder = async (e) => {
    e.preventDefault();
    if (!mesaj.trim() && !dosya) return;

    await mesajGonder(konusmaId, mesaj, "metin", null);
    setMesaj("");
    setDosya(null);
  };

  const ilkMesajiOkundu = konusma?.mesajlar?.length > 0 && konusma?.mesajlar?.[0]?.gonderen === "konusmaci";

  return (
    <div className="scroll-content" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 140px)" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: "1px solid var(--border)", background: konusma?.bg && typeof konusma.bg === 'string' ? konusma.bg : "var(--bg1)" }}>
        <button onClick={onGeri} style={{ fontSize: 24, background: "none", border: "none", cursor: "pointer" }}>‹</button>

        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 12 }}>
          {konusma?.resim ? (
            <img src={konusma.resim} alt="Profil" style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }} />
          ) : (
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--bg3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
              {partnerRol === "kamyoncu" ? <IconMap.truck size={20} /> : <IconMap.building size={20} />}
            </div>
          )}
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ fontWeight: 600, fontSize: 16 }}>{partnerAd || ""}</div>
              {partnerRol === "kamyoncu" && (
                <Pill durum="kamyoncu" />
              )}
              {partnerRol === "issiz" && (
                <Pill durum="issiz" />
              )}
            </div>
            {baslik && (
              <div style={{ fontSize: 12, color: "var(--text3)", fontWeight: 500 }}>
                {baslik}
              </div>
            )}
          </div>
        </div>

        {okunmamis > 0 && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            background: "var(--mavi)",
            color: "#fff",
            padding: "4px 10px",
            borderRadius: "20px",
            fontSize: 11,
            fontWeight: 600
          }}>
            <span>{okunmamis}</span>
            <span>Yeni</span>
          </div>
        )}

        <div style={{ fontSize: 11, color: "var(--text3)" }}>
          {konusma?.sonGuncelleme ? new Date(konusma.sonGuncelleme).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }) : "—"}
        </div>
      </div>

      {/* Mesajlar */}
      <div ref={messageContainerRef} style={{ flex: 1, overflowY: "auto", padding: 16, background: "var(--bg0)" }}>
        {konusma?.mesajlar?.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text3)" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}><IconMap.message size={40} className="icon-primary" /></div>
            <div>İlk mesajınızı gönderin</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {konusma.mesajlar.map((m, i) => {
              if (!m) return null;
              const isBen = m.gonderen === "ben";
              return (
                <div key={m.id || `msg-${i}`} style={{
                  maxWidth: "80%",
                  padding: "10px 14px",
                  borderRadius: "var(--r)",
                  fontSize: 14,
                  lineHeight: 1.5,
                  position: "relative",
                  alignSelf: isBen ? "flex-end" : "flex-start",
                  background: isBen ? "var(--mavi)" : "var(--bg3)",
                  color: isBen ? "#fff" : "var(--text2)",
                  animation: "fadeIn 0.3s ease"
                }}>
                  {m.veriTipi !== "metin" && m.veri && (
                    <div style={{
                      marginBottom: 8,
                      padding: "8px 12px",
                      background: "rgba(0,0,0,0.2)",
                      borderRadius: "8px",
                      border: "1px solid rgba(255,255,255,0.1)"
                    }}>
                      {m.veri.tip === "img" ? (
                        <img src={m.veri.veri} alt={m.veri.ad} style={{ maxWidth: 200, borderRadius: "6px", cursor: "pointer" }} />
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 20 }}>📄</span>
                          <div>
                            <div style={{ fontWeight: 600 }}>{m.veri.ad}</div>
                            <div style={{ fontSize: 11, opacity: 0.8 }}>{(m.veri.boyut / 1024).toFixed(1)} KB</div>
                          </div>
                        </div>
                      )}
                      {m.metin && <div style={{ marginTop: 8, color: "rgba(255,255,255,0.8)" }}>{m.metin}</div>}
                    </div>
                  )}
                  {m.metin && (
                    <div>
                      {m.metin.split("\n").map((line, idx) => {
                        const mapsRegex = /^🔗MAPS:(YÜKLEME|BOŞALTMA):(.+)/;
                        const mapsMatch = line.match(mapsRegex);
                        if (mapsMatch) {
                          const etiket = mapsMatch[1] === "YÜKLEME" ? "Yükleme" : "Boşaltma";
                          const adres = decodeURIComponent(mapsMatch[2].trim());
                          const arkaRenk = isBen ? "rgba(255,255,255,0.15)" : "rgba(239,68,68,0.1)";
                          const borderRenk = isBen ? "rgba(255,255,255,0.3)" : "rgba(239,68,68,0.3)";
                          const yaziRenk = isBen ? "#fff" : "#dc2626";
                          return (
                            <a key={`line-${idx}`} href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(adres)}`} target="_blank" rel="noopener noreferrer"
                              style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", cursor: "pointer", marginTop: 8, marginBottom: 4, padding: "10px 14px", borderRadius: "var(--r)", background: arkaRenk, border: `1px solid ${borderRenk}` }}>
                              <span style={{ fontSize: 28 }}>{etiket === "Yükleme" ? "📍" : "🏁"}</span>
                              <div style={{ display: "flex", flexDirection: "column" }}>
                                <span style={{ fontWeight: 700, fontSize: 14, color: yaziRenk }}>{etiket.toUpperCase()} KONUMU</span>
                                <span style={{ fontSize: 12, color: yaziRenk, opacity: 0.8 }}>Google Maps'te Aç →</span>
                              </div>
                            </a>
                          );
                        }
                        return <div key={`line-${idx}`}>{line || <br />}</div>;
                      })}
                    </div>
                  )}
                  <div style={{
                    fontSize: 9,
                    marginTop: 4,
                    opacity: 0.6,
                    textAlign: isBen ? "right" : "left"
                  }}>
                    {new Date(m.zaman).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                    {m.okunduZamani && !isBen && (
                      <span> ✓</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ padding: 12, borderTop: "1px solid var(--border)", background: "var(--bg1)" }}>
        <form onSubmit={gonder} style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <label style={{ padding: 10, cursor: "pointer", background: "var(--bg2)", borderRadius: "var(--r)", fontSize: 20, transition: "all 0.2s" }} title="Dosya yükle">
            📎
            <input type="file" accept="image/*,.pdf" onChange={dosyaSecVeGonder} style={{ display: "none" }} />
          </label>

          <input
            className="input"
            placeholder="Mesaj yazın..."
            value={mesaj}
            onChange={e => setMesaj(e.target.value)}
            onKeyPress={e => e.key === "Enter" && gonder(e)}
            style={{ flex: 1, padding: "10px 14px" }}
          />

          <button
            type="submit"
            disabled={!mesaj.trim() && !dosya || yukleniyor}
            className="btn btn-primary"
            style={{
              padding: "10px 16px",
              background: (mesaj.trim() || dosya) && !yukleniyor ? "var(--mavi)" : "var(--bg3)",
              opacity: (mesaj.trim() || dosya) && !yukleniyor ? 1 : 0.5,
              cursor: (mesaj.trim() || dosya) && !yukleniyor ? "pointer" : "not-allowed",
              borderRadius: "var(--r)",
              fontSize: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            {yukleniyor ? "⏳" : "➤"}
          </button>
        </form>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
