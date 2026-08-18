import { useState } from "react";
import { useApp } from "../context/AppContext";
import { supabase } from "../supabaseClient";
import { IconMap } from "../components/Icons";
import { harfFiltre, plakaFiltre, rakamFiltre } from "../utils/inputFilters";

export default function AyarlarSayfasi() {
  const { oturum, bildirimler, bildirimGuncelle, profilGuncelle, cikisYap } = useApp();
  const [kayitMesaj, setKayitMesaj] = useState(null);
  const [silmeDurumu, setSilmeDurumu] = useState("beklemede"); // beklemede | emin | siliniyor

  const isKamyoncu = oturum?.rol === "kamyoncu";

  // Bildirim türleri listesi
  const bildirimlerList = isKamyoncu
    ? [
        { icon: "📢", tur: "ilan", label: "Yeni İlan Bildirimi", desc: "Yeni ilan yayınlandığında bildir" },
        { icon: "file", tur: "teklif", label: "Teklif Bildirimi", desc: "İlanlara teklif verdiğinde bildir" },
        { icon: "mesaj", tur: "mesaj", label: "Mesaj Bildirimi", desc: "Yeni mesaj gelince bildir" },
        { icon: "🗺️", tur: "sefer", label: "Sefer Bildirimi", desc: "Sefer durumu değişince bildir" },
        { icon: "🔔", tur: "bildirim", label: "Bildirim Kuru", desc: "Bildirimleri toplu olarak gör" },
      ]
    : [
        { icon: "📢", tur: "ilan", label: "Yeni İlan Bildirimi", desc: "Yeni ilan yayınlandığında bildir" },
        { icon: "📋", tur: "teklif", label: "Teklif Bildirimi", desc: "Kamyoncu teklif verdiğinde bildir" },
        { icon: "mesaj", tur: "mesaj", label: "Mesaj Bildirimi", desc: "Yeni mesaj gelince bildir" },
        { icon: "🔔", tur: "bildirim", label: "Bildirim Kuru", desc: "Bildirimleri toplu olarak gör" },
      ];

  // Bildirim durumu değiştir
  const toggleBildirim = (tur) => {
    bildirimGuncelle(tur, !bildirimler[tur]);
  };

  // Profil güncelle
  const handleProfilGuncelle = async (e) => {
    e.preventDefault();
    const form = e.target;
    const payload = {
      ad: harfFiltre(form.ad.value.trim(), 60),
      telefon: rakamFiltre(form.telefon.value.trim(), 11),
      tc_kimlik: rakamFiltre(form.tc_kimlik.value.trim(), 11),
    };
    if (isKamyoncu) {
      payload.plaka = plakaFiltre(form.plaka.value.trim());
      payload.dorse_plaka = plakaFiltre(form.dorse_plaka.value.trim());
    }
    const sonuc = await profilGuncelle(payload);
    if (sonuc.ok) {
      setKayitMesaj("✓ Profil güncellendi");
      setTimeout(() => setKayitMesaj(null), 3000);
    }
  };

  // Şifre değiştir
  const handleSifreDegistir = () => {
    alert("Şifre değiştirme özelliği yakında!");
  };

  // Dil değiştir
  const handleDilDegistir = () => {
    alert("Dil seçimi yakında!");
  };

  // Hesabı kalıcı olarak sil (Google Play zorunluluğu)
  const handleHesapSil = async () => {
    if (silmeDurumu !== "emin") {
      setSilmeDurumu("emin");
      return;
    }
    const sonOnay = confirm(
      "Bu işlem geri alınamaz! Tüm ilanların, seferlerin ve mesajların kalıcı olarak silinecek. Devam edilsin mi?"
    );
    if (!sonOnay) {
      setSilmeDurumu("beklemede");
      return;
    }
    setSilmeDurumu("siliniyor");
    try {
      const { error } = await supabase.rpc("hesap_sil");
      if (error) throw error;
      await cikisYap();
    } catch (err) {
      console.error("Hesap silme hatası:", err);
      alert("Hesap silinirken bir hata oluştu. Desteğe ulaşın veya tekrar deneyin.");
      setSilmeDurumu("beklemede");
    }
  };

  // Bildirim yerleri
  const bildirimYerleri = [
    { icon: "📱", label: "Push Bildirimi", desc: "Telefonda bildirim gönder", active: true },
    { icon: "✉️", label: "E-posta", desc: "Günlük özet e-posta", active: true },
    { icon: "🔔", label: "Sesli Bildirim", desc: "Bildirim geldiğinde ses", active: true },
  ];

  return (
    <div className="scroll-content" style={{ paddingBottom: 100 }}>
      {/* Başlık */}
      <div style={{ padding: "16px 16px 8px" }}>
        <div style={{ fontSize: 24, fontWeight: 700, color: "var(--text)" }}>Ayarlar</div>
        <div style={{ fontSize: 13, color: "var(--text3)", marginTop: 4 }}>
          {isKamyoncu ? "Kamyoncu" : "İşveren"} hesap ayarları
        </div>
      </div>

      {/* Kayıt mesajı */}
      {kayitMesaj && (
        <div style={{
          margin: "16px 16px 8px",
          padding: "12px 14px",
          background: "rgba(16,185,129,0.1)",
          border: "1px solid rgba(16,185,129,0.3)",
          borderRadius: "12px",
          fontSize: 13,
          color: "#10b981",
          fontWeight: 600,
        }}>
          {kayitMesaj}
        </div>
      )}

      {/* Profil Ayarları */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1.5, color: "var(--text3)", marginBottom: 12, textTransform: "uppercase" }}>
          👤 Profil
        </div>

        <form onSubmit={handleProfilGuncelle} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text3)", display: "block", marginBottom: 6 }}>Ad Soyad</label>
            <input
              name="ad"
              defaultValue={oturum?.ad || ""}
              required
              style={{
                width: "100%",
                padding: "12px 14px",
                background: "var(--bg1)",
                color: "var(--text)",
                border: "1px solid var(--border2)",
                borderRadius: "12px",
                fontSize: 14,
                fontWeight: 600,
                outline: "none"
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text3)", display: "block", marginBottom: 6 }}>Telefon</label>
            <input
              name="telefon"
              type="tel"
              defaultValue={oturum?.telefon || ""}
              required
              style={{
                width: "100%",
                padding: "12px 14px",
                background: "var(--bg1)",
                color: "var(--text)",
                border: "1px solid var(--border2)",
                borderRadius: "12px",
                fontSize: 14,
                fontWeight: 600,
                outline: "none"
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text3)", display: "block", marginBottom: 6 }}>TC Kimlik</label>
            <input
              name="tc_kimlik"
              type="text"
              defaultValue={oturum?.tc_kimlik || ""}
              maxLength={11}
              required
              style={{
                width: "100%",
                padding: "12px 14px",
                background: "var(--bg1)",
                color: "var(--text)",
                border: "1px solid var(--border2)",
                borderRadius: "12px",
                fontSize: 14,
                fontWeight: 600,
                outline: "none",
                fontFamily: "monospace",
                letterSpacing: 1
              }}
            />
          </div>

          {isKamyoncu && (
            <>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text3)", display: "block", marginBottom: 6 }}>Çekici Plakası</label>
                <input
                  name="plaka"
                  type="text"
                  defaultValue={oturum?.plaka || ""}
                  required
                  placeholder="34 ABC 123"
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    background: "var(--bg1)",
                    color: "var(--text)",
                    border: "1px solid var(--border2)",
                    borderRadius: "12px",
                    fontSize: 14,
                    fontWeight: 700,
                    letterSpacing: 1,
                    outline: "none"
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text3)", display: "block", marginBottom: 6 }}>Dorse Plakası</label>
                <input
                  name="dorse_plaka"
                  type="text"
                  defaultValue={oturum?.dorse_plaka || ""}
                  placeholder="34 ABC 123"
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    background: "var(--bg1)",
                    color: "var(--text)",
                    border: "1px solid var(--border2)",
                    borderRadius: "12px",
                    fontSize: 14,
                    fontWeight: 700,
                    letterSpacing: 1,
                    outline: "none"
                  }}
                />
              </div>
            </>
          )}

          <button
            type="submit"
            style={{
              marginTop: 8,
              width: "100%",
              padding: "14px",
              background: "var(--guldum-gradient)",
              color: "#0a0a0a",
              border: "none",
              borderRadius: "12px",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 16px rgba(251,191,36,0.3)"
            }}
          >
            💾 Kaydet
          </button>
        </form>
      </div>

      {/* Bildirim Ayarları */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1.5, color: "var(--text3)", marginBottom: 12, textTransform: "uppercase" }}>
          🔔 Bildirimler
        </div>

        {bildirimlerList.map((item, i) => (
          <div key={item.tur} style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 14px",
            borderBottom: i < bildirimlerList.length - 1 ? "1px solid rgba(251,191,36,0.1)" : "none"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 24 }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{item.label}</div>
                <div style={{ fontSize: 12, color: "var(--text3)" }}>{item.desc}</div>
              </div>
            </div>

            <div
              onClick={() => toggleBildirim(item.tur)}
              style={{
                width: 52,
                height: 30,
                borderRadius: 15,
                background: bildirimler[item.tur] ? "#10b981" : "var(--bg1)",
                border: `1px solid ${bildirimler[item.tur] ? "#10b981" : "var(--border2)"}`,
                cursor: "pointer",
                position: "relative",
                transition: "all 0.2s"
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 3,
                  left: bildirimler[item.tur] ? "23px" : "3px",
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: "#fff",
                  border: `1px solid ${bildirimler[item.tur] ? "#10b981" : "var(--border2)"}`,
                  transition: "all 0.2s",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Bildirim Yeri */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1.5, color: "var(--text3)", marginBottom: 12, textTransform: "uppercase" }}>
          📍 Bildirim Yerleri
        </div>

        {bildirimYerleri.map((item, i) => (
          <div key={item.label} style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 14px",
            borderBottom: i < bildirimYerleri.length - 1 ? "1px solid rgba(251,191,36,0.1)" : "none"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 24 }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{item.label}</div>
                <div style={{ fontSize: 12, color: "var(--text3)" }}>{item.desc}</div>
              </div>
            </div>

            <div
              onClick={() => alert(`${item.label} ayarlanıyor...`)}
              style={{
                width: 52,
                height: 30,
                borderRadius: 15,
                background: item.active ? "#10b981" : "var(--bg1)",
                border: `1px solid ${item.active ? "#10b981" : "var(--border2)"}`,
                cursor: "pointer",
                position: "relative"
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 3,
                  left: item.active ? "23px" : "3px",
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: "#fff",
                  border: `1px solid ${item.active ? "#10b981" : "var(--border2)"}`,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Diğer Ayarlar */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1.5, color: "var(--text3)", marginBottom: 12, textTransform: "uppercase" }}>
          ⚙️ Diğer
        </div>

        {[
          { icon: "🌐", label: "Dil", desc: "Dil seçimi", action: handleDilDegistir, active: true },
          { icon: "🔒", label: "Şifre Değiştir", desc: "Hesap şifresini güncelle", action: handleSifreDegistir },
          { icon: "🧹", label: "Önbelleği Temizle", desc: "Önbellek ve verileri temizle", action: () => alert("Önbellek temizlendi!") },
          { icon: "💾", label: "Verileri Yedekle", desc: "Hesap verilerini indir", action: () => alert("Yedekleme işlemi yapılıyor...") },
        ].map((item, i) => (
          <div
            key={item.label}
            onClick={item.action}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 14px",
              borderBottom: i < 3 ? "1px solid rgba(251,191,36,0.1)" : "none",
              cursor: "pointer",
              transition: "background 0.2s"
            }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--bg1)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 24 }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{item.label}</div>
                <div style={{ fontSize: 12, color: "var(--text3)" }}>{item.desc}</div>
              </div>
            </div>
            <span style={{ color: "var(--text3)" }}>›</span>
          </div>
        ))}
      </div>

      {/* Çıkış */}
      <button
        onClick={() => {
          if (confirm("Çıkış yapmak istediğine emin misin?")) cikisYap();
        }}
        style={{
          width: "100%",
          padding: "16px",
          background: "linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(239,68,68,0.05) 100%)",
          color: "#ef4444",
          border: "1px solid rgba(239,68,68,0.3)",
          borderRadius: "14px",
          fontSize: 14,
          fontWeight: 700,
          cursor: "pointer",
          transition: "all 0.2s"
        }}
        onMouseEnter={e => { e.currentTarget.style.background = "linear-gradient(135deg, rgba(239,68,68,0.25) 0%, rgba(239,68,68,0.1) 100%)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(239,68,68,0.05) 100%)"; }}
      >
        🚪 Çıkış Yap
      </button>

      {/* Hesap Silme (Google Play zorunluluğu) */}
      <button
        onClick={handleHesapSil}
        disabled={silmeDurumu === "siliniyor"}
        style={{
          marginTop: 10,
          width: "100%",
          padding: "16px",
          background: silmeDurumu === "emin"
            ? "linear-gradient(135deg, rgba(239,68,68,0.35) 0%, rgba(239,68,68,0.2) 100%)"
            : "transparent",
          color: "#ef4444",
          border: silmeDurumu === "emin" ? "1px solid #ef4444" : "1px dashed rgba(239,68,68,0.4)",
          borderRadius: "14px",
          fontSize: 14,
          fontWeight: 700,
          cursor: silmeDurumu === "siliniyor" ? "default" : "pointer",
          opacity: silmeDurumu === "siliniyor" ? 0.6 : 1,
          transition: "all 0.2s"
        }}
      >
        {silmeDurumu === "emin"
          ? "⚠️ Emin misin? Tekrar tıkla → Hesabı kalıcı olarak sil"
          : silmeDurumu === "siliniyor"
            ? "🔄 Siliniyor..."
            : "🗑️ Hesabımı Sil"}
      </button>

      <div style={{ padding: "24px 16px 16px", textAlign: "center", fontSize: 12, color: "var(--text3)" }}>
        Nakliyol Pro v1.0.0 • {new Date().getFullYear()}
      </div>
    </div>
  );
}
