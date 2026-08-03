import { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { useMesaj } from "../../context/MesajContext";
import { EmptyState, formatTarih, vadeTarihiniBul, vadeGectiMi } from "../../components/UI";
import { MesajListeKart } from "../../components/MesajListesi";
import ChatSayfasi from "../../components/ChatSayfasi";
import TeslimEdildiModal from "../../components/TeslimEdildiModal";
import DegerlendirmeModal from "../../components/DegerlendirmeModal";
import { BildirimlerSayfasi } from "../../pages/BildirimlerSayfasi";
import { MessageSquare } from "lucide-react";

export function SeferlerSayfasi({ onMesajGoster, onChatAc }) {
  const { seferler, konusmaOluştur, oturum, islemiTeslimEt, kamyoncuIptalEt, ihtilafAc, ihtilaflar, profiliGoster, benimDegerlendirdiklerim } = useApp();
  const [seciliSefer, setSeciliSefer] = useState(null);
  const [konusmaIdMap, setKonusmaIdMap] = useState({});
  const [teslimEdildiModal, setTeslimEdildiModal] = useState(null);
  const [seciliKonusma, setSeciliKonusma] = useState(null);
  const [degerlendirilecek, setDegerlendirilecek] = useState(null);
  const [simdi, setSimdi] = useState(Date.now());

  // Kamyoncu onay iptal süresi: 10 dakika (işverenle aynı)
  const IPTAL_SURE_MS = 10 * 60 * 1000;

  // Geri sayım: iptal süresinin dolduğunu canlı göstermek için
  useEffect(() => {
    const timer = setInterval(() => setSimdi(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatKalanSure = (ms) => {
    if (ms <= 0) return "0:00";
    const dk = Math.floor(ms / 60000);
    const sn = Math.floor((ms % 60000) / 1000);
    return `${dk}:${String(sn).padStart(2, "0")}`;
  };

  // Kamyoncu seferini iptal et (10 dk içinde) - sebep isteyerek
  const kamyoncuIptal = async (sefer) => {
    if (!sefer?.id) return;
    const sebep = prompt(
      `İptal sebebinizi belirtin:\n\n"${sefer.yuk}" - ${sefer.nereden} → ${sefer.nereye}\n\nİşvereninize gönderilecek.` +
      "\n\nNot: 24 saat içinde 3+ iptal yaparsanız 24 saat ilanlara başvuru yapamazsınız."
    );
    if (sebep === null) return; // kullanıcı iptal etti
    if (!sebep.trim()) {
      alert("İptal için bir sebep belirtmeniz gerekiyor.");
      return;
    }
    const sonuc = await kamyoncuIptalEt(sefer.id, sebep.trim());
    if (sonuc?.ok) {
      if (sonuc.cooldown) {
        alert("⚠️ İşiniz iptal edildi.\n\n24 saat içinde 3. iptalinizi yaptınız. Artık 24 saat boyunca ilanlara başvuru yapamayacaksınız.");
      } else {
        alert(`✅ İş iptal edildi. Başvuru tekrar işverenin listesine döndü.`);
      }
    }
  };

  // Teslim edildi ama ödeme alınmadıysa ihtilaf (itiraz) aç
  const ihtilafAcma = async (sefer) => {
    if (!sefer?.id) return;
    const sebep = prompt(
      `Ödeme ihtilafı (itiraz) açıyorsunuz:\n\n"${sefer.yuk}" - ${sefer.nereden} → ${sefer.nereye}\n\nÖdemenin alınamaması ile ilgili sebebi yazın.\n\nDestek ekibi inceleyecek.`
    );
    if (sebep === null) return;
    if (!sebep.trim()) {
      alert("İhtilaf için bir sebep belirtmeniz gerekiyor.");
      return;
    }
    await ihtilafAc(sefer.id, sebep.trim());
    alert("⚠️ İhtilafınız açıldı. İşveren ve destek ekibine bildirildi.");
  };

  // Kamyoncu sadece KENDİ (giriş yaptığı hesabın) seferlerini görmeli.
  // Filtre: kamyoncu_user_id === oturum.id (giriş yapan kullanıcının id'si)
  // Eski kayıtlar için fallback: tc_kimlik veya telefon eşleşmesi
  // (Bunlar şoförün değil hesap sahibinin bilgileri olduğu eski versiyon kayıtlar için)
  const seferlerList = (seferler || []).filter(s => {
    if (!oturum || !s) return false;
    // Yeni kayıtlar: user_id eşleşmesi
    if (s.kamyoncu_user_id === oturum.id) return true;
    // Eski kayıtlar için fallback (şoför bilgileri === hesap sahibi bilgileri durumunda)
    if (s.kamyoncu_tc && s.kamyoncu_tc === oturum.tc_kimlik) return true;
    if (s.kamyoncu_tel && s.kamyoncu_tel === oturum.telefon) return true;
    return false;
  });
  const aktifSeferler = (seferlerList || []).filter(s => s && (s.durum === "yolda" || s.durum === "teslima_bekleniyor"));
  const bitmisSeferler = (seferlerList || []).filter(s => s && (s.durum === "tamamlandı" || s.durum === "odendi"));

  const konusmaAc = async (sefer) => {
    if (!sefer || !sefer.olusturan || !sefer.yuk || !sefer.nereden || !sefer.nereye) {
      console.error('Sefer verisi eksik:', sefer);
      return;
    }
    const newConversationId = await konusmaOluştur({
      userId: oturum?.id,
      partnerId: sefer.olusturan_id || sefer.olusturan,
      partnerAd: sefer.olusturan,
      partnerRol: "issiz",
      isTrucker: true,
      konusmaTuru: "is",
      ilanId: sefer.ilan_id,
      baslik: `${sefer.yuk} - ${sefer.nereden} → ${sefer.nereye}`,
      resim: "https://api.dicebear.com/7.x/initials/svg?seed=" + sefer.olusturan.substring(0, 2).toUpperCase()
    });
    if (!newConversationId) {
      console.error('Konuşma açılamadı:', sefer);
      alert('Konuşma açılamadı. Lütfen tekrar deneyin.');
      return;
    }
    setKonusmaIdMap(prev => ({ ...prev, [sefer.id]: newConversationId }));

    // ChatSayfasi bileşenini aç
    if (onChatAc) {
      onChatAc(newConversationId, {
        partnerAd: sefer.olusturan,
        yuk: sefer.yuk,
        nereden: sefer.nereden,
        nereye: sefer.nereye
      });
    } else {
      // Fallback: sekme olarak mesajlar'a geç
      if (onMesajGoster) {
        onMesajGoster();
      }
      setSeciliKonusma(newConversationId);
    }
  };

  if (aktifSeferler.length === 0 && bitmisSeferler.length === 0) {
    return (
      <div className="scroll-content">
        <div className="section-title">SEFERLERİM</div>
        <EmptyState
          icon="✈️"
          title="Henüz bir seferiniz yok"
          alt="İlanlardan yük alın, teslim edin. Tüm aktif ve geçmiş seferleriniz burada listelenecek."
        />
      </div>
    );
  }

  // Cooldown durumu (fazla iptal sonrası başvuru yasağı)
  const cooldownBitisMs = oturum?.iptal_cooldown_bitis ? new Date(oturum.iptal_cooldown_bitis).getTime() : 0;
  const cooldownAktif = cooldownBitisMs > simdi;

  return (
    <div className="scroll-content">
      {cooldownAktif && (
        <div style={{
          background: "linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(239,68,68,0.08) 100%)",
          border: "1px solid rgba(239,68,68,0.35)",
          borderRadius: "12px", padding: "14px 16px", marginBottom: 14,
          display: "flex", alignItems: "center", gap: 10
        }}>
          <span style={{ fontSize: 22 }}>🚫</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#ef4444" }}>
              Fazla iptal yaptığınız için ilanlara başvuru yapamıyorsunuz
            </div>
            <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>
              Kalan süre: {formatKalanSure(cooldownBitisMs - simdi)} · {new Date(cooldownBitisMs).toLocaleDateString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
        </div>
      )}
      {aktifSeferler && Array.isArray(aktifSeferler) && aktifSeferler.length > 0 && (
        <>
          <div className="section-title">AKTİF SEFERLER ({aktifSeferler.length})</div>
          {aktifSeferler.map((sefer) => {
            if (!sefer || !sefer.id || !sefer.durum) {
              console.error('Hata: undefined aktif sefer, skipping:', sefer);
              return null;
            }
            const durumPill = sefer.durum === "yolda"
              ? { metin: "🚚 Yolda", renk: "#10b981", bg: "rgba(16,185,129,0.12)" }
              : { metin: "⏳ Teslim Bekleniyor", renk: "#f59e0b", bg: "rgba(245,158,11,0.12)" };
            return (
            <div key={sefer.id} style={{
              marginBottom: 14, borderRadius: 20, overflow: "hidden",
              background: "var(--bg1)", border: "1px solid var(--border)",
              boxShadow: "0 6px 24px rgba(15,23,42,0.07)"
            }}>
              <div style={{
                height: 4,
                background: sefer.durum === "yolda"
                  ? "linear-gradient(90deg, #10b981, #34d399, #10b981)"
                  : "linear-gradient(90deg, #f59e0b, #fbbf24, #f59e0b)"
              }} />
              <div style={{ padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 46, height: 46, borderRadius: 15,
                      background: durumPill.bg, color: durumPill.renk,
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24
                    }}>
                      🚚
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", lineHeight: 1.2 }}>{sefer.yuk || "-"}</div>
                      <div style={{ fontSize: 10, color: "var(--text3)", letterSpacing: 1.2, marginTop: 2, textTransform: "uppercase" }}>Yük</div>
                    </div>
                  </div>
                  <span style={{ padding: "6px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: durumPill.bg, color: durumPill.renk, border: `1px solid ${durumPill.renk}33`, whiteSpace: "nowrap" }}>
                    {durumPill.metin}
                  </span>
                </div>

                {/* ROTA */}
                <div style={{
                  background: "var(--bg2)", borderRadius: 16,
                  border: "1px solid var(--border)",
                  padding: "16px 14px", marginBottom: 12, position: "relative", overflow: "hidden"
                }}>
                  <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: `${durumPill.renk}0d`, filter: "blur(20px)" }} />
                  <div style={{ display: "flex", alignItems: "center", position: "relative" }}>
                    <div style={{ flex: 1, textAlign: "center" }}>
                      <div style={{ display: "inline-block", padding: "7px 12px", background: "var(--bg1)", borderRadius: 10, border: "1px solid var(--border2)", fontWeight: 800, fontSize: 13, color: "var(--text)" }}>
                        {sefer.nereden || "-"}
                      </div>
                      <div style={{ fontSize: 9, color: "var(--text3)", marginTop: 5, letterSpacing: 1, textTransform: "uppercase" }}>Çıkış</div>
                    </div>
                    <div style={{ width: 72, position: "relative", height: 2, background: "repeating-linear-gradient(90deg, #f59e0b 0 5px, transparent 5px 9px)", margin: "0 6px", flexShrink: 0 }}>
                      <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", fontSize: 18, animation: "pulse 1.5s infinite" }}>🚛</div>
                    </div>
                    <div style={{ flex: 1, textAlign: "center" }}>
                      <div style={{ display: "inline-block", padding: "7px 12px", background: "var(--bg1)", borderRadius: 10, border: "1px solid var(--border2)", fontWeight: 800, fontSize: 13, color: "var(--text)" }}>
                        {sefer.nereye || "-"}
                      </div>
                      <div style={{ fontSize: 9, color: "var(--text3)", marginTop: 5, letterSpacing: 1, textTransform: "uppercase" }}>Varış</div>
                    </div>
                  </div>
                </div>

                {/* ÖZET GRID */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                  <div style={{ background: "var(--bg2)", borderRadius: 12, padding: "10px 12px", border: "1px solid var(--border)" }}>
                    <div style={{ fontSize: 9, color: "var(--text3)", letterSpacing: 1, textTransform: "uppercase" }}>🚛 Plaka</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#1d4ed8", marginTop: 3, fontFamily: "monospace", letterSpacing: 1 }}>{sefer.plaka || "-"}</div>
                  </div>
                  <div style={{ background: "var(--bg2)", borderRadius: 12, padding: "10px 12px", border: "1px solid var(--border)" }}>
                    <div style={{ fontSize: 9, color: "var(--text3)", letterSpacing: 1, textTransform: "uppercase" }}>💰 Ücret</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#f59e0b", marginTop: 3 }}>
                      ₺{sefer.ucret ? Number(sefer.ucret).toLocaleString() : "0"}
                    </div>
                  </div>
                </div>

                {/* İŞVEREN */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, padding: "10px 12px", background: "var(--bg2)", borderRadius: 12, border: "1px solid var(--border)", cursor: sefer.olusturan_id ? "pointer" : "default" }}
                  onClick={(e) => { e.stopPropagation(); if (sefer.olusturan_id) profiliGoster(sefer.olusturan_id); }}>
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg, #2563eb, #0f172a)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, flexShrink: 0 }}>
                    {(sefer.olusturan || "İ")[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: "var(--text3)" }}>İşveren</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{sefer.olusturan || "İşveren"}</div>
                  </div>
                  {sefer.olusturan_id && <span style={{ fontSize: 11, fontWeight: 700, color: "#2563eb" }}>Profili Gör ›</span>}
                </div>

                {sefer.durum === "yolda" && (
                  <>
                    <button
                      onClick={() => setTeslimEdildiModal(sefer)}
                      className="btn btn-success"
                      style={{ width: "100%", fontSize: 13, padding: "13px", marginBottom: "10px" }}
                    >
                      🎉 İşi Teslim Et
                    </button>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => konusmaAc(sefer)}
                        className="btn btn-primary"
                        style={{ flex: 1, padding: "12px", fontSize: 13 }}
                      >
                        💬 Konuş
                      </button>
                      {(() => {
                        const onayZamaniMs = sefer.onay_zamani ? new Date(sefer.onay_zamani).getTime() : null;
                        const kalanMs = onayZamaniMs ? IPTAL_SURE_MS - (simdi - onayZamaniMs) : 0;
                        if (!onayZamaniMs || kalanMs <= 0) return null;
                        return (
                          <button
                            onClick={() => kamyoncuIptal(sefer)}
                            style={{
                              flex: 1, padding: "12px",
                              background: "linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(239,68,68,0.08) 100%)",
                              color: "#ef4444", border: "1px solid rgba(239,68,68,0.35)",
                              borderRadius: "12px", fontSize: 13, fontWeight: 700, cursor: "pointer"
                            }}
                          >
                            ↩ İptal ({formatKalanSure(kalanMs)})
                          </button>
                        );
                      })()}
                    </div>
                  </>
                )}

                {sefer.durum === "teslima_bekleniyor" && (() => {
                  const vade = vadeTarihiniBul(sefer);
                  const acikIhtilaf = (ihtilaflar || []).find(i => i.sefer_id === sefer.id && i.durum === "acik");
                  const vadeGecti = vade ? vadeGectiMi(vade) : false;
                  return (
                    <>
                      <div style={{ marginBottom: 10, padding: "12px 14px", borderRadius: 12, fontSize: 12, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", color: "#f59e0b", lineHeight: 1.5, display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 22 }}>⏳</span>
                        <div style={{ flex: 1 }}>
                          İş teslim edildi — ödeme bekleniyor.
                          {vade && <div style={{ marginTop: 4, color: vadeGecti ? "#ef4444" : "inherit", fontWeight: 600 }}>{vadeGecti ? `⚠️ Ödeme vadesi geçti (${formatTarih(vade)})` : `📅 Vade: ${formatTarih(vade)}`}</div>}
                          {!vade && <div style={{ marginTop: 4 }}>💵 Peşin ödeme</div>}
                        </div>
                      </div>
                      {acikIhtilaf ? (
                        <div style={{ padding: "12px 14px", borderRadius: 12, fontSize: 12, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 22 }}>⚠️</span>
                          <div style={{ flex: 1 }}>İhtilafınız açık — destek ekibi incelemekte.</div>
                        </div>
                      ) : (
                        <button
                          onClick={() => ihtilafAcma(sefer)}
                          style={{ width: "100%", padding: "12px", background: "linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(239,68,68,0.08) 100%)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.35)", borderRadius: "12px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                        >
                          ⚠️ Ödeme Alınmadı — İhtilaf Aç
                        </button>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
            );
          })}
        </>
      )}

      {bitmisSeferler && Array.isArray(bitmisSeferler) && bitmisSeferler.length > 0 && (
        <>
          {aktifSeferler && Array.isArray(aktifSeferler) && aktifSeferler.length > 0 && <div style={{ height: 20 }}></div>}
          <div className="section-title">GEÇMİŞ SEFERLER ({bitmisSeferler.length})</div>
          {bitmisSeferler.map((sefer) => {
            if (!sefer || !sefer.id || !sefer.durum) {
              console.error('Hata: undefined bitmis sefer, skipping:', sefer);
              return null;
            }
            return (
            <div key={sefer.id} style={{
              marginBottom: 12, borderRadius: 18, overflow: "hidden",
              background: "var(--bg1)", border: "1px solid rgba(16,185,129,0.18)",
              boxShadow: "0 4px 18px rgba(15,23,42,0.05)"
            }}>
              <div style={{ padding: 15 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 12, background: "linear-gradient(135deg, rgba(251,191,36,0.15), rgba(251,191,36,0.05))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19, flexShrink: 0 }}>
                      📦
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 15, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sefer.yuk || "-"}</div>
                      <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 1 }}>{sefer.nereden || "-"} → {sefer.nereye || "-"}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ color: "#f59e0b", fontWeight: 900, fontSize: 15 }}>₺{sefer.ucret ? Number(sefer.ucret).toLocaleString() : "0"}</div>
                    <div style={{
                      display: "inline-block", padding: "4px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700, marginTop: 3,
                      background: sefer.durum === "odendi" ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.12)",
                      color: sefer.durum === "odendi" ? "#10b981" : "#f59e0b",
                      border: `1px solid ${sefer.durum === "odendi" ? "rgba(16,185,129,0.3)" : "rgba(245,158,11,0.3)"}`
                    }}>{sefer.durum === "odendi" ? "💰 Ödendi" : "✓ Tamamlandı"}</div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {sefer.olusturan_id && (
                    <span style={{ fontSize: 11, color: "var(--text2)", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5 }} onClick={(e) => { e.stopPropagation(); if (sefer.olusturan_id) profiliGoster(sefer.olusturan_id); }}>
                      🏢 <b>{sefer.olusturan || "İşveren"}</b>
                      <span style={{ color: "#2563eb", fontWeight: 700 }}>Profili Gör</span>
                    </span>
                  )}
                  {sefer.plaka && (
                    <span style={{ fontSize: 11, color: "var(--text3)", display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 9px", background: "var(--bg2)", borderRadius: 8, border: "1px solid var(--border)" }}>
                      🚛 {sefer.plaka}
                    </span>
                  )}
                </div>

                {sefer.belgeler && sefer.belgeler.length > 0 && (
                  <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {sefer.belgeler.map((b, i) => {
                      if (!b) return null;
                      return (
                        <div key={b.id || `doc-${i}`} style={{ background: "var(--bg2)", borderRadius: 8, padding: "5px 9px", fontSize: 11, display: "flex", alignItems: "center", gap: 5, border: "1px solid rgba(251,191,36,0.15)", color: "var(--text2)" }}>
                          {b.tip === "img" ? "🖼️" : "📄"} {b.ad || "-"}
                        </div>
                      );
                    })}
                  </div>
                )}
                {sefer.odeme_durumu === "odendi" && sefer.odeme_tarihi && (
                  <div style={{ marginTop: 8, fontSize: 11, color: "#10b981", display: "flex", alignItems: "center", gap: 6 }}>
                    💰 Ödeme tamamlandı · {formatTarih(sefer.odeme_tarihi)}
                  </div>
                )}
                {(sefer.durum === "odendi" || sefer.durum === "tamamlandı") && sefer.olusturan_id && !benimDegerlendirdiklerim.has(sefer.id) && (
                  <button
                    onClick={() => setDegerlendirilecek(sefer)}
                    style={{ width: "100%", marginTop: 10, padding: "11px", background: "linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(245,158,11,0.08) 100%)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "12px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                  >
                    ⭐ Seferi Değerlendir
                  </button>
                )}
              </div>
            </div>
            );
          })}
        </>
      )}

      {teslimEdildiModal && (
        <TeslimEdildiModal
          sefer={teslimEdildiModal}
          onClose={() => setTeslimEdildiModal(null)}
        />
      )}

      {degerlendirilecek && (
        <DegerlendirmeModal
          hedefId={degerlendirilecek.olusturan_id}
          hedefAd={degerlendirilecek.olusturan || "İşveren"}
          seferId={degerlendirilecek.id}
          seferOzet={`${degerlendirilecek.yuk || ""} · ${degerlendirilecek.nereden || ""} → ${degerlendirilecek.nereye || ""}`}
          onKapat={() => setDegerlendirilecek(null)}
        />
      )}

      {/* ChatSayfasi bileşenini göster */}
      {seciliKonusma && (
        <ChatSayfasi
          konusmaId={seciliKonusma}
          onGeri={() => setSeciliKonusma(null)}
          isKamyoncu={oturum?.rol === "kamyoncu"}
        />
      )}
    </div>
  );
}

export function MesajlarSayfasi({ onGeri }) {
  const { oturum, seferler } = useApp();
  const { konusmalar, loadConversations } = useMesaj();
  const [secili, setSecili] = useState(null);
  const [kategori, setKategori] = useState("aktif"); // aktif | tamamlanan | tumu
  const [arama, setArama] = useState("");

  // Oturum değişince veya sayfa açılınca konuşmaları yeniden yükle
  // (MesajContext'in auth listener'ın kaçırdığı durumlar için fallback)
  useEffect(() => {
    if (oturum?.id) {
      console.log('📨 MesajlarSayfasi: manual load for', oturum.id);
      loadConversations?.(oturum.id);
    }
  }, [oturum?.id, loadConversations]);

  // Kategori filtreleme
  const filtrelenmisKonusmalar = konusmalar?.filter(k => {
    if (kategori === "tumu") return true;
    const s = seferler?.find(sf => sf.ilan_id === k.ilan_id || sf.ilanId === k.ilan_id);
    if (kategori === "aktif") return !s || ["bekliyor", "yolda", "teslima_bekleniyor"].includes(s.durum);
    if (kategori === "tamamlanan") return s?.durum === "odendi" || s?.durum === "tamamlandı" || s?.durum === "tamamlandi";
    return true;
  });

  const aramaTermi = (arama || "").trim().toLocaleLowerCase("tr-TR");
  const gorunenKonusmalar = (filtrelenmisKonusmalar || []).filter(k => {
    if (!aramaTermi) return true;
    return (k.partnerAd || "").toLocaleLowerCase("tr-TR").includes(aramaTermi);
  });

  const toplamOkunmamis = (konusmalar || []).reduce((top, k) => top + (k.okunmamis || 0), 0);

  const seferDurumIcin = (k) => seferler?.find(sf => sf.ilan_id === k.ilan_id || sf.ilanId === k.ilan_id);

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
      <div className="section-title">
        MESAJLAR
        {toplamOkunmamis > 0 && (
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
            {toplamOkunmamis} yeni
          </span>
        )}
      </div>

      {/* Arama */}
      <div style={{ padding: "0 16px 12px" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "var(--bg2)",
          border: "1px solid rgba(251,191,36,0.15)",
          borderRadius: 12,
          padding: "0 12px"
        }}>
          <span style={{ fontSize: 15, opacity: 0.6 }}>🔍</span>
          <input
            value={arama}
            onChange={e => setArama(e.target.value)}
            placeholder="Kişi ara..."
            style={{ flex: 1, background: "none", border: "none", outline: "none", padding: "10px 0", fontSize: 14, color: "var(--text)" }}
          />
          {arama && (
            <button onClick={() => setArama("")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--text3)" }}>✕</button>
          )}
        </div>
      </div>

      {/* Kategori filtreleri */}
      <div style={{ display: "flex", gap: 8, padding: "0 16px 12px" }}>
        {["aktif", "tamamlanan", "tumu"].map(k => (
          <button key={k} onClick={() => setKategori(k)} style={{
            padding: "6px 16px", borderRadius: "20px", border: "1px solid rgba(251,191,36,0.3)",
            background: kategori === k ? "linear-gradient(135deg, #fbbf24, #f59e0b)" : "transparent",
            color: kategori === k ? "#000" : "var(--text2)", fontWeight: 600, fontSize: 12, cursor: "pointer"
          }}>
            {k === "aktif" ? "Aktif" : k === "tamamlanan" ? "Tamamlanan" : "Tümü"}
            <span style={{ marginLeft: 4, opacity: 0.7 }}>
              ({k === "aktif" ? konusmalar?.filter(k => { const s = seferler?.find(sf => sf.ilan_id === k.ilan_id || sf.ilanId === k.ilan_id); return !s || ["bekliyor", "yolda", "teslima_bekleniyor"].includes(s.durum); }).length :
                k === "tamamlanan" ? konusmalar?.filter(k => { const s = seferler?.find(sf => sf.ilan_id === k.ilan_id || sf.ilanId === k.ilan_id); return s?.durum === "odendi" || s?.durum === "tamamlandı" || s?.durum === "tamamlandi"; }).length :
                konusmalar?.length})
            </span>
          </button>
        ))}
      </div>
      {(!gorunenKonusmalar || gorunenKonusmalar.length === 0) ? (
        <EmptyState
          icon={aramaTermi ? "🔍" : "💬"}
          title={aramaTermi ? "Arama sonucu bulunamadı" : (kategori === "aktif" ? "Aktif konuşma yok" : kategori === "tamamlanan" ? "Tamamlanan konuşma yok" : "Henüz mesaj yok")}
          alt={aramaTermi ? "Farklı bir isimle tekrar deneyin." : "İş görüşmeleriniz burada görünecek."}
        />
      ) : (
        gorunenKonusmalar.map(k => (
          <MesajListeKart key={k.id} konusma={k} sefer={seferDurumIcin(k)} onClick={() => setSecili(k.id)} />
        ))
      )}
    </div>
  );
}
