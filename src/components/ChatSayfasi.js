import { useState, useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import { useMesaj } from "../context/MesajContext";

export default function ChatSayfasi({ konusmaId, onGeri, isKamyoncu }) {
  try {
    const { oturum, seferler } = useApp();
    const {
      konusmalar,
      mesajGonder,
      mesajiOkundu,
      tumMesajlariOkundu,
      konusmaBasliginiGuncelle,
      konusmaTemizle,
      dosyaYukle,
      yaziyorGoster,
      mesajSil
    } = useMesaj();

  console.log("ChatSayfasi rendered - konusmaId:", konusmaId, "oturum:", oturum);

  const [mesaj, setMesaj] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [dosya, setDosya] = useState(null);
  const [konusmaAcildi, setKonusmaAcildi] = useState(false);
  const [konusmaBitti, setKonusmaBitti] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [galeriAcik, setGaleriAcik] = useState(false);
  const messageContainerRef = useRef(null);
  const yaziyorTimerRef = useRef(null);

  // Medya galerisi için
  const medyaList = konusma?.mesajlar?.filter(m => m.veri && (m.veri.tip === "img" || m.veri.tip === "pdf")) || [];

  const konusma = konusmalar?.find(k => k.id === konusmaId);
  const isBenKamyoncu = oturum?.rol === "kamyoncu";
  const partnerAd = konusma?.partnerAd || "";
  const partnerRol = konusma?.partnerRol || "";
  const baslik = konusma?.baslik || "";
  const okunmamis = konusma?.okunmamis || 0;
  const sonGuncelleme = konusma?.sonGuncelleme || new Date().toISOString();
  const ilanId = konusma?.ilan_id;
  const sefer = seferler?.find(s => s.ilan_id === ilanId || s.ilanId === ilanId);

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
        background: "linear-gradient(135deg, rgba(251,191,36,0.08) 0%, rgba(248,247,244,0.95) 100%)",
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
            background: "linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)",
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

        {/* Galeri butonu */}
        {medyaList.length > 0 && (
          <button onClick={() => setGaleriAcik(true)} style={{
            background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)",
            borderRadius: "10px", padding: "6px 10px", cursor: "pointer", fontSize: 16
          }} title="Medya galerisi">
            🖼️ {medyaList.length}
          </button>
        )}
        <button onClick={() => { if (confirm('Tüm mesajlar silinsin mi?')) { konusmaTemizle(konusmaId); } }} style={{
          background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
          borderRadius: "10px", padding: "6px 10px", cursor: "pointer", fontSize: 14
        }} title="Tüm mesajları sil">
          🗑️
        </button>
          </div>

            {/* İş Kartı */}
            {sefer && (
              <div style={{
                margin: "0 12px 8px", padding: "12px 16px",
                background: "linear-gradient(135deg, rgba(251,191,36,0.1) 0%, rgba(248,247,244,0.9) 100%)",
                border: "1px solid rgba(251,191,36,0.2)", borderRadius: "14px"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 18 }}>
                    {sefer.durum === "yolda" ? "🚚" : sefer.durum === "teslima_bekleniyor" ? "📦" : sefer.durum === "odendi" ? "✅" : "⏳"}
                  </span>
                  <span style={{ fontWeight: 600, fontSize: 13, color: "#fbbf24" }}>
                    {sefer.durum === "bekliyor" ? "Başvuru Bekliyor" :
                     sefer.durum === "yolda" ? "Yolda" :
                     sefer.durum === "teslima_bekleniyor" ? "Teslim Bekleniyor" :
                     sefer.durum === "odendi" ? "Ödendi" : sefer.durum}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 10 }}>
                  {sefer.yuk} — {sefer.nereden} → {sefer.nereye}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {sefer.durum === "yolda" && (
                    <button onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(sefer.nereye || '')}`, '_blank')}
                      style={{ flex: 1, padding: "8px 12px", background: "var(--bg2)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: "10px", cursor: "pointer", fontSize: 12, color: "var(--text2)" }}>
                      📍 Konumu Gör
                    </button>
                  )}
                  {sefer.durum === "teslima_bekleniyor" && isBenKamyoncu && (
                    <button onClick={() => window.location.href = `tel:${sefer.olusturan_tel || ''}`}
                      style={{ flex: 1, padding: "8px 12px", background: "var(--bg2)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: "10px", cursor: "pointer", fontSize: 12, color: "var(--text2)" }}>
                      📞 İşvereni Ara
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Lightbox */}
            {lightboxImage && (
              <div onClick={() => setLightboxImage(null)} style={{
                position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                background: "rgba(0,0,0,0.95)", zIndex: 1000,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "zoom-out"
              }}>
                <img src={lightboxImage} style={{
                  maxWidth: "95%", maxHeight: "95%", objectFit: "contain",
                  borderRadius: "8px"
                }} />
                <button onClick={() => setLightboxImage(null)} style={{
                  position: "absolute", top: 20, right: 20,
                  background: "rgba(255,255,255,0.1)", border: "none",
                  color: "#fff", fontSize: 28, width: 44, height: 44,
                  borderRadius: "50%", cursor: "pointer"
                }}>✕</button>
              </div>
            )}

            {/* Medya Galerisi */}
            {galeriAcik && (
              <div onClick={() => setGaleriAcik(false)} style={{
                position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                background: "rgba(0,0,0,0.92)", zIndex: 999,
                display: "flex", flexDirection: "column", padding: 20,
                overflowY: "auto"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div style={{ color: "#fff", fontSize: 18, fontWeight: 600 }}>🖼️ Medya ({medyaList.length})</div>
                  <button onClick={() => setGaleriAcik(false)} style={{
                    background: "rgba(255,255,255,0.1)", border: "none",
                    color: "#fff", fontSize: 24, width: 40, height: 40,
                    borderRadius: "50%", cursor: "pointer"
                  }}>✕</button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                  {medyaList.map((m, i) => (
                    m.veri.tip === "img" ? (
                      <img key={m.id || i} src={m.veri.veri}
                        onClick={(e) => { e.stopPropagation(); setLightboxImage(m.veri.veri); }}
                        style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: "8px", cursor: "pointer" }} />
                    ) : (
                      <div key={m.id || i} onClick={(e) => e.stopPropagation()}
                        style={{
                          aspectRatio: "1", borderRadius: "8px", cursor: "pointer",
                          background: "rgba(255,255,255,0.1)", display: "flex",
                          flexDirection: "column", alignItems: "center", justifyContent: "center",
                          fontSize: 12, color: "#fff", gap: 4, padding: 8
                        }}>
                        <span style={{ fontSize: 24 }}>📄</span>
                        <span style={{ textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>
                          {m.veri.ad || "Dosya"}
                        </span>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}

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
                <div style={{ width: 16, height: 16, borderRadius: "50%", background: "var(--mavi)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, animation: "bounce 1.4s infinite ease-in-out both" }}>
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
                    background: isBen ? "var(--satin-gradient)" : "var(--bg2)",
                    color: isBen ? "#fff" : "var(--text2)",
                    animation: "fadeIn 0.3s ease",
                    border: isBen ? "1px solid rgba(29,78,216,0.2)" : "1px solid rgba(245,158,11,0.1)",
                    boxShadow: isBen ? "0 4px 20px rgba(29,78,216,0.15)" : "none"
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
                          <img src={m.veri.veri} alt={m.veri.ad}
                            onClick={() => setLightboxImage(m.veri.veri)}
                            style={{ maxWidth: 200, borderRadius: "8px", cursor: "pointer", border: "1px solid rgba(255,255,255,0.2)" }} />
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
                                style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", cursor: "pointer", marginTop: 8, marginBottom: 4, padding: "10px 14px", borderRadius: 12, background: arkaRenk, border: `1px solid ${borderRenk}` }}>
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
                      marginTop: 6,
                      opacity: 0.6,
                      textAlign: isBen ? "right" : "left",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      justifyContent: isBen ? "flex-end" : "flex-start"
                    }}>
                      {new Date(m.zaman).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                      {isBen && (
                        <span style={{ fontSize: 11, lineHeight: 1 }}>
                          {m.id?.startsWith("temp_") ? "⏳" : m.okunduZamani ? "✓✓" : "✓"}
                        </span>
                      )}
                      {!isBen && m.okunduZamani && (
                        <span style={{ color: "#10b981", fontSize: 10 }}> ✓</span>
                      )}
                      <div style={{ flex: 1 }}></div>
                      <button
                        onClick={() => mesajSil(konusmaId, m.id)}
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
                        title="Mesajı sil"
                      >
                        ✕
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
            <input type="file" accept="image/*,.pdf" onChange={dosyaSecVeGonder} style={{ display: "none" }} />
          </label>

          <input
            className="input"
            placeholder="Mesaj yazın..."
            value={mesaj}
            onChange={e => {
              setMesaj(e.target.value);
              clearTimeout(yaziyorTimerRef.current);
              yaziyorGoster(konusmaId, true, oturum?.id, oturum?.ad);
              yaziyorTimerRef.current = setTimeout(() => {
                yaziyorGoster(konusmaId, false, oturum?.id, oturum?.ad);
              }, 2000);
            }}
            onKeyPress={e => e.key === "Enter" && gonder(e)}
            style={{ flex: 1, padding: "12px 16px" }}
          />

          <button
            type="submit"
            disabled={!mesaj.trim() && !dosya || yukleniyor}
            className="btn"
            style={{
              padding: "12px 18px",
              background: (mesaj.trim() || dosya) && !yukleniyor ? "var(--satin-gradient)" : "var(--bg3)",
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
