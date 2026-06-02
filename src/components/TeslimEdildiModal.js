import { useState } from "react";
import { useApp } from "../context/AppContext";
import { useMesaj } from "../context/MesajContext";

export default function TeslimEdildiModal({ sefer, onClose }) {
  const { oturum, islemiTeslimEt } = useApp();
  const mesajContext = useMesaj();
  const [aciklama, setAciklama] = useState("");
  const [gonderiyor, setGonderiyor] = useState(false);

  const ceviciIban = oturum?.iban;
  const ceviciIbanSahibi = oturum?.ibanSahibi || "";
  const aliciIban = sefer?.iban;
  const aliciIbanSahibi = sefer?.ibanSahibi || "";

  const mesajGonder = async () => {
    if (!aciklama.trim()) {
      alert("Lütfen teslimat açıklaması giriniz!");
      return;
    }
    if (gonderiyor) return;
    setGonderiyor(true);

    try {
      // 1) Sefer durumunu güncelle (teslima_bekleniyor)
      await islemiTeslimEt(sefer.id);

      // 2) Konuşmayı bul (ilan_id üzerinden)
      const ilanId = sefer.ilan_id || sefer.ilanId;
      let konusma = mesajContext.konusmalar?.find(k => k.ilan_id === ilanId);

      // Konuşma yoksa, oluşturma
      if (!konusma && ilanId && sefer.olusturan_id && sefer.kamyoncu_user_id) {
        const yeniId = await mesajContext.konusmaAc({
          userId: sefer.olusturan_id,
          partnerId: sefer.kamyoncu_user_id,
          partnerAd: oturum?.ad || "Kamyoncu",
          isTrucker: true,
          baslik: `${sefer.yuk} - ${sefer.nereden} → ${sefer.nereye}`,
          konusmaTuru: "is",
          ilanId: ilanId,
          resim: "https://api.dicebear.com/7.x/initials/svg?seed=" + (oturum?.ad || "K").substring(0, 2).toUpperCase(),
          bg: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        });
        if (yeniId) {
          konusma = mesajContext.konusmalar?.find(k => k.id === yeniId);
        }
      }

      // 3) Mesaj içeriği
      const mesajMetni = `✅ İŞ TESLİM EDİLDİ\n\n` +
        `📝 Açıklama: ${aciklama}\n\n` +
        `💳 Ödeme Yapılacak IBAN:\n` +
        `   ${aliciIbanSahibi ? `👤 ${aliciIbanSahibi}\n` : ''}` +
        `   🏦 ${aliciIban || 'IBAN belirtilmemiş'}\n\n` +
        `📤 Gönderen IBAN (benim):\n` +
        `   ${ceviciIbanSahibi ? `👤 ${ceviciIbanSahibi}\n` : ''}` +
        `   🏦 ${ceviciIban || 'IBAN belirtilmemiş'}`;

      // 4) Mesajı gönder
      if (konusma?.id) {
        await mesajContext.mesajGonder(konusma.id, mesajMetni);
        console.log('✅ Teslimat mesajı konuşmaya gönderildi');
      } else {
        console.warn('⚠️ Konuşma bulunamadı, mesaj sadece sefer durumuna yazıldı');
      }

      alert(`✅ İş teslim edildi! IBAN bilgileri işverene iletildi.`);
      onClose();
    } catch (err) {
      console.error('❌ Teslim etme hatası:', err);
      alert(`Hata oluştu: ${err.message || err}`);
    } finally {
      setGonderiyor(false);
    }
  };

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{ position: "fixed", top: 20, right: 20, background: "var(--bg1)", border: "1px solid var(--border2)", borderRadius: "12px", padding: "12px 16px", fontSize: 18, cursor: "pointer", zIndex: 101 }}>✕</button>
        <div style={{ maxWidth: 440, margin: "0 auto", padding: 24, paddingTop: 60 }}>
          <div style={{ fontSize: 24, color: "#10b981", marginBottom: 8 }}>🎉 İŞİ TESLİM ET</div>

          {/* Sefer Bilgileri */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#fbbf24", marginBottom: 12 }}>
              {sefer?.yuk} - {sefer?.nereden} → {sefer?.nereye}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, background: "var(--bg2)", borderRadius: "12px", padding: "16px", border: "1px solid rgba(251,191,36,0.15)" }}>
              <div>
                <div style={{ fontSize: 10, color: "var(--text3)", marginBottom: 4 }}>ÜCRET</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#fbbf24" }}>₺{sefer?.ucret?.toLocaleString()}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "var(--text3)", marginBottom: 4 }}>TARİH</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{sefer?.tarih}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "var(--text3)", marginBottom: 4 }}>TONAJ</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{sefer?.ton > 0 ? `${sefer.ton} Ton` : "🔥 Serbest"}</div>
              </div>
            </div>
          </div>

          {/* IBAN Bilgileri */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>💳 ÖDEME BİLGİLERİ</div>

            <div style={{
              background: "linear-gradient(135deg, rgba(251,191,36,0.1) 0%, rgba(251,191,36,0.05) 100%)",
              borderRadius: "12px",
              padding: "16px",
              marginBottom: "12px",
              border: "1px solid rgba(251,191,36,0.2)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 18 }}>👤</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: "var(--text3)" }}>ALICI</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#fbbf24" }}>{aliciIbanSahibi || "IBAN bilgisi bekleniyor..."}</div>
                </div>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#2563eb", wordBreak: "break-all", display: "flex", alignItems: "center", gap: 8 }}>
                <span>TR</span>
                <span>{aliciIban?.replace(/^TR\s*/i, "") || ""}</span>
              </div>
            </div>

            <div style={{
              background: "linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(59,130,246,0.05) 100%)",
              borderRadius: "12px",
              padding: "16px",
              border: "1px solid rgba(59,130,246,0.2)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 18 }}>📤</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: "var(--text3)" }}>GÖNDERİLEN (SİZİN)</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#3b82f6" }}>{ceviciIbanSahibi || "IBAN bilgisi yok"}</div>
                </div>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#3b82f6", wordBreak: "break-all", display: "flex", alignItems: "center", gap: 8 }}>
                <span>TR</span>
                <span>{ceviciIban?.replace(/^TR\s*/i, "") || ""}</span>
              </div>
            </div>
          </div>

          {/* Teslimat Açıklaması */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text3)", marginBottom: 8, display: "block" }}>✅ TESLİMAT AÇIKLAMASI *</label>
            <textarea
              style={{
                width: "100%",
                padding: "14px",
                background: "var(--bg2)",
                border: "1px solid rgba(251,191,36,0.3)",
                borderRadius: "12px",
                fontSize: 14,
                outline: "none",
                transition: "all 0.3s ease",
                minHeight: "100px",
                resize: "vertical"
              }}
              placeholder="İşin teslimat durumunu giriniz..."
              value={aciklama}
              onChange={e => setAciklama(e.target.value)}
              onFocus={(e) => {
                e.target.style.borderColor = "#10b981";
                e.target.style.boxShadow = "inset 0 2px 8px rgba(0,0,0,0.2), 0 0 0 3px rgba(16,185,129,0.2)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "rgba(251,191,36,0.3)";
                e.target.style.boxShadow = "inset 0 2px 8px rgba(0,0,0,0.2)";
              }}
            />
          </div>

          {/* Aksiyon Butonları */}
          <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: "18px",
                background: "var(--bg1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                borderRadius: "16px",
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.3s ease",
                color: "#ef4444"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#ef4444";
                e.currentTarget.style.background = "linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.3)";
                e.currentTarget.style.background = "var(--bg1)";
              }}
            >
              ✕ İptal
            </button>
            <button
              onClick={mesajGonder}
              style={{
                flex: 1,
                padding: "18px",
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                color: "#fff",
                border: "none",
                borderRadius: "16px",
                fontSize: 15,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.3s ease",
                boxShadow: "0 4px 20px rgba(16, 185, 129, 0.3)"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 25px rgba(16, 185, 129, 0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(16, 185, 129, 0.3)";
              }}
            >
              {gonderiyor ? "⏳ Gönderiliyor..." : "✅ Teslim Et"}
            </button>
          </div>

          {/* Bilgi Notu */}
          <div style={{ marginTop: 20, padding: 12, background: "rgba(251,191,36,0.08)", borderRadius: "12px", border: "1px solid rgba(251,191,36,0.2)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 14 }}>ℹ️</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#fbbf24" }}>ÖDEMENİZİ YAPMADAN ÖNCE</span>
            </div>
            <div style={{ fontSize: 11, color: "var(--text3)", lineHeight: 1.6 }}>
              • Alıcı IBAN: <span style={{ color: "#fbbf24" }}>{aliciIban}</span>
              <br/>
              • Ödeme tamamlandığında sefer durumunun "Ödendi" olarak güncelleneceği
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
