import { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { useMesaj } from "../../context/MesajContext";
import { EmptyState, formatTarih, vadeTarihiniBul, vadeGectiMi } from "../../components/UI";
import ChatSayfasi from "../../components/ChatSayfasi";
import TeslimEdildiModal from "../../components/TeslimEdildiModal";
import { BildirimlerSayfasi } from "../../pages/BildirimlerSayfasi";
import { MessageSquare } from "lucide-react";

export function SeferlerSayfasi({ onMesajGoster, onChatAc }) {
  const { seferler, konusmaOluştur, oturum, islemiTeslimEt, kamyoncuIptalEt, ihtilafAc, ihtilaflar } = useApp();
  const [seciliSefer, setSeciliSefer] = useState(null);
  const [konusmaIdMap, setKonusmaIdMap] = useState({});
  const [teslimEdildiModal, setTeslimEdildiModal] = useState(null);
  const [seciliKonusma, setSeciliKonusma] = useState(null);
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

  const konusmaAc = (sefer) => {
    if (!sefer || !sefer.olusturan || !sefer.yuk || !sefer.nereden || !sefer.nereye) {
      console.error('Sefer verisi eksik:', sefer);
      return;
    }
    const newConversationId = konusmaOluştur({
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
        <EmptyState icon="✈️" text="Henüz bir seferiniz yok" />
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
            return (
            <div key={sefer.id} className="card" style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ fontSize: 32 }}>🚚</div>
                  <div>
                    <div className="display" style={{ fontSize: 18, color: "#fbbf24" }}>{sefer.yuk || "-"}</div>
                    <div style={{ fontSize: 10, color: "var(--text3)", letterSpacing: 1.5 }}>Yük Tipi</div>
                  </div>
                </div>
                <div style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(16,185,129,0.1) 100%)", color: "#10b981", padding: "6px 12px", borderRadius: "20px", fontSize: 11, fontWeight: 600, border: "1px solid rgba(16,185,129,0.3)" }}>
                  {sefer.durum === "yolda" ? "✓ Yolda" : sefer.durum === "teslima_bekleniyor" ? "⏳ Teslim Bekleniyor" : "✓ Tamamlandı"}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{sefer.nereden || "-"}</span>
                <span style={{ color: "#fbbf24", fontSize: 18 }}>→</span>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{sefer.nereye || "-"}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
                <div style={{ background: "var(--bg2)", borderRadius: "12px", padding: "12px", textAlign: "center", border: "1px solid rgba(251,191,36,0.1)" }}>
                  <div style={{ fontSize: 10, color: "var(--text3)" }}>Plaka</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#1d4ed8" }}>{sefer.plaka || "-"}</div>
                </div>
                <div style={{ background: "var(--bg2)", borderRadius: "12px", padding: "12px", textAlign: "center", border: "1px solid rgba(251,191,36,0.1)" }}>
                  <div style={{ fontSize: 10, color: "var(--text3)" }}>Ücret</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#fbbf24" }}>₺{sefer.ucret ? sefer.ucret.toLocaleString() : "0"}</div>
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
                          ↩ İptal Et ({formatKalanSure(kalanMs)})
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
                    <div style={{ marginBottom: 10, padding: "10px 12px", borderRadius: "10px", fontSize: 12, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", color: "#f59e0b", lineHeight: 1.5 }}>
                      ⏳ İş teslim edildi — ödeme bekleniyor.
                      {vade && <div style={{ marginTop: 4, color: vadeGecti ? "#ef4444" : "inherit" }}>{vadeGecti ? `⚠️ Ödeme vadesi geçti (${formatTarih(vade)})` : `📅 Vade: ${formatTarih(vade)}`}</div>}
                      {!vade && <div style={{ marginTop: 4 }}>💵 Peşin ödeme</div>}
                    </div>
                    {acikIhtilaf ? (
                      <div style={{ padding: "10px 12px", borderRadius: "10px", fontSize: 12, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444" }}>
                        ⚠️ İhtilafınız açık — destek ekibi incelemekte.
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
            <div key={sefer.id} className="card" style={{ marginBottom: 14, border: "1px solid rgba(16,185,129,0.2)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15, color: "#fbbf24" }}>{sefer.yuk || "-"}</div>
                  <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>{sefer.nereden || "-"} → {sefer.nereye || "-"}</div>
                  <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>🏢 {sefer.olusturan || "-"}</div>
                  <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 1 }}>🚛 {sefer.kamyoncu || "-"} • 📌 {sefer.plaka || "-"}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: "#fbbf24", fontWeight: 700, fontSize: 16 }}>₺{sefer.ucret ? sefer.ucret.toLocaleString() : "0"}</div>
                  <div style={{ background: sefer.durum === "odendi" ? "linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(16,185,129,0.1) 100%)" : "linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(245,158,11,0.1) 100%)", color: sefer.durum === "odendi" ? "#10b981" : "#f59e0b", padding: "4px 10px", borderRadius: "20px", fontSize: 10, fontWeight: 600, marginTop: 4 }}>{sefer.durum === "odendi" ? "💰 Ödendi" : "✓ Tamamlandı"}</div>
                </div>
              </div>
              {sefer.belgeler && sefer.belgeler.length > 0 && (
                <div style={{ marginTop: 12, display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {sefer.belgeler.map((b, i) => {
                    if (!b) return null;
                    return (
                    <div key={b.id || `doc-${i}`} style={{ background: "var(--bg2)", borderRadius: "8px", padding: "6px 10px", fontSize: 11, display: "flex", alignItems: "center", gap: 6, border: "1px solid rgba(251,191,36,0.1)" }}>
                      {b.tip === "img" ? "🖼️" : "📄"} {b.ad || "-"}
                    </div>
                    );
                  })}
                </div>
              )}
              {sefer.odeme_durumu === "odendi" && sefer.odeme_tarihi && (
                <div style={{ marginTop: 8, fontSize: 11, color: "#10b981", display: "flex", alignItems: "center", gap: 6 }}>
                  💰 Ödeme tamamlandı - {formatTarih(sefer.odeme_tarihi)}
                </div>
              )}
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
  const { oturum, seferler } = useApp();
  const { konusmalar, loadConversations } = useMesaj();
  const [secili, setSecili] = useState(null);
  const [kategori, setKategori] = useState("aktif"); // aktif | tamamlanan | tumu

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
    if (kategori === "tamamlanan") return s?.durum === "odendi";
    return true;
  });

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
      <div className="section-title">MESAJLAR</div>
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
                k === "tamamlanan" ? konusmalar?.filter(k => { const s = seferler?.find(sf => sf.ilan_id === k.ilan_id || sf.ilanId === k.ilan_id); return s?.durum === "odendi"; }).length :
                konusmalar?.length})
            </span>
          </button>
        ))}
      </div>
      {(!filtrelenmisKonusmalar || filtrelenmisKonusmalar.length === 0) ? (
        <EmptyState icon="💬" text={kategori === "aktif" ? "Aktif konuşma yok" : kategori === "tamamlanan" ? "Tamamlanan konuşma yok" : "Henüz mesaj yok"} />
      ) : (
        filtrelenmisKonusmalar.map(k => {
          const s = seferler?.find(sf => sf.ilan_id === k.ilan_id || sf.ilanId === k.ilan_id);
          return (<div key={k.id} className="card" style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }} onClick={() => setSecili(k.id)}>
            <div style={{ width: 46, height: 46, borderRadius: "50%", background: "linear-gradient(135deg, var(--guldum-gradient), var(--purple-gradient))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "#fff", flexShrink: 0, position: "relative" }}>
              {k.partnerRol === "kamyoncu" ? "🚛" : "🏢"}
              {s && (
                <div style={{
                  position: "absolute", bottom: -2, right: -2, width: 14, height: 14, borderRadius: "50%",
                  background: s.durum === "odendi" ? "#10b981" : s.durum === "yolda" ? "#1d4ed8" : s.durum === "teslima_bekleniyor" ? "#f59e0b" : "#6b7280",
                  border: "2px solid var(--bg1)"
                }} />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: "#fbbf24" }}>{k.partnerAd}</div>
              <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {k?.mesajlar?.length > 0 ? (k.mesajlar[k.mesajlar.length - 1]?.metin || "📄 Dosya gönderildi") : (k.baslik || "")}
              </div>
            </div>
            {k.okunmamis > 0 && (
              <div style={{
                background: "#1d4ed8",
                color: "#fff",
                borderRadius: "50%",
                width: 22,
                height: 22,
                fontSize: 11,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                boxShadow: "0 4px 12px rgba(29,78,216,0.4)"
              }}>
                {k.okunmamis}
              </div>
            )}
          </div>
        )}
      ))}
    </div>
  );
}
