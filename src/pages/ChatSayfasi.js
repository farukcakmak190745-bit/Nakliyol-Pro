import { useState, useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import { useMesaj } from "../context/MesajContext";
import { Pill } from "../components/UI";
import { IconMap } from "../components/Icons";
import { supabase } from "../supabaseClient";

export default function ChatSayfasi({ konusmaId, onGeri, isKamyoncu }) {
  const { oturum, seferler } = useApp();
  const {
    konusmalar,
    konusmaAc,
    mesajGonder,
    mesajiOkundu,
    tumMesajlariOkundu,
    konusmaBasliginiGuncelle
  } = useMesaj();

  const [mesaj, setMesaj] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [dosya, setDosya] = useState(null);
  const [aramaModalAcik, setAramaModalAcik] = useState(false);
  const [kopyalandi, setKopyalandi] = useState(false);
  const [dinamikTel, setDinamikTel] = useState(null);
  const messagesEndRef = useRef(null);
  const messageContainerRef = useRef(null);
  const scrollTimeoutRef = useRef(null);
  const okunduIkaz = useRef(false);

  const konusma = konusmalar?.find(k => k.id === konusmaId);
  const isBenKamyoncu = oturum?.rol === "kamyoncu" || oturum?.role === "kamyoncu";
  const partnerAd = konusma?.partnerAd || "";
  const partnerRol = konusma?.partnerRol || "";
  const baslik = konusma?.baslik || "";
  const okunmamis = konusma?.okunmamis || 0;
  const ilanId = konusma?.ilan_id;

  const sefer = seferler?.find(s => s.ilan_id === ilanId || s.ilanId === ilanId);
  const partnerUserId = konusma?.user_id === oturum?.id ? konusma?.partner_id : konusma?.user_id;
  const partnerTel = dinamikTel ||
                     konusma?.partnerTel ||
                     konusma?.partner_tel ||
                     (isBenKamyoncu ? (sefer?.olusturan_tel || sefer?.olusturanTel) : (sefer?.kamyoncu_tel || sefer?.kamyoncuTel)) ||
                     null;

  useEffect(() => {
    if (!partnerTel && partnerUserId && supabase) {
      supabase.from('users').select('telefon').eq('id', partnerUserId).maybeSingle().then(({ data }) => {
        if (data?.telefon) {
          setDinamikTel(data.telefon);
        }
      });
    }
  }, [partnerUserId, partnerTel]);

  const dosyaAc = (veri) => {
    if (!veri?.veri) return;
    const win = window.open();
    if (win) {
      win.document.write(`<iframe src="${veri.veri}" style="width:100%;height:100%;border:none"></iframe>`);
      win.document.title = veri.ad || "Dosya";
    }
  };

  useEffect(() => {
    if (konusma) {
      messageContainerRef.current?.scrollTo({ top: messageContainerRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [konusma?.mesajlar]);

  useEffect(() => {
    if (okunmamis > 0 && !okunduIkaz.current && konusmaId) {
      console.log(<>{IconMap.search} {okunmamis} okunmamıs mesaj var, işaretleniyor: {konusmaId}</>);
      tumMesajlariOkundu(konusmaId);
      okunduIkaz.current = true;
    }
  }, [okunmamis, konusmaId, tumMesajlariOkundu]);

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
    const yukluDosya = await mesajGonder.dosyaYukle(dosya);
    await mesajGonder(konusmaId, "", yukluDosya.tip, yukluDosya);
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

        {/* Telefon Arama Butonu */}
        <button onClick={() => setAramaModalAcik(true)} style={{
          background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
          color: "#fff",
          border: "none",
          borderRadius: "10px",
          padding: "6px 12px",
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: 6,
          boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)",
          transition: "all 0.2s ease"
        }} title={`${partnerAd} Telefon Et`}>
          <span>📞</span>
          <span>Ara</span>
        </button>

        <div style={{ fontSize: 11, color: "var(--text3)" }}>
          {konusma?.sonGuncelleme ? new Date(konusma.sonGuncelleme).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }) : "—"}
        </div>
      </div>

      {/* Telefon Arama Modalı */}
      {aramaModalAcik && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
          zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center",
          padding: 20
        }} onClick={() => setAramaModalAcik(false)}>
          <div style={{
            background: "var(--bg1, #ffffff)", border: "1px solid rgba(251,191,36,0.3)",
            borderRadius: "20px", padding: "24px", maxWidth: "380px", width: "100%",
            boxShadow: "0 20px 40px rgba(0,0,0,0.3)", textAlign: "center"
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              width: 60, height: 60, borderRadius: "50%",
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 28, color: "#fff", boxShadow: "0 8px 20px rgba(16,185,129,0.3)"
            }}>
              📞
            </div>

            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text1, #111)", marginBottom: 4 }}>
              {partnerAd || "Kullanıcı"}
            </div>
            <div style={{ fontSize: 12, color: "var(--text2, #666)", marginBottom: 16, fontWeight: 500 }}>
              {partnerRol === "kamyoncu" ? "🚛 Nakliyeci / Kamyoncu" : "🏢 Müşteri / İşveren"}
            </div>

            {partnerTel ? (
              <>
                <div style={{
                  background: "rgba(251,191,36,0.1)", border: "1px dashed rgba(251,191,36,0.4)",
                  borderRadius: "12px", padding: "12px", marginBottom: 20,
                  fontSize: 20, fontWeight: 800, color: "#d97706", letterSpacing: 1
                }}>
                  {partnerTel}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <a
                    href={`tel:${partnerTel.replace(/\s+/g, '')}`}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                      color: "#fff", padding: "14px", borderRadius: "12px",
                      fontWeight: 700, fontSize: 15, textDecoration: "none",
                      boxShadow: "0 4px 14px rgba(16,185,129,0.35)"
                    }}
                  >
                    <span>📞</span> Hemen Ara
                  </a>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(partnerTel);
                      setKopyalandi(true);
                      setTimeout(() => setKopyalandi(false), 2000);
                    }}
                    style={{
                      background: "var(--bg2, #f3f4f6)", border: "1px solid var(--border, #e5e7eb)",
                      color: "var(--text1, #374151)", padding: "12px", borderRadius: "12px",
                      fontWeight: 600, fontSize: 14, cursor: "pointer", display: "flex",
                      alignItems: "center", justifyContent: "center", gap: 6
                    }}
                  >
                    📋 {kopyalandi ? "Numara Kopyalandı! ✓" : "Numarayı Kopyala"}
                  </button>
                </div>
              </>
            ) : (
              <div style={{
                background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: "12px", padding: "16px", color: "#dc2626", fontSize: 13, marginBottom: 16
              }}>
                ⚠️ Bu kullanıcının kayıtlı telefon numarası bulunamadı.
              </div>
            )}

            <button
              onClick={() => setAramaModalAcik(false)}
              style={{
                marginTop: 16, background: "none", border: "none",
                color: "var(--text3, #9ca3af)", fontSize: 13, cursor: "pointer", fontWeight: 500
              }}
            >
              Kapat
            </button>
          </div>
        </div>
      )}

      {/* Mesajlar */}
      <div ref={messageContainerRef} style={{ flex: 1, overflowY: "auto", padding: 16, background: "var(--bg0)" }}>
        {konusma?.mesajlar?.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text3)" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}><IconMap.message size={40} className="icon-primary" /></div>
            <div>İlk mesajınızı gönderin</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {konusma?.mesajlar?.map((m, i) => {
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
                  {m.veri && m.veri.tip && (
                    <div style={{
                      marginBottom: 8,
                      padding: "8px 12px",
                      background: "rgba(0,0,0,0.2)",
                      borderRadius: "8px",
                      border: "1px solid rgba(255,255,255,0.1)"
                    }}>
                      {m.veri.tip === "img" ? (
                        <img src={m.veri.veri} alt={m.veri.ad} onClick={() => dosyaAc(m.veri)} style={{ maxWidth: 200, borderRadius: "6px", cursor: "pointer" }} />
                      ) : (
                        <div onClick={() => dosyaAc(m.veri)} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                          <span style={{ fontSize: 20 }}>📄</span>
                          <div>
                            <div style={{ fontWeight: 600 }}>{m.veri.ad || ""}</div>
                            <div style={{ fontSize: 11, opacity: 0.8 }}>{m.veri.boyut ? (m.veri.boyut / 1024).toFixed(1) : 0} KB</div>
                          </div>
                        </div>
                      )}
                      {m.metin && <div style={{ marginTop: 8, color: "rgba(255,255,255,0.8)" }}>{m.metin}</div>}
                    </div>
                  )}
                  {m.metin && (
                    <div>
                      {m.metin.split("\n").map((line, idx) => (
                        <div key={`line-${idx}`}>{line || <br />}</div>
                      ))}
                    </div>
                  )}
                  <div style={{
                    fontSize: 9,
                    marginTop: 4,
                    opacity: 0.6,
                    textAlign: isBen ? "right" : "left"
                  }}>
                    {new Date(m.zaman).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                    {isBen && (
                      <span style={{ fontSize: 11, lineHeight: 1 }}>
                        {m.id?.startsWith("temp_") ? "⏳" : m.okunduZamani ? "✓✓" : "✓"}
                      </span>
                    )}
                    {!isBen && m.okunduZamani && <span> ✓</span>}
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
          <label
            style={{
              padding: "10px 14px",
              cursor: "pointer",
              background: "rgba(251, 191, 36, 0.12)",
              border: "1px solid rgba(251, 191, 36, 0.3)",
              borderRadius: "12px",
              fontSize: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease"
            }}
            title="Fotoğraf veya Belge Yükle"
          >
            <span style={{ fontSize: 18, display: "inline-block" }}>📎</span>
            <input type="file" accept="image/*,.pdf" onChange={dosyaYukle} style={{ display: "none" }} />
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
