import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ChatSayfasi from "../../components/ChatSayfasi";
import { useApp } from "../../context/AppContext";
import { useMesaj } from "../../context/MesajContext";
import { EmptyState, formatTarih, vadeTarihiniBul, vadeGectiMi } from "../../components/UI";
import { MesajListeKart } from "../../components/MesajListesi";
import DegerlendirmeModal from "../../components/DegerlendirmeModal";
import ProfilKart from "../../components/ProfilKart";
import IlIlceSecici from "../../components/IlIlceSecici";
import { IconMap } from "../../components/Icons";
import { harfFiltre, plakaFiltre, rakamFiltre, yukFiltre, adresFiltre, serbestFiltre } from "../../utils/inputFilters";

export function IlanVerSayfasi() {
  const { ilanEkle, ilanSil } = useApp();
  const { dosyaYukle } = useMesaj();
  const [form, setForm] = useState({
    nereden: "", nereye: "", yuk: "",
    ucret: "",
    kdvEkle: false,
    tarih: "",
    aracTip: "",
    aciklama: "", odemeTuru: "pesin", odemeGun: 0,
    yuklemeKonum: "", bosaltmaKonum: "",
    yuklemeSaatBas: "", yuklemeSaatBit: "",
    bosaltmaSaatBas: "", bosaltmaSaatBit: "",
    faturaBaslik: "", faturaDosya: null
  });
  const [tamam, setTamam] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const gonder = () => {
    if (!form.nereden || !form.nereye || !form.yuk || !form.ucret) {
      alert("Lütfen zorunlu alanları doldurun!");
      return;
    }
    const ucret = Number(form.ucret);

    console.log(`📤 Yeni ilan gönderiliyor:`, { ...form, faturaDosya: form.faturaDosya ? { tip: form.faturaDosya.tip, ad: form.faturaDosya.ad } : null, ucret: ucret, odemeTuru: form.odemeTuru, odemeGun: Number(form.odemeGun) });

    ilanEkle({
      ...form,
      ucret: ucret,
      odemeTuru: form.odemeTuru,
      odemeGun: Number(form.odemeGun)
    });
    setTamam(true);
    setTimeout(() => {
      setTamam(false);
      setForm({
        nereden: "", nereye: "", yuk: "",
        ucret: "",
        kdvEkle: false,
        tarih: "",
        aracTip: "", aciklama: "", odemeTuru: "pesin", odemeGun: 0,
        yuklemeKonum: "", bosaltmaKonum: "",
        yuklemeSaatBas: "", yuklemeSaatBit: "",
        bosaltmaSaatBas: "", bosaltmaSaatBit: "",
        faturaBaslik: "", faturaDosya: null
      });
    }, 2000);
  };

  const faturaSec = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      alert("Fatura dosyası en fazla 3MB olabilir.");
      return;
    }
    try {
      const dosya = await dosyaYukle(file);
      set("faturaDosya", dosya);
    } catch (err) {
      alert("Dosya okunamadı: " + err.message);
    }
  };

  const inputStyle = "input";
  const Label = ({ children, zorunlu }) => (
    <label className="label" style={{ marginBottom: 8 }}>
      {zorunlu ? <>{children} <span style={{ color: "var(--turuncu)", fontSize: 10 }}>*</span></> : children}
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
          <span style={{ fontSize: 20 }}><IconMap.map size={20} className="icon-primary" /></span>
          <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1.5, color: "#fbbf24" }}>GÜZERGAH</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="input-group">
            <Label zorunlu>Nereden</Label>
            <IlIlceSecici
              value={form.nereden}
              onChange={val => set("nereden", val)}
              placeholder="İl seçin..."
              inputStyle={inputStyle}
            />
          </div>
          <div className="input-group">
            <Label zorunlu>Nereye</Label>
            <IlIlceSecici
              value={form.nereye}
              onChange={val => set("nereye", val)}
              placeholder="İl seçin..."
              inputStyle={inputStyle}
            />
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
          <input className={inputStyle} placeholder="Kömür, çelik, gıda..." value={form.yuk} onChange={e => set("yuk", yukFiltre(e.target.value, 80))} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 10 }}>
          <div className="input-group">
            <Label zorunlu>Fiyat (₺)</Label>
            <input className={inputStyle} type="number" placeholder="8500" value={form.ucret} onChange={e => set("ucret", rakamFiltre(e.target.value, 12))} />
          </div>
          <div className="input-group">
            <Label zorunlu>Araç Tipi</Label>
            <select className={inputStyle} value={form.aracTip} onChange={e => set("aracTip", e.target.value)} style={{ cursor: "pointer", background: "var(--bg2)" }}>
              <option value="">Seçin...</option>
              {["TIR", "10 Teker Açık", "10 Teker Tenteli", "Kırkayak Açık", "Kamyonet", "50 NC Kamyon", "Diğer"].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none" }}>
            <input
              type="checkbox"
              checked={form.kdvEkle}
              onChange={e => set("kdvEkle", e.target.checked)}
              style={{ width: 18, height: 18, cursor: "pointer" }}
            />
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text2)" }}>+KDV</span>
          </label>
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
          <textarea className={inputStyle} rows={3} placeholder="Özel şartlar, araç özellikleri..." value={form.aciklama} onChange={e => set("aciklama", serbestFiltre(e.target.value, 500))} style={{ resize: "vertical", lineHeight: 1.6 }} />
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>📍</span>
          <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1.5, color: "#fbbf24" }}>KONUM & SAAT</span>
        </div>
        <div className="input-group">
          <Label>Yükleme Yeri (Adres)</Label>
          <div style={{ display: "flex", gap: 8 }}>
            <input className={inputStyle} placeholder="Yükleme adresini girin..." value={form.yuklemeKonum} onChange={e => set("yuklemeKonum", adresFiltre(e.target.value, 200))} style={{ flex: 1 }} />
            {form.yuklemeKonum && (
              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(form.yuklemeKonum)}`} target="_blank" rel="noopener noreferrer" style={{ padding: "10px 12px", borderRadius: "10px", background: "var(--bg3)", border: "1px solid var(--border2)", color: "#1d4ed8", textDecoration: "none", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 4 }}>
                🗺 Harita
              </a>
            )}
          </div>
        </div>
        <div className="input-group" style={{ marginTop: 10 }}>
          <Label>Yükleme Saati</Label>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input className={inputStyle} type="time" value={form.yuklemeSaatBas} onChange={e => set("yuklemeSaatBas", e.target.value)} style={{ flex: 1 }} />
            <span style={{ color: "var(--text3)", fontSize: 12 }}>—</span>
            <input className={inputStyle} type="time" value={form.yuklemeSaatBit} onChange={e => set("yuklemeSaatBit", e.target.value)} style={{ flex: 1 }} />
          </div>
        </div>
        <div className="input-group" style={{ marginTop: 10 }}>
          <Label>Fatura (Fotoğraf veya PDF)</Label>
          {form.faturaDosya ? (
            <div style={{ border: "1px solid var(--border2)", borderRadius: 12, padding: 10, background: "var(--bg3)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {form.faturaDosya.tip === "img" ? (
                  <img src={form.faturaDosya.veri} alt="Fatura" style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 8 }} />
                ) : (
                  <div style={{ fontSize: 26 }}>📄</div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{form.faturaDosya.ad}</div>
                  <div style={{ fontSize: 11, color: "var(--text3)" }}>{(form.faturaDosya.boyut / 1024).toFixed(0)} KB</div>
                </div>
                <button type="button" onClick={() => set("faturaDosya", null)} style={{ padding: "8px 10px", borderRadius: 8, background: "#fee2e2", color: "#b91c1c", border: "none", fontWeight: 600, fontSize: 12 }}>✕ Kaldır</button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <label style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, padding: "14px 8px", borderRadius: 12, border: "1.5px dashed var(--border2)", background: "var(--bg3)", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                📎 Fatura Yükle
                <span style={{ fontSize: 11, fontWeight: 400, color: "var(--text3)" }}>Fotoğraf veya PDF</span>
                <input type="file" accept="image/*,application/pdf,.pdf" onChange={faturaSec} style={{ display: "none" }} />
              </label>
            </div>
          )}
          <span style={{ fontSize: 11, color: "var(--text3)" }}>Fatura, iş onaylanınca kamyoncuya otomatik gönderilir.</span>
        </div>
        <div className="input-group" style={{ marginTop: 10 }}>
          <Label>Boşaltma Yeri (Adres)</Label>
          <div style={{ display: "flex", gap: 8 }}>
            <input className={inputStyle} placeholder="Boşaltma adresini girin..." value={form.bosaltmaKonum} onChange={e => set("bosaltmaKonum", adresFiltre(e.target.value, 200))} style={{ flex: 1 }} />
            {form.bosaltmaKonum && (
              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(form.bosaltmaKonum)}`} target="_blank" rel="noopener noreferrer" style={{ padding: "10px 12px", borderRadius: "10px", background: "var(--bg3)", border: "1px solid var(--border2)", color: "#1d4ed8", textDecoration: "none", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 4 }}>
                🗺 Harita
              </a>
            )}
          </div>
        </div>
        <div className="input-group" style={{ marginTop: 10 }}>
          <Label>Boşaltma Saati</Label>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input className={inputStyle} type="time" value={form.bosaltmaSaatBas} onChange={e => set("bosaltmaSaatBas", e.target.value)} style={{ flex: 1 }} />
            <span style={{ color: "var(--text3)", fontSize: 12 }}>—</span>
            <input className={inputStyle} type="time" value={form.bosaltmaSaatBit} onChange={e => set("bosaltmaSaatBit", e.target.value)} style={{ flex: 1 }} />
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>💰</span>
          <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1.5, color: "#fbbf24" }}>ÖDEME PLANI</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
          {[
            { tur: "pesin", gun: 0, label: "Peşin", desc: "Hemen tam ödeme", color: "#10b981", ikon: "💰" },
            { tur: "vadeli", gun: 7, label: "7 Gün", desc: "Teslimden 7 gün sonra", color: "#ef4444", ikon: "⚡" },
            { tur: "vadeli", gun: 15, label: "15 Gün", desc: "Teslimden 15 gün sonra", color: "#fbbf24", ikon: "⏰" },
            { tur: "vadeli", gun: 30, label: "30 Gün", desc: "Teslimden 30 gün sonra", color: "#0f172a", ikon: "📅" },
          ].map((opt, idx) => {
            // Seçim karşılaştırması: tur + gun birlikte (çünkü tur "vadeli" 3 seçeneğe ait)
            const secili = form.odemeTuru === opt.tur && Number(form.odemeGun) === opt.gun;
            return (
              <button
                key={`${opt.tur}-${opt.gun}-${idx}`}
                onClick={() => {
                  set("odemeTuru", opt.tur);
                  set("odemeGun", opt.gun);
                }}
                style={{
                  padding: "14px 8px",
                  borderRadius: "12px",
                  border: `2px solid rgba(251,191,36,0.2)`,
                  background: secili ? opt.color : "transparent",
                  color: secili ? "#fff" : "var(--text2)",
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
                <div style={{ fontSize: 22 }}>{opt.ikon}</div>
                <div style={{ color: secili ? "#fff" : opt.color }}>{opt.label}</div>
                <div style={{ fontSize: 10, color: "var(--text3)" }}>{opt.desc}</div>
              </button>
            );
          })}
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
        <EmptyState icon="📋" title="Henüz ilanınız yok" alt="İlan verin, kamyoncular işinize teklif versin." />
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
                    <><IconMap.trash size={16} /> Sil</>
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

export function TekliflerSayfasi({ onChatAc }) {
  const { oturum, konusmaOluştur, ilkMesajiGonder, seferler, bekleyenOnaylariGetir, kamyoncuBasvuruBekleyenleriGetir, ilaniOnayla, ilaniReddet, ilaniptalEt, odemeOnayla, ilanlar, profiliGoster, benimDegerlendirdiklerim } = useApp();
  const [kabulEdilen, setKabulEdilen] = useState(new Set());
  const [seciliSefer, setSeciliSefer] = useState(null);
  const [konusmaIdMap, setKonusmaIdMap] = useState({});
  const [bekleyenOnaylar, setBekleyenOnaylar] = useState([]);
  const [yeniBekleyenler, setYeniBekleyenler] = useState([]);
  const [degerlendirilecek, setDegerlendirilecek] = useState(null);
  const [simdi, setSimdi] = useState(Date.now());

  // Onay iptal süresi: 10 dakika
  const ONEY_IPTAL_SURE_MS = 10 * 60 * 1000;

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

  // İşverenin kendi ilanlarını filtrele
  const kendiIlanlar = ilanlar ? ilanlar.filter(i => i.olusturan_id === oturum?.id) : [];
  const kendiIlanIdleri = new Set(kendiIlanlar.map(i => i.id));

  // Sadece bu işverene ait (kendi ilanına yapılmış) bekleyen seferleri al
  const kendiSeferler = seferler
    ? seferler.filter(s => s.ilan_id && kendiIlanIdleri.has(s.ilan_id))
    : [];
  const mevcutSeferler = kendiSeferler.filter(s => s.durum === "bekliyor");
  const kabulEdilecekler = mevcutSeferler.filter(s => kabulEdilen.has(s?.id));
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
        yuk: s?.yuk,
        nereden: s?.nereden,
        nereye: s?.nereye,
        kamyoncuId: s?.kamyoncu_user_id,
        bilgiler: {
          ad: s.kamyoncu,
          tel: s?.kamyoncu_tel,
          cekiciPlaka: s?.plaka,
          dorsePlaka: s?.dorse_plaka,
          tc_kimlik: s?.kamyoncu_tc
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

    // Bekleyen onay listesini kaldır
    setBekleyenOnaylar(prev => prev.filter(o => o.ilanId !== sefer.ilanId));

    const mesaj = `✓ İş başvurunuz kabul edildi. Gelen bilgiler:\n\n👤 Ad: ${sefer.kamyoncu || sefer.kamyoncu_tc || "Belirtilmedi"}\n📞 Tel: ${sefer.kamyoncuTel || sefer.kamyoncu_tel || "Belirtilmedi"}\n🚚 Çekici Plaka: ${sefer.plaka || "Belirtilmedi"}\n🚐 Dorse Plaka: ${sefer.dorsePlaka || "Belirtilmedi"}\n🆔 TC Kimlik: ${sefer.kamyoncu_tc || "Belirtilmedi"}\n\nŞimdi mesajlaşma üzerinden konuşabiliriz.`;
    mesajlas(sefer, mesaj);
  };

  // Kamyoncu ile konuşma aç (mevcut konuşma varsa onu bulur, yoksa oluşturur)
  const mesajlas = async (sefer, ilkMesaj) => {
    if (!sefer || !oturum?.id) return;

    const konusmaId = await konusmaOluştur({
      userId: oturum.id,
      partnerId: sefer.kamyoncu_user_id || sefer.kamyoncu || sefer.kamyoncu_tc || String(sefer.id),
      partnerAd: sefer.kamyoncu || sefer.kamyoncu_tc || "Kamyoncu",
      partnerRol: "kamyoncu",
      isTrucker: false,
      konusmaTuru: "is",
      ilanId: sefer.ilan_id,
      baslik: `${sefer.yuk} - ${sefer.nereden} → ${sefer.nereye}`,
      resim: "https://api.dicebear.com/7.x/initials/svg?seed=" + String(sefer.kamyoncu || sefer.kamyoncu_tc || "K").substring(0, 2).toUpperCase(),
      bg: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
    });

    if (!konusmaId) {
      console.error('Konuşma açılamadı:', sefer);
      alert('Konuşma açılamadı. Lütfen tekrar deneyin.');
      return;
    }

    setKonusmaIdMap(prev => ({ ...prev, [sefer.id]: konusmaId }));

    if (ilkMesaj) {
      ilkMesajiGonder(konusmaId, ilkMesaj);
    }

    // Konuşmanın listeye yüklenmesi için kısa bir bekleme sonrası chat ekranını aç
    setTimeout(() => {
      if (onChatAc) {
        onChatAc(konusmaId);
      }
    }, 500);
  };

  // Onayı iptal et: sefer tekrar başvuru listesine döner
  const iptalEt = async (sefer) => {
    if (!sefer?.ilan_id) return;
    if (!confirm("Bu onayı iptal etmek istediğinize emin misiniz?\n\nBaşvuru tekrar 'Başvuru Bekleniyor' listesine dönecek.")) return;
    const ok = await ilaniptalEt(sefer.ilan_id);
    if (ok) {
      setKabulEdilen(prev => {
        const yeni = new Set(prev);
        yeni.delete(sefer.id);
        return yeni;
      });
      alert("✅ Onay iptal edildi. Başvuru tekrar listeye döndü.");
    }
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
                    🚚 {typeof o.bilgiler?.cekiciPlaka === 'string' ? o.bilgiler.cekiciPlaka : '—'}<br/>🚐 {typeof o.bilgiler?.dorsePlaka === 'string' ? o.bilgiler.dorsePlaka : '—'}
                  </div>
                </div>
                <div style={{ background: "var(--bg2)", borderRadius: "12px", padding: "12px", textAlign: "center", border: "1px solid rgba(251,191,36,0.1)" }}>
                  <div style={{ fontSize: 10, color: "var(--text3)" }}>Telefon</div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginTop: 4 }}>{typeof o.bilgiler?.tel === 'string' ? o.bilgiler.tel : '—'}</div>
                </div>
                <div style={{ background: "var(--bg2)", borderRadius: "12px", padding: "12px", textAlign: "center", border: "1px solid rgba(251,191,36,0.1)" }}>
                  <div style={{ fontSize: 10, color: "var(--text3)" }}>TC Kimlik</div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginTop: 4 }}>{typeof o.bilgiler?.tc_kimlik === 'string' ? o.bilgiler.tc_kimlik : '—'}</div>
                </div>
              </div>

              {(o.bilgiler?.kamyoncuId || o?.kamyoncuId || o?.kamyoncu_user_id) && (
                <button
                  onClick={() => profiliGoster(o.bilgiler?.kamyoncuId || o?.kamyoncuId || o?.kamyoncu_user_id)}
                  style={{ width: "100%", padding: "10px", marginBottom: 8, background: "var(--bg1)", border: "1px solid rgba(251,191,36,0.3)", borderRadius: "12px", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#f59e0b" }}
                >
                  👤 Kamyoncu Profilini Gör
                </button>
              )}

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => ilaniOnayla(o.ilanId, o.bilgiler.ad, o.bilgiler.tel, o.bilgiler.cekiciPlaka, o.bilgiler.dorsePlaka, o.bilgiler.tc_kimlik, oturum?.user?.id)}
                  className="btn btn-primary"
                  style={{ flex: 1, padding: "12px", fontSize: 13 }}
                >
                  ✓ Kabul Et
                </button>
                <button
                  onClick={async () => {
                    if (!confirm("Bu başvuruyu reddetmek istediğine emin misin?")) return;
                    await ilaniReddet(o.ilanId);
                    setBekleyenOnaylar(prev => prev.filter(i => i.ilanId !== o.ilanId));
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
            <div key={s?.id} className="card" style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ fontSize: 32 }}>🚛</div>
                  <div>
                    <div style={{ fontSize: 16, color: "#fbbf24", fontWeight: 600 }}>{s?.yuk}</div>
                    <div style={{ fontSize: 10, color: "var(--text3)", letterSpacing: 1.5 }}>Yük Tipi</div>
                  </div>
                </div>
                <div style={{ background: s?.durum === "teslima_bekleniyor" ? "linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(245,158,11,0.1) 100%)" : "linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(16,185,129,0.1) 100%)", color: s?.durum === "teslima_bekleniyor" ? "#f59e0b" : "#10b981", padding: "6px 12px", borderRadius: "20px", fontSize: 11, fontWeight: 600, border: `1px solid ${s?.durum === "teslima_bekleniyor" ? "rgba(245,158,11,0.3)" : "rgba(16,185,129,0.3)"}` }}>
                  {s?.durum === "teslima_bekleniyor" ? "⏳ Teslim Bekl." : "✓ Yolda"}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{s?.nereden}</span>
                <span style={{ color: "#fbbf24" }}>→</span>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{s?.nereye}</span>
              </div>
              {s?.kamyoncu_user_id && (
                <div style={{ marginBottom: 10, fontSize: 12, color: "var(--text3)", cursor: "pointer" }} onClick={() => profiliGoster(s.kamyoncu_user_id)}>
                  🚛 {s.kamyoncu || "Kamyoncu"} <span style={{ color: "#fbbf24", fontWeight: 600 }}>• Profili Gör</span>
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
                <div style={{ background: "var(--bg2)", borderRadius: "12px", padding: "12px", textAlign: "center", border: "1px solid rgba(251,191,36,0.1)" }}>
                  <div style={{ fontSize: 10, color: "var(--text3)" }}>Plaka</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#1d4ed8" }}>{typeof s?.plaka === 'string' ? s?.plaka : '—'}</div>
                </div>
                <div style={{ background: "var(--bg2)", borderRadius: "12px", padding: "12px", textAlign: "center", border: "1px solid rgba(251,191,36,0.1)" }}>
                  <div style={{ fontSize: 10, color: "var(--text3)" }}>Ücret</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#fbbf24" }}>₺{typeof s?.ucret === 'number' ? s?.ucret.toLocaleString() : '0'}</div>
                  <div style={{ fontSize: 9, color: "#1d4ed8", marginTop: 2 }}>{!s?.odemeGun || s?.odemeGun === 0 || s?.odemeTuru === "pesin" ? "💰 Peşin" : `${s?.odemeGun} Gün`}</div>
                  {s?.kdvOrani > 0 && <div style={{ fontSize: 9, color: "#10b981", marginTop: 1 }}>+KDV</div>}
                </div>
              </div>
              {s?.durum === "teslima_bekleniyor" && (() => {
                const vade = vadeTarihiniBul(s);
                if (!vade) {
                  return (
                    <div style={{ marginBottom: 10, padding: "10px 12px", borderRadius: "10px", fontSize: 12, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", color: "#f59e0b", display: "flex", alignItems: "center", gap: 6 }}>
                      ⏳ Kamyoncu işi teslim etti, ödeme bekleniyor.
                    </div>
                  );
                }
                const gecti = vadeGectiMi(vade);
                return (
                  <div style={{ marginBottom: 10, padding: "10px 12px", borderRadius: "10px", fontSize: 12, background: gecti ? "rgba(239,68,68,0.08)" : "rgba(245,158,11,0.08)", border: `1px solid ${gecti ? "rgba(239,68,68,0.3)" : "rgba(245,158,11,0.25)"}`, color: gecti ? "#ef4444" : "#f59e0b", display: "flex", alignItems: "center", gap: 6 }}>
                    {gecti ? "⚠️ Ödeme vadesi geçti" : "⏳ Ödeme vadesi"} — {formatTarih(vade)}
                  </div>
                );
              })()}
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => mesajlas(s)}
                  className="btn btn-primary"
                  style={{ flex: 1, padding: "12px", fontSize: 13 }}
                >
                  💬 Mesajlaş
                </button>
                {s?.durum === "teslima_bekleniyor" && (
                  <button
                    onClick={async () => {
                      if (!confirm(`${s?.yuk || "Bu iş"} için ödemeyi onaylıyor musunuz?`)) return;
                      await odemeOnayla(s?.id);
                      alert("✅ Ödeme onaylandı! Kamyoncuya bildirim gönderildi.");
                    }}
                    className="btn btn-success"
                    style={{ flex: 1, padding: "12px", fontSize: 13 }}
                  >
                    💰 Ödemeyi Onayla
                  </button>
                )}
                {(() => {
                  const onayZamaniMs = s?.onay_zamani ? new Date(s.onay_zamani).getTime() : null;
                  const kalanMs = onayZamaniMs ? ONEY_IPTAL_SURE_MS - (simdi - onayZamaniMs) : 0;
                  if (!onayZamaniMs || kalanMs <= 0) return null;
                  return (
                    <button
                      onClick={() => iptalEt(s)}
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
              {(s?.teslim || s?.iban) && (
                <div style={{ marginTop: 12, background: "var(--bg2)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: "12px", padding: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: "#10b981", marginBottom: 10 }}>KAMYONCU ÖDEME BİLGİLERİ</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
                    {(() => {
                      const odemeSahibi = s?.teslim?.iban_sahibi || s?.iban_sahibi || s?.ibanSahibi || "";
                      const odemeIban = s?.teslim?.iban || s?.iban || "";
                      return (
                        <>
                          {odemeSahibi && <div>👤 <span style={{ color: "var(--text3)" }}>Ad Soyad:</span> <b>{odemeSahibi}</b></div>}
                          {odemeIban && <div>💳 <span style={{ color: "var(--text3)" }}>IBAN:</span> <b style={{ fontFamily: "monospace", fontSize: 12, wordBreak: "break-all" }}>{odemeIban}</b></div>}
                        </>
                      );
                    })()}
                    {s?.teslim?.evrak && (s.teslim.evrak.tip === "img" ? (
                      <div>
                        <div style={{ color: "var(--text3)", marginBottom: 6 }}>📎 Teslim Evrağı:</div>
                        <img src={s.teslim.evrak.veri} alt="Teslim evrağı" style={{ maxWidth: "100%", borderRadius: "10px", border: "1px solid rgba(251,191,36,0.2)" }} />
                      </div>
                    ) : (
                      <a href={s.teslim.evrak.veri} download={s.teslim.evrak.ad || "teslim_evragi"} style={{ color: "#1d4ed8", fontWeight: 600, textDecoration: "underline" }}>📎 Teslim Evrağı: {s.teslim.evrak.ad}</a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </>
      )}

      {kabulEdilecekler.length > 0 && (
        <>
          {aktifSeferler.length > 0 && <div style={{ height: 20 }}></div>}
          <div className="section-title">GELEN TEKLİFLER ({kabulEdilecekler.length})</div>
          {kabulEdilecekler.map(s => (
            <div key={s?.id} className="card" style={{ marginBottom: 14, border: "1px solid rgba(251,191,36,0.3)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 46, height: 46, borderRadius: "50%", background: "linear-gradient(135deg, var(--guldum-gradient), var(--purple-gradient))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "#fff", flexShrink: 0 }}>✓</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 15, color: "#fbbf24" }}>{s.kamyoncu}</div>
                  <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>₺{s?.ucret.toLocaleString()} • {formatTarih(s.tarih)}</div>
                </div>
                <button
                  onClick={() => mesajlas(s, `✓ İş başvurunuz kabul edildi. Gelen bilgiler:\n\n👤 Ad: ${s?.kamyoncu || s?.kamyoncu_tc || "Belirtilmedi"}\n📞 Tel: ${s?.kamyoncuTel || s?.kamyoncu_tel || "Belirtilmedi"}\n🚚 Çekici Plaka: ${s?.plaka || "Belirtilmedi"}\n🚐 Dorse Plaka: ${s?.dorsePlaka || "Belirtilmedi"}\n🆔 TC Kimlik: ${s?.kamyoncu_tc || "Belirtilmedi"}\n\nŞimdi mesajlaşma üzerinden konuşabiliriz.`)}
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
        <EmptyState icon="📬" title="Henüz teklif veya aktif iş yok" alt="İlan verin; kamyoncular işinize başvuracak, bekleyen teklifler burada görünecek." />
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

  // Oturum değişince konuşmaları yeniden yükle (auth listener fallback)
  useEffect(() => {
    if (oturum?.id) {
      console.log('📨 İşveren MesajlarSayfasi: manual load for', oturum.id);
      loadConversations?.(oturum.id);
    }
  }, [oturum?.id, loadConversations]);

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
      setSecili(null);
      return null;
    }
    return <ChatSayfasi konusmaId={secili} onGeri={() => setSecili(null)} />;
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

export function IssizProfilSayfasi() {
  return <ProfilKart rol="issiz" />;
}


export function IssizIlanlarSayfasi() {
  const { oturum, ilanlar, ilanSil, seferler, profiliGoster, benimDegerlendirdiklerim } = useApp();
  const [silinenId, setSilinenId] = useState(null);
  const [toast, setToast] = useState(null);
  const [gosterGeçmiş, setGosterGeçmiş] = useState(false);
  const [degerlendirilecek, setDegerlendirilecek] = useState(null);

  // Sadece aktif ve alindi olanları ana listede göster; silindi olanı gizle.
  // (Geçmiş bölümünde ayrıca gösterilecek.)
  const mevcutIlanlar = ilanlar.filter(i =>
    i.olusturan_id === oturum?.id && i.durum !== "silindi"
  );
  const aktifSayi = mevcutIlanlar.filter(i => i.durum === "aktif").length;

  // GEÇMİŞ İŞLER: Bu işverenin verdiği tüm işler (seferler tablosundan)
  // - Kamyonçunun adı, plakası, telefonu, teslim durumu, ücret, teslim tarihi
  const gecmisIsler = (seferler || [])
    .filter(s => s.olusturan_id === oturum?.id)
    .sort((a, b) => new Date(b.olusturma_zamani || b.tarih || 0) - new Date(a.olusturma_zamani || a.tarih || 0));

  const tamamlananSayi = gecmisIsler.filter(s => s.durum === "tamamlandı" || s.durum === "tamamlandi" || s.durum === "odendi").length;
  const devamEdenSayi = gecmisIsler.filter(s => s.durum !== "tamamlandı" && s.durum !== "tamamlandi" && s.durum !== "odendi").length;

  const gosterToast = (tur, metin) => {
    setToast({ tur, metin });
    setTimeout(() => setToast(null), 2500);
  };

  const handleSil = async (ilan) => {
    if (!confirm(`"${ilan.yuk}" ilanını silmek istediğine emin misin?\n\nİlan kamyoncuların listesinden kalkar ama devam eden seferler ve geçmiş işler korunur.`)) return;
    setSilinenId(ilan.id);
    try {
      await ilanSil(ilan.id);
      gosterToast("ok", "✓ İlan silindi (geçmiş işler korundu)");
    } catch (err) {
      gosterToast("hata", "✗ Silme hatası: " + err.message);
    } finally {
      setTimeout(() => setSilinenId(null), 600);
    }
  };

  return (
    <div className="scroll-content">
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 70, left: "50%", transform: "translateX(-50%)",
          padding: "12px 20px",
          background: toast.tur === "ok" ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" : "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
          color: "#fff", borderRadius: "12px", fontSize: 13, fontWeight: 700,
          boxShadow: "0 8px 24px rgba(0,0,0,0.3)", zIndex: 1000,
          animation: "fadeIn 0.3s"
        }}>
          {toast.metin}
        </div>
      )}

      {/* Header */}
      <div className="section-title">
        İLANLARIM ({mevcutIlanlar.length})
      </div>

      <div className="card" style={{ marginBottom: 14, padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#fbbf24", fontFamily: "var(--font-d)" }}>
              {aktifSayi} <span style={{ fontSize: 13, color: "var(--text3)" }}>aktif</span>
            </div>
            <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2, letterSpacing: 1, textTransform: "uppercase" }}>
              Toplam {mevcutIlanlar.length} ilan
            </div>
          </div>
          <div style={{ fontSize: 40 }}>📋</div>
        </div>
      </div>

      {mevcutIlanlar.length === 0 ? (
        <EmptyState icon="📭" title="Henüz ilanın yok" alt="'İlan Ver' sekmesinden yeni ilan oluştur." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {mevcutIlanlar.map(ilan => {
            const siliniyor = silinenId === ilan.id;
            return (
              <div key={ilan.id} className="card" style={{
                marginBottom: 0,
                padding: 16,
                border: ilan.durum === "aktif"
                  ? "1px solid rgba(251,191,36,0.3)"
                  : "1px solid rgba(139,92,246,0.3)",
                opacity: siliniyor ? 0.5 : 1,
                transform: siliniyor ? "scale(0.95)" : "scale(1)",
                transition: "all 0.3s ease",
                position: "relative",
                overflow: "hidden"
              }}>
                {/* Sol renk şeridi */}
                <div style={{
                  position: "absolute", left: 0, top: 0, bottom: 0, width: 4,
                  background: ilan.durum === "aktif"
                    ? "linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%)"
                    : "linear-gradient(180deg, #8b5cf6 0%, #6366f1 100%)"
                }} />

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="display" style={{ fontSize: 18, color: "#fbbf24" }}>{ilan.yuk}</div>
                    <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
                      <span>📍 {ilan.nereden}</span>
                      <span style={{ color: "var(--text3)" }}>→</span>
                      <span>🎯 {ilan.nereye}</span>
                    </div>
                  </div>
                  <span style={{
                    padding: "5px 12px",
                    borderRadius: "20px",
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    whiteSpace: "nowrap",
                    background: ilan.durum === "aktif"
                      ? "linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(16,185,129,0.1) 100%)"
                      : "linear-gradient(135deg, rgba(139,92,246,0.2) 0%, rgba(139,92,246,0.1) 100%)",
                    color: ilan.durum === "aktif" ? "#10b981" : "#a78bfa",
                    border: `1px solid ${ilan.durum === "aktif" ? "rgba(16,185,129,0.3)" : "rgba(139,92,246,0.3)"}`
                  }}>
                    {ilan.durum === "aktif" ? "✓ Aktif" : "● Alındı"}
                  </span>
                </div>

                <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, padding: "4px 10px", background: "var(--bg3)", borderRadius: "8px", color: "var(--text2)" }}>
                    📅 {formatTarih(ilan.tarih)}
                  </span>
                  <span style={{ fontSize: 11, padding: "4px 10px", background: "var(--bg3)", borderRadius: "8px", color: "var(--text2)" }}>
                    🚛 {ilan.aracTip || "Belirtilmedi"}
                  </span>
                  {!ilan.odemeGun || ilan.odemeGun === 0 ? (
                    <span style={{ fontSize: 11, padding: "4px 10px", background: "var(--bg3)", borderRadius: "8px", color: "#10b981" }}>
                      💰 Peşin
                    </span>
                  ) : (
                    <span style={{ fontSize: 11, padding: "4px 10px", background: "var(--bg3)", borderRadius: "8px", color: "var(--text2)" }}>
                      ⏰ {ilan.odemeGun} Gün Vadeli
                    </span>
                  )}
                </div>

                {/* Açıklama — yanlışlıkla boş kaydedilenler için fallback */}
                {ilan.aciklama && (
                  <div style={{
                    fontSize: 12,
                    color: "var(--text2)",
                    lineHeight: 1.5,
                    background: "var(--bg3)",
                    padding: "8px 10px",
                    borderRadius: 8,
                    marginBottom: 12,
                    border: "1px solid var(--border)",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden"
                  }}>
                    📝 {ilan.aciklama}
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTop: "1px solid var(--border)" }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#fbbf24", fontFamily: "var(--font-d)" }}>
                      ₺{Number(ilan.ucret || 0).toLocaleString("tr-TR")}
                    </div>
                    {ilan.kdvOrani > 0 && <div style={{ fontSize: 10, color: "#10b981", marginTop: 2 }}>+KDV</div>}
                  </div>

                  <button
                    onClick={() => handleSil(ilan)}
                    disabled={siliniyor}
                    style={{
                      padding: "10px 18px",
                      background: "linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(239,68,68,0.08) 100%)",
                      color: "#ef4444",
                      border: "1px solid rgba(239,68,68,0.3)",
                      borderRadius: "10px",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: siliniyor ? "not-allowed" : "pointer",
                      opacity: siliniyor ? 0.6 : 1
                    }}
                  >
                    {siliniyor ? "Siliniyor..." : "🗑️ Sil"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ============ GEÇMİŞ İŞLER BÖLÜMÜ ============ */}
      {/* İşverenin daha önce kime iş verdiğini gösterir. Seferler tablosundan. */}
      <div style={{ marginTop: 24 }}>
        <button
          onClick={() => setGosterGeçmiş(v => !v)}
          style={{
            width: "100%",
            padding: "14px 16px",
            background: gosterGeçmiş
              ? "linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(99,102,241,0.08) 100%)"
              : "var(--bg2)",
            border: "1px solid rgba(139,92,246,0.3)",
            borderRadius: 12,
            color: "#a78bfa",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            letterSpacing: 0.5
          }}
        >
          <span>📚 GEÇMİŞ İŞLER ({gecmisIsler.length})</span>
          <span style={{ fontSize: 11, color: "var(--text3)", fontWeight: 600 }}>
            {tamamlananSayi} tamamlandı · {devamEdenSayi} devam ediyor
          </span>
        </button>

        {gosterGeçmiş && (
          <div style={{ marginTop: 12 }}>
            {gecmisIsler.length === 0 ? (
              <EmptyState icon="🗂️" title="Henüz geçmiş iş yok" alt="Tamamlanan seferleriniz burada listelenecek." />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {gecmisIsler.map(sefer => {
                  const tamamlandi = sefer.durum === "tamamlandı";
                  return (
                    <div key={sefer.id} className="card" style={{
                      padding: 14,
                      border: tamamlandi
                        ? "1px solid rgba(16,185,129,0.25)"
                        : "1px solid rgba(251,191,36,0.25)",
                      position: "relative",
                      overflow: "hidden"
                    }}>
                      <div style={{
                        position: "absolute", left: 0, top: 0, bottom: 0, width: 4,
                        background: tamamlandi
                          ? "linear-gradient(180deg, #10b981 0%, #059669 100%)"
                          : "linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%)"
                      }} />

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 15, fontWeight: 700, color: "#fbbf24" }}>{sefer.yuk}</div>
                          <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 3 }}>
                            📍 {sefer.nereden} → 🎯 {sefer.nereye}
                          </div>
                        </div>
                        <span style={{
                          padding: "4px 10px",
                          borderRadius: 20,
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          whiteSpace: "nowrap",
                          background: tamamlandi
                            ? "linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(16,185,129,0.1) 100%)"
                            : "linear-gradient(135deg, rgba(251,191,36,0.2) 0%, rgba(251,191,36,0.1) 100%)",
                          color: tamamlandi ? "#10b981" : "#fbbf24",
                          border: tamamlandi
                            ? "1px solid rgba(16,185,129,0.3)"
                            : "1px solid rgba(251,191,36,0.3)"
                        }}>
                          {tamamlandi ? "✓ Tamamlandı" : "🚛 Devam Ediyor"}
                        </span>
                      </div>

                      {/* Kamyoncu bilgileri - işverenin kime iş verdiğini gösterir */}
                      <div style={{
                        background: "var(--bg3)",
                        borderRadius: 10,
                        padding: 10,
                        fontSize: 12,
                        color: "var(--text2)",
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "6px 12px"
                      }}>
                        <div style={{ cursor: sefer.kamyoncu_user_id ? "pointer" : "default" }} onClick={() => sefer.kamyoncu_user_id && profiliGoster(sefer.kamyoncu_user_id)}>
                          🚛 <strong>{sefer.kamyoncu || "—"}</strong>
                          {sefer.kamyoncu_user_id && <span style={{ color: "#fbbf24", fontWeight: 600 }}> • Profili Gör</span>}
                        </div>
                        <div>📌 {sefer.plaka || "—"}</div>
                        {sefer.kamyoncu_tel && (
                          <div style={{ gridColumn: "span 2" }}>
                            📞 <a href={`tel:${sefer.kamyoncu_tel}`} style={{ color: "var(--text2)" }}>
                              {sefer.kamyoncu_tel}
                            </a>
                          </div>
                        )}
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, fontSize: 12 }}>
                        <div style={{ color: "var(--text3)" }}>
                          {sefer.teslim_tarihi
                            ? `Teslim: ${formatTarih(sefer.teslim_tarihi)}`
                            : `Tarih: ${formatTarih(sefer.tarih)}`}
                        </div>
                        <div style={{ fontWeight: 700, color: "#fbbf24", fontSize: 14 }}>
                          ₺{Number(sefer.ucret || 0).toLocaleString("tr-TR")}
                        </div>
                      </div>

                      {sefer.odeme_durumu === "odendi" && (
                        <div style={{ marginTop: 8, fontSize: 11, color: "#10b981" }}>
                          💰 Ödeme yapıldı{sefer.odeme_tarihi ? ` (${formatTarih(sefer.odeme_tarihi)})` : ""}
                        </div>
                      )}
                      {(sefer.durum === "odendi" || sefer.durum === "tamamlandı") && sefer.kamyoncu_user_id && !benimDegerlendirdiklerim.has(sefer.id) && (
                        <button
                          onClick={() => setDegerlendirilecek(sefer)}
                          style={{ width: "100%", marginTop: 10, padding: "11px", background: "linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(245,158,11,0.08) 100%)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "12px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                        >
                          ⭐ Seferi Değerlendir
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {degerlendirilecek && (
        <DegerlendirmeModal
          hedefId={degerlendirilecek.kamyoncu_user_id}
          hedefAd={degerlendirilecek.kamyoncu || "Kamyoncu"}
          seferId={degerlendirilecek.id}
          seferOzet={`${degerlendirilecek.yuk || ""} · ${degerlendirilecek.nereden || ""} → ${degerlendirilecek.nereye || ""}`}
          onKapat={() => setDegerlendirilecek(null)}
        />
      )}
    </div>
  );
}
