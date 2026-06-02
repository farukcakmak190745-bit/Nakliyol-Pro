import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ChatSayfasi from "../../components/ChatSayfasi";
import { useApp } from "../../context/AppContext";
import { EmptyState } from "../../components/UI";

export function IlanVerSayfasi() {
  const { ilanEkle, ilanSil } = useApp();
  const [form, setForm] = useState({
    nereden: "", nereye: "", yuk: "",
    tonaj: "20",
    ucret: "",
    ucretTipi: "duz",
    tarih: "",
    aracTip: "",
    aciklama: "", odemeTuru: "pesin", odemeGun: 0
  });
  const [tamam, setTamam] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const gonder = () => {
    if (!form.nereden || !form.nereye || !form.yuk || !form.ucret) {
      alert("Lütfen zorunlu alanları doldurun!");
      return;
    }
    const ucret = Number(form.ucret);
    const kdvOrani = form.ucretTipi === "kdv" ? 0.2 : 0;
    const kdvTutari = ucret * kdvOrani;
    const toplamUcret = ucret + kdvTutari;

    console.log("📤 Yeni ilan gönderiliyor:", { ...form, ton: 0, ucret: ucret, kdvOrani: kdvOrani, kdvTutari: kdvTutari, toplamUcret: toplamUcret, odemeTuru: form.odemeTuru, odemeGun: Number(form.odemeGun) });

    ilanEkle({
      ...form,
      ton: 0,
      ucret: ucret,
      kdvOrani: kdvOrani,
      kdvTutari: kdvTutari,
      toplamUcret: toplamUcret,
      odemeTuru: form.odemeTuru,
      odemeGun: Number(form.odemeGun)
    });
    setTamam(true);
    setTimeout(() => {
      setTamam(false);
      setForm({
        nereden: "", nereye: "", yuk: "",
        ucret: "",
        ucretTipi: "kdv",
        tarih: "",
        aracTip: "", aciklama: "", odemeTuru: "pesin", odemeGun: 0
      });
    }, 2000);
  };

  const inputStyle = "input";
  const Label = ({ children, zorunlu }) => (
    <label className="label" style={{ marginBottom: 8 }}>
      {zorunlu ? <>{children} <span style={{ color: "#ea580c", fontSize: 10 }}>*</span></> : children}
    </label>
  );

  if (tamam) return (
    <div className="scroll-content" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 56, marginBottom: 20 }}>✅</div>
        <div className="display" style={{ fontSize: 28, color: "#10b981" }}>İLAN YAYINDA!</div>
        <div style={{ color: "var(--text2)", marginTop: 10, fontSize: 14 }}>Teklifler gelmeye başlayacak</div>
        <button onClick={() => setTamam(false)} className="btn btn-success btn-full" style={{ marginTop: 24, padding: "14px" }}>
          Devam Et
        </button>
      </div>
    </div>
  );

  return (
    <div className="scroll-content">
      <div className="section-title">YENİ İLAN VER</div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>🗺️</span>
          <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1.5, color: "#fbbf24" }}>GÜZERGAH</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="input-group">
            <Label zorunlu>Nereden</Label>
            <input className={inputStyle} placeholder="Antalya" value={form.nereden} onChange={e => set("nereden", e.target.value)} />
          </div>
          <div className="input-group">
            <Label zorunlu>Nereye</Label>
            <input className={inputStyle} placeholder="İzmir" value={form.nereye} onChange={e => set("nereye", e.target.value)} />
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>📦</span>
          <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1.5, color: "#fbbf24" }}>YÜK BİLGİSİ</span>
        </div>
        <div className="input-group">
          <Label zorunlu>Yük Türü</Label>
          <input className={inputStyle} placeholder="Kömür, çelik, gıda..." value={form.yuk} onChange={e => set("yuk", e.target.value)} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 10 }}>
          <div className="input-group">
            <Label zorunlu>Fiyat</Label>
            <input className={inputStyle} type="number" placeholder="8500" value={form.ucret} onChange={e => set("ucret", e.target.value)} />
          </div>
          <div className="input-group">
            <Label zorunlu>Araç Tipi</Label>
            <select className={inputStyle} value={form.aracTip} onChange={e => set("aracTip", e.target.value)} style={{ cursor: "pointer", background: "var(--bg2)" }}>
              <option value="">Seçin...</option>
              {["TIR", "10 Teker Açık", "10 Teker Tenteli", "Kırkayak Açık", "Kamyonet", "50 NC Kamyon", "Diğer"].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <Label zorunlu>Ücret Tipi</Label>
          <select className={inputStyle} value={form.ucretTipi} onChange={e => set("ucretTipi", e.target.value)} style={{ cursor: "pointer", background: "var(--bg2)" }}>
            <option value="kdv">💵 +KDV</option>
            <option value="duz">💵 Sabit Fiyat</option>
          </select>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>📅</span>
          <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1.5, color: "#fbbf24" }}>TARİH & NOTLAR</span>
        </div>
        <div className="input-group">
          <Label>Yükleme Tarihi</Label>
          <input className={inputStyle} type="date" value={form.tarih} onChange={e => set("tarih", e.target.value)} />
        </div>
        <div className="input-group">
          <Label>Açıklama</Label>
          <textarea className={inputStyle} rows={3} placeholder="Özel şartlar, araç özellikleri..." value={form.aciklama} onChange={e => set("aciklama", e.target.value)} style={{ resize: "vertical", lineHeight: 1.6 }} />
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>💰</span>
          <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1.5, color: "#fbbf24" }}>ÖDEME PLANI</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
          {[
            { tur: "pesin", gun: 0, label: "Peşin", desc: "Hemen tam ödeme", color: "#10b981" },
            { tur: "7-gun", gun: 7, label: "7 Gün", desc: "Teslimden 7 gün sonra", color: "#ef4444" },
            { tur: "15-gun", gun: 15, label: "15 Gün", desc: "Teslimden 15 gün sonra", color: "#fbbf24" },
            { tur: "30-gun", gun: 30, label: "30 Gün", desc: "Teslimden 30 gün sonra", color: "#3b82f6" },
          ].map(opt => (
            <button
              key={opt.tur}
              onClick={() => set("odemeTuru", opt.tur)}
              style={{
                padding: "14px 8px",
                borderRadius: "12px",
                border: `2px solid rgba(251,191,36,0.2)`,
                background: form.odemeTuru === opt.tur ? opt.color : "transparent",
                color: form.odemeTuru === opt.tur ? "#fff" : "var(--text2)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                transition: "all 0.2s"
              }}
            >
              <div style={{ fontSize: 22 }}>{opt.color === "#10b981" ? "💰" : opt.color === "#ef4444" ? "⚡" : opt.color === "#fbbf24" ? "⏰" : "📅"}</div>
              <div style={{ color: form.odemeTuru === opt.tur ? "#fff" : opt.color }}>{opt.label}</div>
              <div style={{ fontSize: 10, color: "var(--text3)" }}>{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <button onClick={gonder} className="btn btn-display-gold btn-full" style={{ padding: "18px", letterSpacing: 3 }}>
        📢 İLANI YAYINLA
      </button>
    </div>
  );
}

// İlan Listesi sayfası - işverenlerin kendi ilanlarını görüp silebilmesi için
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

export function TekliflerSayfasi() {
  const { oturum, konusmaOluştur, ilkMesajiGonder, seferler, bekleyenOnaylariGetir, kamyoncuBasvuruBekleyenleriGetir, ilaniOnayla, ilanlar } = useApp();
  const [kabulEdilen, setKabulEdilen] = useState(new Set());
  const [seciliSefer, setSeciliSefer] = useState(null);
  const [konusmaIdMap, setKonusmaIdMap] = useState({});
  const [bekleyenOnaylar, setBekleyenOnaylar] = useState([]);
  const [yeniBekleyenler, setYeniBekleyenler] = useState([]);

  // İşverenin kendi ilanlarını filtrele
  const kendiIlanlar = ilanlar ? ilanlar.filter(i => i.olusturan_id === oturum?.id) : [];
  const kendiIlanIdleri = new Set(kendiIlanlar.map(i => i.id));

  // Sadece bu işverene ait (kendi ilanına yapılmış) bekleyen seferleri al
  const kendiSeferler = seferler
    ? seferler.filter(s => s.ilan_id && kendiIlanIdleri.has(s.ilan_id))
    : [];
  const mevcutSeferler = kendiSeferler.filter(s => s.durum === "bekliyor");
  const kabulEdilecekler = mevcutSeferler.filter(s => kabulEdilen.has(s.id));
  const aktifSeferler = kendiSeferler.filter(s => s.durum === "yolda" || s.durum === "teslima_bekleniyor");

  useEffect(() => {
    // Backend'den gelen ve bu işverene ait 'bekliyor' durumundaki seferleri al
    const backendBekleyenler = seferler.filter(s =>
      s.durum === "bekliyor" && s.ilan_id && kendiIlanIdleri.has(s.ilan_id)
    );

    // Yerel state'teki bekleyen onayları al
    const localOnaylar = bekleyenOnaylariGetir();

    // Her iki kaynakla da birleştir - uniq ilanId'ye sahip olanları al
    const allBekleyenler = [
      ...backendBekleyenler.map(s => ({
        ilanId: s.ilan_id,
        yuk: s.yuk,
        nereden: s.nereden,
        nereye: s.nereye,
        bilgiler: {
          ad: s.kamyoncu,
          tel: s.kamyoncu_tel,
          cekiciPlaka: s.plaka,
          dorsePlaka: s.dorse_plaka,
          tc_kimlik: s.kamyoncu_tc
        }
      })),
      ...localOnaylar
    ];

    // Aynı ilanId'ye sahip olanları uniq yap
    const uniqOnaylar = allBekleyenler.filter((item, index, self) =>
      index === self.findIndex(t => t.ilanId === item.ilanId)
    );

    setBekleyenOnaylar(uniqOnaylar);
    setYeniBekleyenler(uniqOnaylar);
    // kendiIlanIdleri bir Set'tir; değişiklikleri yakalamak için string olarak dependency'ye koyuyoruz
    // eslint-disable-next-line
  }, [seferler, bekleyenOnaylariGetir, Array.from(kendiIlanIdleri).join(',')]);

  const kabulEt = (sefer) => {
    setKabulEdilen(prev => new Set([...prev, sefer.id]));
    const newConversation = konusmaOluştur({
      partnerId: sefer.kamyoncu || sefer.kamyoncu_tc || String(sefer.id),
      partnerAd: sefer.kamyoncu || sefer.kamyoncu_tc || "Kamyoncu",
      partnerRol: "kamyoncu",
      baslik: `${sefer.yuk} - ${sefer.nereden} → ${sefer.nereye}`,
      resim: "https://api.dicebear.com/7.x/initials/svg?seed=" + String(sefer.kamyoncu || sefer.kamyoncu_tc || "K").substring(0, 2).toUpperCase()
    });
    setKonusmaIdMap(prev => ({ ...prev, [sefer.id]: newConversation }));

    // Bekleyen onay listesini kaldır
    setBekleyenOnaylar(prev => prev.filter(o => o.ilanId !== sefer.ilanId));

    setTimeout(() => {
      ilkMesajiGonder(
        newConversation,
        `✓ İş başvurunuz kabul edildi. Gelen bilgiler:\n\n👤 Ad: ${sefer.kamyoncu || sefer.kamyoncu_tc || "Belirtilmedi"}\n📞 Tel: ${sefer.kamyoncuTel || "Belirtilmedi"}\n🚚 Çekici Plaka: ${sefer.plaka || "Belirtilmedi"}\n🚐 Dorse Plaka: ${sefer.dorsePlaka || "Belirtilmedi"}\n🆔 TC Kimlik: ${sefer.kamyoncu_tc || "Belirtilmedi"}\n\nŞimdi convo üzerinden konuşabiliriz.`
      );
    }, 500);
    return newConversation;
  };

  return (
    <div className="scroll-content">
      {/* BEKLEYEN ONAYLAR - İşveren */}
      {yeniBekleyenler.length > 0 && (
        <>
          <div style={{
            background: "linear-gradient(135deg, rgba(251,191,36,0.15) 0%, rgba(251,191,36,0.08) 100%)",
            padding: "14px 20px",
            borderRadius: "12px",
            marginBottom: "16px",
            border: "1px solid rgba(251,191,36,0.2)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20 }}>⏳</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#fbbf24" }}>
                  {yeniBekleyenler.length} yeni başvuru var
                </div>
                <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>
                  Kamyoncuların bilgilerini görüp onaylayın
                </div>
              </div>
            </div>
          </div>
          <div className="section-title">🔔 BAŞVURU BEKLENIYOR ({yeniBekleyenler.length})</div>
          {yeniBekleyenler.map(o => (
            <div key={o.ilanId} className="card" style={{ marginBottom: 14, border: "2px solid rgba(251,191,36,0.3)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <div style={{ width: 46, height: 46, borderRadius: "50%", background: "linear-gradient(135deg, var(--guldum-gradient), var(--purple-gradient))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "#fff", flexShrink: 0 }}>⏳</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 15, color: "#fbbf24" }}>{o.bilgiler?.ad}</div>
                  <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>
                    📦 {o.yuk} • {o.nereden} → {o.nereye}
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
                <div style={{ background: "var(--bg2)", borderRadius: "12px", padding: "12px", textAlign: "center", border: "1px solid rgba(251,191,36,0.1)" }}>
                  <div style={{ fontSize: 10, color: "var(--text3)" }}>Plakalar</div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginTop: 4 }}>
                    🚚 {o.bilgiler?.cekiciPlaka}<br/>🚐 {o.bilgiler?.dorsePlaka}
                  </div>
                </div>
                <div style={{ background: "var(--bg2)", borderRadius: "12px", padding: "12px", textAlign: "center", border: "1px solid rgba(251,191,36,0.1)" }}>
                  <div style={{ fontSize: 10, color: "var(--text3)" }}>Telefon</div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginTop: 4 }}>{o.bilgiler?.tel}</div>
                </div>
                <div style={{ background: "var(--bg2)", borderRadius: "12px", padding: "12px", textAlign: "center", border: "1px solid rgba(251,191,36,0.1)" }}>
                  <div style={{ fontSize: 10, color: "var(--text3)" }}>TC Kimlik</div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginTop: 4 }}>{o.bilgiler?.tc_kimlik}</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => ilaniOnayla(o.ilanId, o.bilgiler.ad, o.bilgiler.tel, o.bilgiler.cekiciPlaka, o.bilgiler.dorsePlaka, o.bilgiler.tc_kimlik, oturum?.user?.id)}
                  className="btn btn-primary"
                  style={{ flex: 1, padding: "12px", fontSize: 13 }}
                >
                  ✓ Kabul Et
                </button>
                <button
                  onClick={() => {
                    // Onay listesinden kaldır
                    setBekleyenOnaylar(prev => prev.filter(i => i.ilanId !== o.ilanId));
                    alert("Başvuru reddedildi!");
                  }}
                  style={{ flex: 1, padding: "12px", background: "var(--bg1)", border: "1px solid var(--border2)", borderRadius: "12px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                >
                  ✕ Reddet
                </button>
              </div>
            </div>
          ))}
          <div style={{ height: 20 }}></div>
        </>
      )}

      {/* AKTİF İŞLER */}
      {aktifSeferler.length > 0 && (
        <>
          <div className="section-title">AKTİF İŞLER ({aktifSeferler.length})</div>
          {aktifSeferler.map(s => (
            <div key={s.id} className="card" style={{ marginBottom: 14 }} onClick={() => {
              const newConversationId = konusmaOluştur({
                partnerId: s.kamyoncu || s.kamyoncu_tc || String(s.id),
                partnerAd: s.kamyoncu || s.kamyoncu_tc || "Kamyoncu",
                partnerRol: "kamyoncu",
                baslik: `${s.yuk} - ${s.nereden} → ${s.nereye}`,
                resim: "https://api.dicebear.com/7.x/initials/svg?seed=" + String(s.kamyoncu || s.kamyoncu_tc || "K").substring(0, 2).toUpperCase(),
                bg: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              });
              setKonusmaIdMap(prev => ({ ...prev, [s.id]: newConversationId }));
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ fontSize: 32 }}>🚛</div>
                  <div>
                    <div style={{ fontSize: 16, color: "#fbbf24", fontWeight: 600 }}>{s.yuk}</div>
                    <div style={{ fontSize: 10, color: "var(--text3)", letterSpacing: 1.5 }}>Yük Tipi</div>
                  </div>
                </div>
                <div style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(16,185,129,0.1) 100%)", color: "#10b981", padding: "6px 12px", borderRadius: "20px", fontSize: 11, fontWeight: 600, border: "1px solid rgba(16,185,129,0.3)" }}>
                  ✓ Yolda
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{s.nereden}</span>
                <span style={{ color: "#fbbf24" }}>→</span>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{s.nereye}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
                <div style={{ background: "var(--bg2)", borderRadius: "12px", padding: "12px", textAlign: "center", border: "1px solid rgba(251,191,36,0.1)" }}>
                  <div style={{ fontSize: 10, color: "var(--text3)" }}>Plaka</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#3b82f6" }}>{s.plaka}</div>
                </div>
                <div style={{ background: "var(--bg2)", borderRadius: "12px", padding: "12px", textAlign: "center", border: "1px solid rgba(251,191,36,0.1)" }}>
                  <div style={{ fontSize: 10, color: "var(--text3)" }}>Ücret</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#fbbf24" }}>₺{s.toplamUcret?.toLocaleString() || s.ucret.toLocaleString()}</div>
                  <div style={{ fontSize: 9, color: "#3b82f6", marginTop: 2 }}>{s.odemeTuru === "pesin" ? "💰 Peşin" : `${s.odemeGun} Gün`}</div>
                  {s.kdvOrani > 0 && <div style={{ fontSize: 9, color: "#10b981", marginTop: 1 }}>+KDV</div>}
                </div>
                <div style={{ background: "var(--bg2)", borderRadius: "12px", padding: "12px", textAlign: "center", border: "1px solid rgba(251,191,36,0.1)" }}>
                  <div style={{ fontSize: 10, color: "var(--text3)" }}>Tonaj</div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{s.ton > 0 ? `${s.ton} Ton` : "🔥 Serbest"}</div>
                </div>
              </div>
              <button
                onClick={() => kabulEt(s)}
                className="btn btn-primary"
                style={{ padding: "12px", fontSize: 13 }}
              >
                💬 Mesajlaş
              </button>
            </div>
          ))}
        </>
      )}

      {kabulEdilecekler.length > 0 && (
        <>
          {aktifSeferler.length > 0 && <div style={{ height: 20 }}></div>}
          <div className="section-title">GELEN TEKLİFLER ({kabulEdilecekler.length})</div>
          {kabulEdilecekler.map(s => (
            <div key={s.id} className="card" style={{ marginBottom: 14, border: "1px solid rgba(251,191,36,0.3)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 46, height: 46, borderRadius: "50%", background: "linear-gradient(135deg, var(--guldum-gradient), var(--purple-gradient))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "#fff", flexShrink: 0 }}>✓</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 15, color: "#fbbf24" }}>{s.kamyoncu}</div>
                  <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>₺{s.ucret.toLocaleString()} • {s.tarih}</div>
                </div>
                <button
                  onClick={() => {
                    const newConversationId = konusmaOluştur({
                      partnerId: s.kamyoncu || s.kamyoncu_tc || String(s.id),
                      partnerAd: s.kamyoncu || s.kamyoncu_tc || "Kamyoncu",
                      partnerRol: "kamyoncu",
                      baslik: `${s.yuk} - ${s.nereden} → ${s.nereye}`,
                      resim: "https://api.dicebear.com/7.x/initials/svg?seed=" + String(s.kamyoncu || s.kamyoncu_tc || "K").substring(0, 2).toUpperCase(),
                      bg: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                    });
                    setKonusmaIdMap(prev => ({ ...prev, [s.id]: newConversationId }));
                    ilkMesajiGonder(newConversationId, `✓ İş başvurunuz kabul edildi. Gelen bilgiler:\n\n👤 Ad: ${s.kamyoncu || s.kamyoncu_tc || "Belirtilmedi"}\n📞 Tel: ${s.kamyoncuTel || "Belirtilmedi"}\n🚚 Çekici Plaka: ${s.plaka || "Belirtilmedi"}\n🚐 Dorse Plaka: ${s.dorsePlaka || "Belirtilmedi"}\n🆔 TC Kimlik: ${s.kamyoncu_tc || "Belirtilmedi"}\n\nŞimdi convo üzerinden konuşabiliriz.`);
                  }}
                  className="btn btn-primary"
                  style={{ padding: "10px 18px", fontSize: 12 }}
                >
                  Konuş
                </button>
              </div>
            </div>
          ))}
        </>
      )}

      {yeniBekleyenler.length === 0 && aktifSeferler.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text3)" }}>
          <div style={{ fontSize: 56, marginBottom: 20 }}>📋</div>
          <div style={{ fontSize: 16, marginBottom: 8 }}>Henüz teklif veya aktif iş yok</div>
          <div style={{ fontSize: 13 }}>İlanlar sekmesinden yük vererek başlayın!</div>
        </div>
      )}
    </div>
  );
}

export function MesajlarSayfasi({ onGeri }) {
  const { konusmalar, oturum } = useApp();
  const [secili, setSecili] = useState(null);

  if (secili) {
    const konusma = konusmalar.find(k => k.id === secili);
    if (!konusma) {
      setSecili(null);
      return null;
    }
    return <ChatSayfasi konusmaId={secili} onGeri={() => setSecili(null)} />;
  }

  return (
    <div className="scroll-content">
      <div className="section-title">MESAJLAR ({konusmalar?.length || 0})</div>
      {(!konusmalar || konusmalar.length === 0) ? (
        <EmptyState icon="💬" text="Henüz mesaj yok" />
      ) : (
        konusmalar.map(k => (
          <div key={k.id} className="card" style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }} onClick={() => setSecili(k.id)}>
            <div style={{ width: 46, height: 46, borderRadius: "50%", background: "linear-gradient(135deg, var(--guldum-gradient), var(--purple-gradient))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "#fff", flexShrink: 0 }}>
              {k.partnerRol === "kamyoncu" ? "🚛" : "🏢"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: "#fbbf24" }}>{k.partnerAd}</div>
              <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {k.mesajlar && k.mesajlar.length > 0 ? (k.mesajlar[k.mesajlar.length - 1].metin || "📄 Dosya gönderildi") : (k.baslik || "")}
              </div>
            </div>
            <div style={{ flexShrink: 0, textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "var(--text3)" }}>
                {new Date(k.sonOkuma).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export function IssizProfilSayfasi() {
  const { oturum, cikisYap, ibanGuncelle } = useApp();
  const navigate = useNavigate();
  const [belgeEklendi, setBelgeEklendi] = useState(false);

  const [localIbanSahibi, setLocalIbanSahibi] = useState("");
  const [localIban, setLocalIban] = useState("");

  const handleIbanSahibiGuncelle = (deger) => {
    setLocalIbanSahibi(deger);
  };

  const handleIbanGuncelle = (deger) => {
    setLocalIban(deger);
    // Formdan çıkıldığında veya "Güncelle" butonuna basıldığında oturuma kaydet
    if (deger.trim()) {
      ibanGuncelle("ibanSahibi", localIbanSahibi);
      ibanGuncelle("iban", localIban);
      alert("IBAN bilgileriniz güncellendi!");
    }
  };

  // Component mount olduğunda oturum değerlerini local state'e kopyala
  useEffect(() => {
    if (oturum?.ibanSahibi) setLocalIbanSahibi(oturum.ibanSahibi);
    if (oturum?.iban) setLocalIban(oturum.iban);
  }, [oturum]);

  const belgeler = [
    { id: 1, ad: "Firma Kayıt Belgesi", ok: true, tarih: "2019-01-15" },
    { id: 2, ad: "Vergi Levhası", ok: true, tarih: "2019-01-15" },
    { id: 3, ad: "İş Yeri Güvenliği", ok: true, tarih: "2020-06-20" },
  ];

  const statler = [
    { val: "47", lbl: "İlan" },
    { val: "89", lbl: "Sefer" },
    { val: "4.8", lbl: "Puan" },
    { val: "3 Yıl", lbl: "Deneyim" },
  ];

  const dosyaInputRef = useRef();

  const belgeEkle = () => {
    if (dosyaInputRef.current?.value) {
      setBelgeEklendi(true);
      setTimeout(() => setBelgeEklendi(false), 2000);
    }
  };

  return (
    <div className="scroll-content">
      <div className="card" style={{ textAlign: "center", padding: 28, marginBottom: 14 }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>🏢</div>
        <div className="display" style={{ fontSize: 28, color: "#fbbf24" }}>{oturum?.ad || "Demo Firma"}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
          <span>⭐</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#fbbf24" }}>4.9 — Güvenilir İşveren</span>
        </div>
        <div style={{ marginTop: 14, fontSize: 12, color: "var(--text2)" }}>Firma • İstanbul</div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginTop: 18 }}>
          {statler.map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#fbbf24" }}>{s.val}</div>
              <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 2, letterSpacing: 1.5 }}>{s.lbl}</div>
            </div>
          ))}
        </div>

        {/* BANKA BİLGİLERİ */}
        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#3b82f6", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <span>💳</span>
            <span>BANKA BİLGİLERİ</span>
          </div>

          <div style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(59,130,246,0.05) 100%)", borderRadius: "12px", padding: 20, border: "1px solid rgba(59,130,246,0.3)" }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 8 }}>👤 SAHİBİNİN ADI</div>
              <input
                type="text"
                placeholder="Ad Soyad"
                value={localIbanSahibi}
                onChange={e => setLocalIbanSahibi(e.target.value)}
                style={{ width: "100%", padding: "12px 16px", background: "var(--bg2)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: "12px", fontSize: 14, outline: "none", color: "#fff" }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#3b82f6";
                  e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.2)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(59,130,246,0.3)";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 8 }}>🧾 IBAN</div>
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{
                  flex: 1,
                  padding: "12px 16px",
                  background: "var(--bg2)",
                  border: "1px solid rgba(59,130,246,0.3)",
                  borderRadius: "12px",
                  fontSize: 15,
                  outline: "none",
                  fontFamily: "monospace",
                  letterSpacing: "1px",
                  color: "transparent",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  cursor: "text"
                }}>
                  <span style={{ color: "#fff" }}>TR</span>
                  <input
                    type="text"
                    value={localIban.replace(/^TR\s*/i, "")}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setLocalIban("TR " + newValue);
                    }}
                    onFocus={(e) => {
                      e.target.select();
                    }}
                    style={{
                      flex: 1,
                      border: "none",
                      outline: "none",
                      background: "transparent",
                      fontSize: 15,
                      fontFamily: "monospace",
                      letterSpacing: "1px",
                      color: "#fff",
                      fontWeight: 700,
                      cursor: "text",
                      lineHeight: "1.2"
                    }}
                  />
                </div>
                <button
                  onClick={() => handleIbanGuncelle(localIban)}
                  style={{
                    padding: "12px 20px",
                    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "12px",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    boxShadow: "0 2px 8px rgba(59,130,246,0.3)"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(59,130,246,0.5)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(59,130,246,0.3)";
                  }}
                >
                  Güncelle
                </button>
              </div>
              {localIban && !localIban.match(/^TR\s*\d+\s*$/i) && (
                <div style={{ fontSize: 11, color: "#fbbf24", marginTop: 6 }}>
                  ⚠️ Tam IBAN formatı: TR + sayılar
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14, background: "linear-gradient(135deg, rgba(251,191,36,0.08) 0%, rgba(251,191,36,0.04) 100%)", border: "1px solid rgba(251,191,36,0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: "#fbbf24" }}>⭐ Pro Üye</div>
            <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>Sınırsız ilan • Öncelikli görünüm</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "var(--font-d)", fontSize: 20, color: "#fbbf24" }}>₺699/ay</div>
            <div style={{ fontSize: 11, color: "#10b981" }}>✓ Aktif</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 20 }}>📁</span>
            <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1.5, color: "#fbbf24" }}>BELGELERİM</span>
          </div>
          {belgeEklendi && (
            <div style={{ fontSize: 12, color: "#10b981", animation: "fadeIn 0.3s" }}>✅ Eklendi!</div>
          )}
        </div>

        {belgeler.map((b) => (
          <div key={b.id} style={{
            background: "var(--bg2)",
            borderRadius: "12px",
            padding: "14px",
            marginBottom: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            border: "1px solid rgba(251,191,36,0.1)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {b.ok ? (
                <span style={{ color: "#10b981", fontSize: 22 }}>✓</span>
              ) : (
                <span style={{ color: "var(--text3)", fontSize: 22 }}>○</span>
              )}
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{b.ad}</div>
                {b.tarih !== "-" && <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>{b.tarih}</div>}
              </div>
            </div>
            <div style={{ fontSize: 11, color: "var(--text3)" }}> {b.tarih}</div>
          </div>
        ))}

        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <input
            ref={dosyaInputRef}
            type="file"
            id={`belge-input`}
            accept="image/*,.pdf"
            style={{ display: "none" }}
          />
          <label htmlFor={`belge-input`} style={{ flex: 1 }}>
            <button className="btn btn-secondary" style={{ width: "100%", fontSize: 13, padding: "12px" }}>
              + Belge Ekle
            </button>
          </label>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 10 }}>
        {[
          { icon: "🔔", text: "Bildirim Ayarları", color: "#fbbf24", action: () => handleNav("bildirim") },
          { icon: "❓", text: "Yardım & Destek", color: "var(--text2)" },
          { icon: "🔒", text: "Gizlilik Politikası", color: "var(--text2)" },
          { icon: "⚙️", text: "Ayarlar", color: "var(--text2)" },
        ].map((item, i) => (
          <div
            key={i}
            onClick={() => item.action && item.action()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "16px 14px",
              borderBottom: i < 3 ? "1px solid rgba(251,191,36,0.1)" : "none",
              cursor: item.action ? "pointer" : "default",
              transition: "background 0.2s",
              borderRadius: i === 0 ? "12px 12px 0 0" : i === 3 ? "0 0 12px 12px" : "0",
              border: "1px solid transparent",
              borderBottom: "none"
            }}
            onMouseEnter={e => {
              if (item.action) {
                e.currentTarget.style.background = "var(--bg2)";
                e.currentTarget.style.borderColor = "rgba(251,191,36,0.1)";
              }
            }}
            onMouseLeave={e => {
              if (item.action) {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.borderColor = "transparent";
                e.currentTarget.style.borderBottom = i < 3 ? "1px solid rgba(251,191,36,0.1)" : "none";
              }
            }}
          >
            <span style={{ fontSize: 22, width: 36 }}>{item.icon}</span>
            <span style={{ fontSize: 14, flex: 1 }}>{item.text}</span>
            <span style={{ color: "var(--text3)" }}>›</span>
          </div>
        ))}
      </div>

      <button onClick={cikisYap} className="btn btn-danger btn-full" style={{ marginTop: 10, padding: "14px" }}>
        🚪 Çıkış Yap
      </button>
    </div>
  );
}

export function IssizIlanlarSayfasi() {
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
