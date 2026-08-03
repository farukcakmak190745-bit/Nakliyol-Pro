import React, { useState, useEffect, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { supabase } from "../supabaseClient";
import { Yildizlar } from "./Yildizlar";
import { formatTarih } from "./UI";
import { kullaniciSeferOzeti, yorumDagilimi } from "../utils/istatistik";

const renkler = {
  kamyoncu: {
    a: "#f59e0b", b: "#b45309",
    grad: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 45%, #d97706 100%)",
    soft: "rgba(245,158,11,0.12)", text: "#d97706",
    rozet: "🚛 Kamyoncu"
  },
  issiz: {
    a: "#3b82f6", b: "#0f172a",
    grad: "linear-gradient(135deg, #60a5fa 0%, #2563eb 45%, #1e3a8a 100%)",
    soft: "rgba(59,130,246,0.12)", text: "#2563eb",
    rozet: "🏢 İşveren"
  }
};

export default function HalkaAcikProfil({ onGeri, onMesajGonder }) {
  const { seciliProfilId, oturum, seferler, ilanlar, degerlendirmeleriGetir } = useApp();

  const [kullanici, setKullanici] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [yorumlar, setYorumlar] = useState([]);

  useEffect(() => {
    if (!seciliProfilId) { setKullanici(null); setYorumlar([]); return; }
    let aktif = true;
    const yukle = async () => {
      setYukleniyor(true);
      setKullanici(null);
      setYorumlar([]);
      const { data } = await supabase.from('users').select('*').eq('id', seciliProfilId).maybeSingle();
      if (!aktif) return;
      // Profil fotoğrafı belgeler tablosunda (users.fotograf sütunu yok)
      const { data: fotoData } = await supabase
        .from('belgeler')
        .select('url')
        .eq('kullanici_id', seciliProfilId)
        .eq('dosya_adi', 'profil_fotografi')
        .order('olusturulma_tarihi', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (aktif && fotoData?.url) data.fotograf = fotoData.url;
      if (!aktif) return;
      setKullanici(data || null);
      const yorum = await degerlendirmeleriGetir(seciliProfilId);
      if (aktif) setYorumlar(yorum);
      setYukleniyor(false);
    };
    yukle();
    return () => { aktif = false; };
  }, [seciliProfilId, degerlendirmeleriGetir]);

  const rol = kullanici?.rol || kullanici?.role || "";
  const isKamyoncu = rol === "kamyoncu";
  const c = renkler[isKamyoncu ? "kamyoncu" : "issiz"];
  const kendiProfili = seciliProfilId && oturum && seciliProfilId === oturum.id;

  const { seferler: hedefSeferleri, tamamlanan, basariOrani } = kullaniciSeferOzeti(seferler, kullanici?.id, isKamyoncu);
  const basari = basariOrani;
  const hedefIlanlar = isKamyoncu ? [] : (ilanlar || []).filter(i => i.olusturan_id === kullanici?.id);

  const { dagilim, ortalama, oySayisi: yorumSayisi } = useMemo(
    () => yorumDagilimi(yorumlar, kullanici?.puan),
    [yorumlar, kullanici?.puan]
  );
  const oySayisi = yorumSayisi || Number(kullanici?.oy_sayisi) || 0;

  const statlar = [
    { val: hedefIlanlar.length, lbl: "İlan", icon: "📋" },
    { val: hedefSeferleri.length, lbl: "Sefer", icon: "🚚" },
    { val: tamamlanan, lbl: "Tamamlanan", icon: "✅" },
    { val: basari, lbl: "Başarı", icon: "🎯", suffix: "%" }
  ];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 90,
      background: "var(--bg)", overflowY: "auto", paddingBottom: 120
    }}>
      {/* ===== ÜST BAR ===== */}
      <div style={{
        position: "sticky", top: 0, zIndex: 20,
        display: "flex", alignItems: "center", gap: 12,
        padding: "12px 16px",
        background: "rgba(245,241,234,0.82)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        borderBottom: "1px solid rgba(0,0,0,0.05)"
      }}>
        <button onClick={onGeri} style={{
          width: 38, height: 38, borderRadius: 12, cursor: "pointer",
          background: "var(--bg1)", border: "1px solid var(--border)",
          color: "var(--text)", fontSize: 20, fontWeight: 700,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 2px 8px rgba(15,23,42,0.06)", transition: "transform 0.15s"
        }}>‹</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", letterSpacing: 0.5 }}>PROFİL</div>
          <div style={{ fontSize: 11, color: "var(--text3)" }}>Güvenilirlik & detaylar</div>
        </div>
      </div>

      {yukleniyor ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: 90, color: "var(--text3)" }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", border: `3px solid ${c.soft}`, borderTopColor: c.a, animation: "spin 0.9s linear infinite" }} />
          <div style={{ fontSize: 13 }}>Profil yükleniyor...</div>
        </div>
      ) : !kullanici ? (
        <div style={{ textAlign: "center", padding: 90, color: "var(--text3)", fontSize: 14 }}>👤 Profil bulunamadı</div>
      ) : (
        <div style={{ maxWidth: 440, margin: "0 auto", padding: 0 }}>

          {/* ===== KAPAK ===== */}
          <div style={{ position: "relative", height: 128, overflow: "hidden", background: c.grad }}>
            <div style={{ position: "absolute", top: -46, right: -30, width: 190, height: 190, borderRadius: "50%", background: "rgba(255,255,255,0.16)", filter: "blur(6px)" }} />
            <div style={{ position: "absolute", bottom: -70, left: -30, width: 220, height: 220, borderRadius: "50%", background: "rgba(255,255,255,0.10)", filter: "blur(8px)" }} />
            <div style={{ position: "absolute", top: 18, right: 18, fontSize: 72, opacity: 0.18, transform: "rotate(-12deg)" }}>{isKamyoncu ? "🚛" : "🏢"}</div>
            <div style={{ position: "absolute", bottom: 12, left: 18, color: "rgba(255,255,255,0.9)", fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase" }}>
              Nakliyol Pro
            </div>
          </div>

          {/* ===== AVATAR + BİLGİ ===== */}
          <div style={{ textAlign: "center", marginTop: -44, position: "relative" }}>
            <div style={{ width: 92, height: 92, margin: "0 auto", borderRadius: "50%", padding: 3, background: "var(--bg1)", boxShadow: "0 8px 28px rgba(15,23,42,0.18)" }}>
              <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: c.soft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, color: c.text, overflow: "hidden" }}>
                {kullanici.fotograf ? (
                  <img src={kullanici.fotograf} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  (kullanici.ad || "?").charAt(0).toUpperCase()
                )}
              </div>
            </div>
            <div style={{
              position: "absolute", right: "calc(50% - 58px)", bottom: 64, width: 24, height: 24,
              borderRadius: "50%", background: "#10b981", border: "3px solid var(--bg1)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12
            }}>✓</div>

            <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", marginTop: 10, letterSpacing: 0.3 }}>
              {kullanici.ad || "Kullanıcı"}
            </div>
            {kullanici.sehir && (
              <div style={{ fontSize: 13, color: "var(--text3)", marginTop: 2 }}>📍 {kullanici.sehir}</div>
            )}
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
              <span style={{ padding: "5px 14px", borderRadius: 20, fontSize: 11, fontWeight: 800, color: "#fff", background: c.grad, boxShadow: `0 4px 14px ${c.a}44` }}>
                {c.rozet}
              </span>
              <span style={{ padding: "5px 14px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: "rgba(16,185,129,0.13)", color: "#059669", border: "1px solid rgba(16,185,129,0.25)" }}>
                ✓ Doğrulanmış
              </span>
            </div>
            {kendiProfili && (
              <div style={{ display: "inline-block", marginTop: 10, padding: "7px 14px", fontSize: 12, background: "rgba(59,130,246,0.1)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.25)", borderRadius: 12, fontWeight: 600 }}>
                👤 Bu sizin profiliniz
              </div>
            )}
          </div>

          {/* ===== PUAN KARTI ===== */}
          <div style={{ margin: "16px 16px 0", padding: 18, background: "var(--bg1)", borderRadius: 18, border: "1px solid var(--border)", boxShadow: "0 4px 20px rgba(15,23,42,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.5, color: "var(--text3)", textTransform: "uppercase" }}>⭐ Değerlendirme</span>
              {oySayisi > 0 && <span style={{ fontSize: 11, color: "var(--text3)" }}>{oySayisi} değerlendirme</span>}
            </div>
            {oySayisi > 0 ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 84, height: 84, borderRadius: 18, background: c.soft, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 32, fontWeight: 900, color: c.text, lineHeight: 1 }}>{ortalama.toFixed(1)}</span>
                    <span style={{ fontSize: 10, color: c.text, opacity: 0.7, fontWeight: 600, letterSpacing: 0.5 }}>ORTALAMA</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <Yildizlar deger={ortalama} boyut={20} />
                    <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 5 }}>
                      {[5,4,3,2,1].map(p => (
                        <div key={p} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 10, color: "var(--text3)", width: 10 }}>{p}</span>
                          <span style={{ fontSize: 10 }}>★</span>
                          <div style={{ flex: 1, height: 5, background: "var(--bg3)", borderRadius: 3, overflow: "hidden" }}>
                            <div style={{ width: `${oySayisi ? (dagilim[p] / oySayisi) * 100 : 0}%`, height: "100%", background: c.grad, borderRadius: 3, transition: "width 0.5s ease" }} />
                          </div>
                          <span style={{ fontSize: 10, color: "var(--text3)", width: 16, textAlign: "right" }}>{dagilim[p]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "18px 0 8px", color: "var(--text3)", fontSize: 13 }}>
                Henüz değerlendirme yok — ilk güvenilirlik sinyali burada görünecek
              </div>
            )}
          </div>

          {/* ===== İSTATİSTİKLER ===== */}
          <div style={{ margin: "14px 16px 0", padding: 16, background: "var(--bg1)", borderRadius: 18, border: "1px solid var(--border)", boxShadow: "0 4px 20px rgba(15,23,42,0.06)" }}>
            <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.5, color: "var(--text3)", textTransform: "uppercase" }}>📊 İstatistikler</span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginTop: 12 }}>
              {statlar.map((s, i) => (
                <div key={i} style={{ textAlign: "center", padding: "12px 4px", background: "var(--bg2)", borderRadius: 14, border: "1px solid var(--border)", transition: "transform 0.15s" }}>
                  <div style={{ fontSize: 17, marginBottom: 3 }}>{s.icon}</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: c.text, lineHeight: 1.2 }}>{s.val}{s.suffix || ""}</div>
                  <div style={{ fontSize: 8, color: "var(--text3)", marginTop: 2, letterSpacing: 1, textTransform: "uppercase" }}>{s.lbl}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ===== ARAÇ (KAMYONCU) ===== */}
          {isKamyoncu && (kullanici.plaka || kullanici.dorse_plaka) && (
            <div style={{ margin: "14px 16px 0", padding: 16, background: "var(--bg1)", borderRadius: 18, border: "1px solid var(--border)", boxShadow: "0 4px 20px rgba(15,23,42,0.06)" }}>
              <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.5, color: "var(--text3)", textTransform: "uppercase" }}>🚛 Araç Bilgileri</span>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                {kullanici.plaka && (
                  <div style={{ display: "inline-block", background: "#fff", color: "#000", fontFamily: "monospace", fontSize: 13, padding: "7px 16px", borderRadius: 6, border: "2px solid #003099", letterSpacing: 2, fontWeight: 700, boxShadow: "0 2px 6px rgba(0,0,0,0.08)" }}>
                    {kullanici.plaka}
                  </div>
                )}
                {kullanici.dorse_plaka && (
                  <div style={{ display: "inline-block", background: "#fff", color: "#000", fontFamily: "monospace", fontSize: 13, padding: "7px 16px", borderRadius: 6, border: "2px solid #003099", letterSpacing: 2, fontWeight: 700, boxShadow: "0 2px 6px rgba(0,0,0,0.08)" }}>
                    {kullanici.dorse_plaka}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===== YORUMLAR ===== */}
          <div style={{ margin: "14px 16px 0", padding: 16, background: "var(--bg1)", borderRadius: 18, border: "1px solid var(--border)", boxShadow: "0 4px 20px rgba(15,23,42,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.5, color: "var(--text3)", textTransform: "uppercase" }}>💬 Yorumlar</span>
              <span style={{ fontSize: 11, color: "var(--text3)" }}>{yorumlar.length}</span>
            </div>
            {yorumlar.length === 0 ? (
              <div style={{ textAlign: "center", padding: "16px 0 8px", color: "var(--text3)", fontSize: 13 }}>
                Henüz yorum yok
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {yorumlar.map(y => (
                  <div key={y.id} style={{ background: "var(--bg2)", borderRadius: 14, padding: 13, border: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 26, height: 26, borderRadius: "50%", background: c.soft, color: c.text, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800 }}>
                          {(y.degerlendiren?.ad || "K")[0].toUpperCase()}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{y.degerlendiren?.ad || "Kullanıcı"}</span>
                      </div>
                      <span style={{ fontSize: 11, color: "var(--text3)" }}>{formatTarih(y.olusturma_zamani)}</span>
                    </div>
                    <Yildizlar deger={y.puan} boyut={13} />
                    {y.yorum && (
                      <div style={{ fontSize: 13, color: "var(--text2)", marginTop: 7, lineHeight: 1.55, whiteSpace: "pre-line" }}>{y.yorum}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ height: 20 }} />
        </div>
      )}

      {/* ===== MESAJ GÖNDER ===== */}
      {!kendiProfili && kullanici && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 20,
          padding: "12px 16px", paddingBottom: "calc(12px + env(safe-area-inset-bottom))",
          background: "rgba(245,241,234,0.9)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)",
          borderTop: "1px solid var(--border)"
        }}>
          <div style={{ maxWidth: 440, margin: "0 auto" }}>
            <button onClick={() => onMesajGonder && onMesajGonder(kullanici)} style={{
              width: "100%", padding: "15px", color: "#fff", border: "none", borderRadius: 14,
              fontSize: 15, fontWeight: 800, cursor: "pointer", background: c.grad,
              boxShadow: `0 8px 24px ${c.a}55`, letterSpacing: 0.5,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "transform 0.15s"
            }}>
              💬 Mesaj Gönder
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
