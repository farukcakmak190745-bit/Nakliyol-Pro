import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { useMesaj } from "../context/MesajContext";

export default function TeslimEdildiModal({ sefer, onClose }) {
  const { oturum, islemiTeslimEt } = useApp();
  const mesajContext = useMesaj();

  // Form state — kamyonun kendi IBAN'ı + açıklama
  const [iban, setIban] = useState("");
  const [ibanSahibi, setIbanSahibi] = useState("");
  const [aciklama, setAciklama] = useState("");
  const [gonderiyor, setGonderiyor] = useState(false);

  // Profilindeki IBAN'ı default olarak göster
  useEffect(() => {
    if (oturum?.iban) setIban(oturum.iban);
    if (oturum?.ibanSahibi) setIbanSahibi(oturum.ibanSahibi);
  }, [oturum]);

  const handleSubmit = async () => {
    if (!aciklama.trim()) {
      alert("Lütfen teslimat açıklaması giriniz!");
      return;
    }
    if (!iban.trim()) {
      alert("Lütfen IBAN numaranızı giriniz!");
      return;
    }
    if (gonderiyor) return;
    setGonderiyor(true);

    try {
      // 1) Sefer durumunu güncelle
      await islemiTeslimEt(sefer.id);

      // 2) Konuşmayı bul (ilan_id üzerinden)
      const ilanId = sefer.ilan_id || sefer.ilanId;
      let konusma = mesajContext.konusmalar?.find(k => k.ilan_id === ilanId);

      // Konuşma yoksa, oluştur
      // KRİTİK: userId = giriş yapan kullanıcı (auth.uid() ile eşleşmeli,
      // RLS insert policy gereği). Kamyoncu teslim ettiği için user_id = kamyoncu.
      if (!konusma && ilanId && oturum?.id && sefer.olusturan_id) {
        const yeniId = await mesajContext.konusmaAc({
          userId: oturum.id,                       // kamyoncu (giriş yapan)
          partnerId: sefer.olusturan_id,          // işveren (karşı taraf)
          partnerAd: sefer.olusturan || "İşveren",
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
      const mesajMetni =
        `✅ İŞ TESLİM EDİLDİ\n\n` +
        `📝 ${aciklama}\n\n` +
        `💳 Ödeme Yapılacak IBAN:\n` +
        `${ibanSahibi ? `👤 ${ibanSahibi}\n` : ''}` +
        `🏦 ${iban}`;

      // 4) Mesajı gönder
      if (konusma?.id) {
        await mesajContext.mesajGonder(konusma.id, mesajMetni);
        console.log('✅ Teslimat mesajı gönderildi');
      } else {
        console.warn('⚠️ Konuşma bulunamadı, mesaj gönderilemedi');
      }

      alert(`✅ İş teslim edildi!\n\nİşverene IBAN bilgileriniz iletildi.`);
      onClose();
    } catch (err) {
      console.error('❌ Teslim etme hatası:', err);
      alert(`Hata: ${err.message || err}`);
    } finally {
      setGonderiyor(false);
    }
  };

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          style={{
            position: "fixed", top: 20, right: 20,
            background: "var(--bg1)", border: "1px solid var(--border2)",
            borderRadius: "12px", padding: "12px 16px",
            fontSize: 18, cursor: "pointer", zIndex: 101
          }}
        >✕</button>

        <div style={{ maxWidth: 440, margin: "0 auto", padding: 24, paddingTop: 60 }}>
          <div style={{ fontSize: 24, color: "#10b981", marginBottom: 4 }}>🎉 İŞİ TESLİM ET</div>
          <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 20 }}>
            {sefer?.yuk} • {sefer?.nereden} → {sefer?.nereye}
          </div>

          {/* Sefer özeti */}
          <div style={{
            background: "var(--bg2)",
            borderRadius: "12px",
            padding: "14px",
            marginBottom: 18,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            border: "1px solid rgba(251,191,36,0.15)"
          }}>
            <div>
              <div style={{ fontSize: 11, color: "var(--text3)" }}>ÜCRET</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#fbbf24" }}>
                ₺{sefer?.ucret?.toLocaleString()}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "var(--text3)" }}>TARİH</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{sefer?.tarih}</div>
            </div>
          </div>

          {/* IBAN Sahibi */}
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text3)", display: "block", marginBottom: 6 }}>
            👤 IBAN SAHİBİ
          </label>
          <input
            type="text"
            value={ibanSahibi}
            onChange={e => setIbanSahibi(e.target.value)}
            placeholder="Ad Soyad / Firma Adı"
            style={{
              width: "100%", padding: "14px",
              background: "var(--bg2)",
              border: "1px solid var(--border2)",
              borderRadius: "12px",
              fontSize: 14, outline: "none",
              marginBottom: 14
            }}
          />

          {/* IBAN */}
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text3)", display: "block", marginBottom: 6 }}>
            💳 IBAN NUMARASI *
          </label>
          <input
            type="text"
            value={iban}
            onChange={e => setIban(e.target.value)}
            placeholder="TR00 0000 0000 0000 0000 0000 00"
            style={{
              width: "100%", padding: "14px",
              background: "var(--bg2)",
              border: "1px solid var(--border2)",
              borderRadius: "12px",
              fontSize: 14, outline: "none",
              fontFamily: "monospace",
              letterSpacing: 0.5,
              marginBottom: 18
            }}
          />

          {/* Açıklama */}
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text3)", display: "block", marginBottom: 6 }}>
            ✅ TESLİMAT AÇIKLAMASI *
          </label>
          <textarea
            value={aciklama}
            onChange={e => setAciklama(e.target.value)}
            placeholder="Teslimat ile ilgili kısa açıklama yazın..."
            style={{
              width: "100%", padding: "14px",
              background: "var(--bg2)",
              border: "1px solid var(--border2)",
              borderRadius: "12px",
              fontSize: 14, outline: "none",
              minHeight: 90, resize: "vertical",
              marginBottom: 22,
              fontFamily: "inherit"
            }}
          />

          {/* Butonlar */}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={onClose}
              disabled={gonderiyor}
              style={{
                flex: 1, padding: "16px",
                background: "var(--bg1)",
                border: "1px solid var(--border2)",
                borderRadius: "14px",
                fontSize: 14, fontWeight: 600,
                cursor: gonderiyor ? "not-allowed" : "pointer",
                color: "var(--text2)",
                opacity: gonderiyor ? 0.5 : 1
              }}
            >
              İptal
            </button>
            <button
              onClick={handleSubmit}
              disabled={gonderiyor}
              style={{
                flex: 2, padding: "16px",
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                color: "#fff", border: "none",
                borderRadius: "14px",
                fontSize: 14, fontWeight: 700,
                cursor: gonderiyor ? "not-allowed" : "pointer",
                boxShadow: "0 4px 20px rgba(16, 185, 129, 0.3)"
              }}
            >
              {gonderiyor ? "⏳ Gönderiliyor..." : "✅ Teslim Et"}
            </button>
          </div>

          <div style={{ marginTop: 16, padding: 12, background: "rgba(251,191,36,0.06)", borderRadius: "10px", border: "1px solid rgba(251,191,36,0.15)", fontSize: 11, color: "var(--text3)", lineHeight: 1.6 }}>
            ℹ️ İşveren ile IBAN ve açıklamanız otomatik olarak paylaşılacak.
          </div>
        </div>
      </div>
    </div>
  );
}
