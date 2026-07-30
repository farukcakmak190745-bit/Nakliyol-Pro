import { useState, useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import { useMesaj } from "../context/MesajContext";

export default function ChatSayfasi({ konusmaId, onGeri, isKamyoncu }) {
  try {
    const { oturum } = useApp();
    const {
      konusmalar,
      mesajGonder,
      mesajiOkundu,
      tumMesajlariOkundu,
      konusmaBasliginiGuncelle,
      konusmaTemizle
    } = useMesaj();

  console.log("ChatSayfasi rendered - konusmaId:", konusmaId, "oturum:", oturum);

  const [mesaj, setMesaj] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [dosya, setDosya] = useState(null);
  const [konusmaAcildi, setKonusmaAcildi] = useState(false);
  const [konusmaBitti, setKonusmaBitti] = useState(false);
  const messageContainerRef = useRef(null);

  const konusma = konusmalar?.find(k => k.id === konusmaId);
  const isBenKamyoncu = oturum?.rol === "kamyoncu";
  const partnerAd = konusma?.partnerAd || "";
  const partnerRol = konusma?.partnerRol || "";
  const baslik = konusma?.baslik || "";
  const okunmamis = konusma?.okunmamis || 0;
  const sonGuncelleme = konusma?.sonGuncelleme || new Date().toISOString();

  if (!konusma) {
    return (
      <div className="scroll-content" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div style={{ textAlign: "center" }}>
          <button onClick={onGeri} style={{ fontSize: 24, background: "none", border: "none", cursor: "pointer" }}>‹</button>
          <div className="display" style={{ fontSize: 20, marginTop: 16 }}>Konuşma bulunamadı</div>
        </div>
      </div>
    );
  }

  if (!oturum) {
    return (
      <div className="scroll-content" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div style={{ textAlign: "center" }}>
          <div className="display" style={{ fontSize: 20, marginTop: 16 }}>Giriş yapınız</div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (konusma && konusma.mesajlar.length === 0) {
      setKonusmaAcildi(true);
      setTimeout(() => {
        setKonusmaAcildi(false);
      }, 3000);
    }
  }, [konusma?.id]);

  useEffect(() => {
    if (konusma) {
      messageContainerRef.current?.scrollTo({ top: messageContainerRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [konusma?.mesajlar.length]);

  useEffect(() => {
    if (okunmamis > 0) {
      tumMesajlariOkundu(konusmaId);
    }
  }, [okunmamis, konusmaId, tumMesajlariOkundu]);

  useEffect(() => {
    if (konusma?.mesajlar.length > 0) {
      messageContainerRef.current?.scrollTo({ top: messageContainerRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [konusma?.mesajlar]);

  if (!konusma) return (
    <div className="scroll-content" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
      <div style={{ textAlign: "center" }}>
        <button onClick={onGeri} style={{ fontSize: 24, background: "none", border: "none", cursor: "pointer" }}>‹</button>
        <div className="display" style={{ fontSize: 20, marginTop: 16 }}>Konuşma bulunamadı</div>
      </div>
    </div>
  );

  const dosyaYukle = async (e) => {
    const dosya = e.target.files[0];
    if (!dosya) return;

    setYukleniyor(true);
    try {
      const yukluDosya = await dosyaYukle(dosya);
      await mesajGonder(konusmaId, "", yukluDosya.veriTipi, yukluDosya);
      setMesaj("");
      setDosya(null);
    } catch (err) {
      alert("Dosya yüklenemedi");
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

  const gonderildiGöstergesi = useRef(false);

  useEffect(() => {
    if (gonderildiGöstergesi.current) return;

    gonderildiGöstergesi.current = true;
    setTimeout(() => {
      gonderildiGöstergesi.current = false;
    }, 3000);
  }, [konusma?.mesajlar]);

  const temizle = () => {
    konusmaTemizle(konusmaId);
    setKonusmaBitti(true);
    setTimeout(() => {
      setKonusmaBitti(false);
    }, 2000);
  };

    return (
      <div className="scroll-content" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 140px)" }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12, padding: "14px 18px",
        borderBottom: "1px solid rgba(251,191,36,0.2)",
        background: "linear-gradient(135deg, rgba(251,191,36,0.08) 0%, rgba(22,22,22,0.9) 100%)",
        backdropFilter: "blur(10px)"
      }}>
        <button onClick={onGeri} style={{ fontSize: 24, background: "none", border: "none", cursor: "pointer", transition: "var(--tr)" }}>‹</button>

        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg, var(--guldum-gradient), var(--purple-gradient))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "#fff" }}>
            {partnerRol === "kamyoncu" ? "🚛" : "🏢"}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ fontWeight: 600, fontSize: 16, color: "#fbbf24" }}>{partnerAd}</div>
            </div>
            {baslik && (
              <div style={{ fontSize: 12, color: "var(--text2)", fontWeight: 500 }}>
                {baslik}
              </div>
            )}
          </div>
        </div>

        {okunmamis > 0 && (
          <div style={{
            display: "flex", alignItems: "center", gap: 4,
            background: "linear-gradient(135deg, var(--guldum-gradient), #ea580c)",
            color: "#fff",
            padding: "5px 12px",
            borderRadius: "20px",
            fontSize: 11,
            fontWeight: 700,
            boxShadow: "0 4px 12px rgba(251,191,36,0.3)"
          }}>
            <span>{okunmamis}</span>
            <span>Yeni</span>
          </div>
        )}

        <div style={{ fontSize: 11, color: "var(--text3)" }}>
          {new Date(sonGuncelleme).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>

      {/* Mesajlar */}
      <div ref={messageContainerRef} style={{ flex: 1, overflowY: "auto", padding: 16, background: "var(--bg)" }}>
        {konusma.mesajlar.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text3)" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
            <div>İlk mesajınızı gönderin</div>
          </div>
        ) : (
          <>
            {konusma.yaziyor && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", background: "var(--bg1)", borderRadius: "12px", marginBottom: 12, animation: "fadeIn 0.3s" }}>
                <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, animation: "bounce 1.4s infinite ease-in-out both" }}>
                  <span style={{ animationDelay: "-0.32s" }}>•</span>
                  <span style={{ animationDelay: "-0.16s" }}>•</span>
                  <span>•</span>
                </div>
                <div style={{ fontSize: 13, color: "var(--text2)" }}>
                  {konusma.yaziyorAd || partnerAd} yazıyor...
                </div>
              </div>
            )}

            {konusmaBitti && (
              <div style={{ textAlign: "center", padding: "12px", fontSize: 13, color: "var(--text3)", background: "var(--bg1)", borderRadius: "12px", marginBottom: 12, animation: "fadeIn 0.3s" }}>
                ✅ Mesajlar temizlendi
              </div>
            )}

            {gonderildiGöstergesi.current && konusma.mesajlar.length > 1 && (
              <div style={{ textAlign: "center", padding: "12px", fontSize: 13, color: "var(--text3)", background: "var(--bg1)", borderRadius: "12px", marginBottom: 12, animation: "fadeIn 0.3s" }}>
                ✅ Gönderildi
              </div>
            )}

            {konusmaAcildi && (
              <div style={{ textAlign: "center", padding: "8px", fontSize: 12, color: "var(--text2)", background: "var(--bg1)", borderRadius: "12px", marginBottom: 8, animation: "fadeIn 0.3s" }}>
                🎉 Konuşma başladı
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {konusma.mesajlar.map((m, i) => {
                if (!m) return null;
                const isBen = m.gonderen === "ben";
                return (
                  <div key={m.id || `msg-${i}`} style={{
                    maxWidth: "80%",
                    padding: "12px 16px",
                    borderRadius: "16px",
                    fontSize: 14,
                    lineHeight: 1.6,
                    position: "relative",
                    alignSelf: isBen ? "flex-end" : "flex-start",
                    background: isBen ? "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)" : "var(--bg2)",
                    color: isBen ? "#fff" : "var(--text2)",
                    animation: "fadeIn 0.3s ease",
                    border: isBen ? "1px solid rgba(59,130,246,0.3)" : "1px solid rgba(251,191,36,0.1)",
                    boxShadow: isBen ? "0 4px 20px rgba(59,130,246,0.2)" : "none"
                  }}>
                    {m.veriTipi !== "metin" && m.veri && (
                      <div style={{
                        marginBottom: 8,
                        padding: "10px 14px",
                        background: "rgba(0,0,0,0.2)",
                        borderRadius: "10px",
                        border: "1px solid rgba(255,255,255,0.1)"
                      }}>
                        {m.veri.tip === "img" ? (
                          <img src={m.veri.veri} alt={m.veri.ad} style={{ maxWidth: 200, borderRadius: "8px", cursor: "pointer", border: "1px solid rgba(255,255,255,0.2)" }} />
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
                          const konumRegex = /^([📍🏁])\s*(.+?):\s*(.+)/;
                          const konumMatch = line.match(konumRegex);
                          if (konumMatch) {
                            const adres = encodeURIComponent(konumMatch[3].trim());
                            return (
                              <div key={`line-${idx}`} style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                <span>{line}</span>
                                <a href={`https://www.google.com/maps/search/?api=1&query=${adres}`} target="_blank" rel="noopener noreferrer"
                                  style={{ display: "inline-flex", alignItems: "center", textDecoration: "none", cursor: "pointer", fontSize: 20, filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.2))" }}
                                  title="Google Maps'te aç">
                                  🗺️
                                </a>
                              </div>
                            );
                          }
                          return <div key={`line-${idx}`}>{line || <br />}</div>;
                        })}
                      </div>
                    )}
                    <div style={{
                      fontSize: 9,
                      marginTop: 6,
                      opacity: 0.6,
                      textAlign: isBen ? "right" : "left",
                      display: "flex",
                      alignItems: "center",
                      gap: 4
                    }}>
                      {new Date(m.zaman).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                      {m.okunduZamani && !isBen && (
                        <span style={{ color: "#10b981", fontSize: 10 }}> ✓</span>
                      )}
                      {isBen && (
                        <span style={{ color: "rgba(255,255,255,0.5)" }}>
                          {new Date(m.zaman).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                      <div style={{ flex: 1 }}></div>
                      <button
                        onClick={temizle}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          opacity: 0.4,
                          fontSize: 12,
                          padding: "4px 8px",
                          borderRadius: "6px",
                          transition: "all 0.2s"
                        }}
                        title="Mesajları sil"
                      >
                        🗑️ Temizle
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Input */}
      <div style={{ padding: 14, borderTop: "1px solid rgba(251,191,36,0.2)", background: "linear-gradient(180deg, var(--bg1) 0%, var(--bg) 100%)" }}>
        <form onSubmit={gonder} style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <label style={{ padding: 12, cursor: "pointer", background: "var(--bg2)", borderRadius: "12px", fontSize: 20, transition: "all 0.2s" }} title="Dosya yükle">
            📎
            <input type="file" accept="image/*,.pdf" onChange={dosyaYukle} style={{ display: "none" }} />
          </label>

          <input
            className="input"
            placeholder="Mesaj yazın..."
            value={mesaj}
            onChange={e => setMesaj(e.target.value)}
            onKeyPress={e => e.key === "Enter" && gonder(e)}
            style={{ flex: 1, padding: "12px 16px" }}
          />

          <button
            type="submit"
            disabled={!mesaj.trim() && !dosya || yukleniyor}
            className="btn"
            style={{
              padding: "12px 18px",
              background: (mesaj.trim() || dosya) && !yukleniyor ? "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)" : "var(--bg3)",
              opacity: (mesaj.trim() || dosya) && !yukleniyor ? 1 : 0.5,
              cursor: (mesaj.trim() || dosya) && !yukleniyor ? "pointer" : "not-allowed",
              borderRadius: "12px",
              fontSize: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "var(--tr)"
            }}
            title={yukleniyor ? "Yükleniyor..." : "Gönder"}
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
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
  } catch (error) {
    console.error('ChatSayfasi Component Error:', error);
    return (
      <div style={{
        padding: 20,
        textAlign: 'center',
        color: 'var(--text3)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px'
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🚨</div>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Chat Sayfası Hatası</div>
        <div style={{ fontSize: 12, marginBottom: 16 }}>{error.message}</div>
        <button onClick={() => window.location.reload()} style={{
          padding: '10px 20px',
          background: 'var(--guldum-gradient)',
          border: 'none',
          borderRadius: '8px',
          color: '#0a0a0a',
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer'
        }}>
          Sayfayı Yenile
        </button>
      </div>
    );
  }
}
