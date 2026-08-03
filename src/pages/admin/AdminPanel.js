import { useState, useEffect, useMemo } from "react";
import { useApp } from "../../context/AppContext";
import { supabase } from "../../supabaseClient";
import { IconMap } from "../../components/Icons";
import { formatTarih, vadeTarihiniBul, vadeGectiMi, EmptyState } from "../../components/UI";

const menu = [
  { key: "ozet", icon: "activity", label: "Özet", renk: "#1d4ed8" },
  { key: "ilanlar", icon: "file", label: "İlanlar", renk: "#f59e0b" },
  { key: "seferler", icon: "map", label: "Seferler", renk: "#10b981" },
  { key: "kullanicilar", icon: "users", label: "Kullanıcılar", renk: "#8b5cf6" },
  { key: "belgeler", icon: "shield", label: "Belgeler", renk: "#0ea5e9" },
  { key: "gelir", icon: "creditcard", label: "Gelir", renk: "#059669" },
  { key: "ihtilaflar", icon: "alert", label: "İhtilaflar", renk: "#ea580c" },
  { key: "ayarlar", icon: "settings", label: "Ayarlar", renk: "#475569" },
];

const durumEtiket = {
  bekliyor: { t: "Bekliyor", r: "#f59e0b", b: "rgba(245,158,11,0.12)" },
  yolda: { t: "Yolda", r: "#3b82f6", b: "rgba(59,130,246,0.12)" },
  teslima_bekleniyor: { t: "Teslim Bekleniyor", r: "#f59e0b", b: "rgba(245,158,11,0.12)" },
  tamamlandı: { t: "Tamamlandı", r: "#10b981", b: "rgba(16,185,129,0.12)" },
  tamamlandi: { t: "Tamamlandı", r: "#10b981", b: "rgba(16,185,129,0.12)" },
  odendi: { t: "Ödendi", r: "#10b981", b: "rgba(16,185,129,0.12)" },
  aktif: { t: "Aktif", r: "#10b981", b: "rgba(16,185,129,0.12)" },
  pasif: { t: "Pasif", r: "#ef4444", b: "rgba(239,68,68,0.12)" },
  silindi: { t: "Silindi", r: "#ef4444", b: "rgba(239,68,68,0.12)" },
};

const Rozet = ({ durum }) => {
  const d = durumEtiket[durum] || { t: durum || "—", r: "var(--text3)", b: "var(--bg3)" };
  return (
    <span style={{ background: d.b, color: d.r, padding: "4px 10px", borderRadius: "20px", fontSize: 11, fontWeight: 700, display: "inline-block", whiteSpace: "nowrap" }}>
      {d.t}
    </span>
  );
};

const StatKart = ({ ikon, val, lbl, renk, alt, onClick }) => (
  <div onClick={onClick} style={{
    background: "var(--bg1)", border: "1px solid var(--border)", borderRadius: 18,
    padding: "16px 18px", boxShadow: "0 4px 18px rgba(15,23,42,0.05)",
    display: "flex", flexDirection: "column", gap: 2, position: "relative", overflow: "hidden",
    cursor: onClick ? "pointer" : "default", transition: "transform 0.2s, box-shadow 0.2s"
  }}>
    <div style={{ position: "absolute", top: -18, right: -18, width: 76, height: 76, borderRadius: "50%", background: `${renk}10`, filter: "blur(14px)" }} />
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
      <span style={{ color: renk, fontSize: 15, opacity: 0.85 }}>{ikon}</span>
      <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.2, color: "var(--text3)", textTransform: "uppercase" }}>{lbl}</span>
    </div>
    <div style={{ fontSize: 26, fontWeight: 900, color: renk, lineHeight: 1.15, letterSpacing: 0.5 }}>{val}</div>
    {alt && <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 3 }}>{alt}</div>}
  </div>
);

const Ara = ({ deger, setDeger, yer, ikon = "🔍", stil }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: 8,
    background: "var(--bg1)", border: "1px solid var(--border)", borderRadius: 14,
    padding: "0 14px", boxShadow: "0 2px 10px rgba(15,23,42,0.04)", ...stil
  }}>
    <span style={{ fontSize: 15, opacity: 0.6 }}>{ikon}</span>
    <input
      value={deger}
      onChange={e => setDeger(e.target.value)}
      placeholder={yer}
      style={{ flex: 1, background: "none", border: "none", outline: "none", padding: "11px 0", fontSize: 13, color: "var(--text)" }}
    />
    {deger && <button onClick={() => setDeger("")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "var(--text3)" }}>✕</button>}
  </div>
);

const Modal = ({ baslik, onKapat, genislik = 520, children }) => (
  <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(15,23,42,0.5)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, animation: "fadeIn 0.2s ease" }} onClick={onKapat}>
    <div onClick={e => e.stopPropagation()} style={{
      width: "100%", maxWidth: genislik, maxHeight: "88vh", overflowY: "auto",
      background: "var(--bg1)", borderRadius: 22, boxShadow: "0 24px 80px rgba(15,23,42,0.25)",
      border: "1px solid var(--border)", animation: "slideUp 0.28s cubic-bezier(0.4,0,0.2,1)"
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, background: "var(--bg1)", borderRadius: "22px 22px 0 0", zIndex: 2 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", letterSpacing: 0.3 }}>{baslik}</div>
        <button onClick={onKapat} style={{ width: 32, height: 32, borderRadius: 10, background: "var(--bg2)", border: "1px solid var(--border)", cursor: "pointer", color: "var(--text3)", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
      </div>
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  </div>
);

const TarafKarti = ({ baslik, kullanici, renk }) => {
  const tel = kullanici?.telefon;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 13px", background: "var(--bg2)", borderRadius: 12, border: "1px solid var(--border)" }}>
      <div style={{ width: 38, height: 38, borderRadius: "50%", background: renk || "var(--bg3)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, flexShrink: 0 }}>
        {(kullanici?.ad || "?")[0].toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, color: "var(--text3)", textTransform: "uppercase" }}>{baslik}</div>
        <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {kullanici?.ad || "—"} <span style={{ fontSize: 10, fontWeight: 600, color: "var(--text3)" }}>· {kullanici ? rolBulK(kullanici) : ""}</span>
        </div>
        <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 1 }}>
          📍 {kullanici?.sehir || "Şehir yok"} · {tel || "Telefon yok"}
        </div>
      </div>
      {tel && (
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <a href={`tel:${tel}`} style={{ textDecoration: "none", ...eylemBtnSabit("aktif") }}>📞 Ara</a>
          <button
            onClick={() => { if (navigator.clipboard) navigator.clipboard.writeText(tel); }}
            style={eylemBtnSabit("detay")}
            title={tel}
          >📋</button>
        </div>
      )}
    </div>
  );
};

const rolBulK = (k) => {
  const r = k.role || k.rol || "—";
  return r === "kamyoncu" ? "Kamyoncu" : r === "issiz" ? "İşveren" : r === "admin" ? "Admin" : r;
};

const eylemBtnSabit = (tur) => {
  const map = {
    aktif: { bg: "rgba(16,185,129,0.1)", c: "#10b981", b: "rgba(16,185,129,0.3)" },
    pasif: { bg: "rgba(245,158,11,0.1)", c: "#f59e0b", b: "rgba(245,158,11,0.3)" },
    askiya: { bg: "rgba(239,68,68,0.1)", c: "#ef4444", b: "rgba(239,68,68,0.3)" },
    sil: { bg: "rgba(239,68,68,0.08)", c: "#ef4444", b: "rgba(239,68,68,0.25)" },
    detay: { bg: "rgba(29,78,216,0.08)", c: "#1d4ed8", b: "rgba(29,78,216,0.25)" },
  };
  const s = map[tur] || map.detay;
  return { fontSize: 11, fontWeight: 700, padding: "7px 12px", borderRadius: 9, cursor: "pointer", background: s.bg, color: s.c, border: "1px solid " + s.b, whiteSpace: "nowrap", transition: "all 0.15s" };
};

const Toast = ({ mesaj }) => {
  if (!mesaj) return null;
  return (
    <div style={{
      position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 400,
      background: "var(--navy)", color: "#fff", padding: "13px 22px", borderRadius: 14,
      fontSize: 13, fontWeight: 600, boxShadow: "0 12px 40px rgba(15,23,42,0.35)",
      display: "flex", alignItems: "center", gap: 8, animation: "slideUp 0.3s cubic-bezier(0.4,0,0.2,1)",
      maxWidth: "calc(100vw - 32px)"
    }}>
      {mesaj}
    </div>
  );
};

export default function AdminPanel() {
  const { oturum, ilanlar, seferler, kullanicilar, ilanSil, odemeOnayla, cikisYap, ihtilaflar, ihtilafCoz, kullaniciDurumuGuncelle, kullaniciRolunuGuncelle, kullaniciSil, ilanDurumuGuncelle, seferDurumuGuncelle, bildirimGonder, duyuruGonder } = useApp();

  const [aktif, setAktif] = useState("ozet");
  const [mobilMenu, setMobilMenu] = useState(false);
  const [mobil, setMobil] = useState(() => typeof window !== "undefined" && window.innerWidth < 900);
  const [toast, setToast] = useState(null);

  const [ilanAra, setIlanAra] = useState("");
  const [ilanFiltre, setIlanFiltre] = useState("aktif");
  const [seferAra, setSeferAra] = useState("");
  const [seferFiltre, setSeferFiltre] = useState("tumu");
  const [kullaniciAra, setKullaniciAra] = useState("");
  const [kullaniciRolFiltre, setKullaniciRolFiltre] = useState("tumu");
  const [belgeFiltre, setBelgeFiltre] = useState("bekliyor");

  const [seciliKullanici, setSeciliKullanici] = useState(null);
  const [mesajModal, setMesajModal] = useState(null);
  const [mesajMetni, setMesajMetni] = useState("");
  const [duyuruModal, setDuyuruModal] = useState(false);
  const [duyuruBaslik, setDuyuruBaslik] = useState("");
  const [duyuruIcerik, setDuyuruIcerik] = useState("");
  const [ihtilafCozulen, setIhtilafCozulen] = useState(null);
  const [ihtilafNotu, setIhtilafNotu] = useState("");
  const [silinecek, setSilinecek] = useState(null);
  const [belgeler, setBelgeler] = useState([]);
  const [belgelerYukleniyor, setBelgelerYukleniyor] = useState(false);
  const [ayarlar, setAyarlar] = useState({
    sms: true, eposta: true, belgeZorunlu: false, bakimModu: false, bakimMesaji: ""
  });
  const [rotaDegisecek, setRotaDegisecek] = useState(null);
  const [yeniRol, setYeniRol] = useState("kamyoncu");

  useEffect(() => {
    const onResize = () => setMobil(window.innerWidth < 900);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => { if (aktif === "belgeler") belgeleriGetir(); }, [aktif]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  const ilanlarList = ilanlar || [];
  const seferlerList = seferler || [];
  const kullanicilarList = kullanicilar || [];
  const ihtilaflarList = ihtilaflar || [];

  const aktifIlanSayisi = ilanlarList.filter(i => i.durum === "aktif").length;
  const aktifSeferSayisi = seferlerList.filter(s => s.durum === "yolda" || s.durum === "teslima_bekleniyor").length;
  const kamyoncuSayisi = kullanicilarList.filter(k => (k.role || k.rol) === "kamyoncu").length;
  const issizSayisi = kullanicilarList.filter(k => (k.role || k.rol) === "issiz").length;
  const gecikenOdemeler = seferlerList.filter(s => s.durum === "teslima_bekleniyor" && vadeGectiMi(vadeTarihiniBul(s)));
  const bekleyenOdemeSayisi = seferlerList.filter(s => s.durum === "teslima_bekleniyor" && s.odeme_durumu !== "odendi").length;
  const acikIhtilafSayisi = ihtilaflarList.filter(i => i.durum === "acik").length;

  const rolBul = (k) => (k.role || k.rol || "—");
  const adBul = (uid) => kullanicilarList.find(k => k.id === uid)?.ad || "—";
  const kullaniciBul = (uid) => kullanicilarList.find(k => k.id === uid) || null;

  // İhtilafın iki tarafını bul: açan + karşı taraf (hedef_id veya seferden)
  const ihtilafTaraflar = (i) => {
    const sefer = seferlerList.find(s => s.id === i.sefer_id);
    let digerId = i.hedef_id || null;
    if (!digerId && sefer) {
      digerId = sefer.olusturan_id === i.acan_id ? sefer.kamyoncu_user_id : sefer.olusturan_id;
    }
    const acan = kullaniciBul(i.acan_id);
    const diger = kullaniciBul(digerId);
    return { acan, diger, sefer };
  };

  const gosterToast = (m) => setToast(m);

  const belgeleriGetir = async () => {
    setBelgelerYukleniyor(true);
    try {
      const { data } = await supabase
        .from('belgeler')
        .select('*')
        .order('olusturulma_tarihi', { ascending: false })
        .limit(200);
      setBelgeler(data || []);
    } catch (err) {
      console.error('Belgeler yüklenemedi:', err);
    } finally {
      setBelgelerYukleniyor(false);
    }
  };

  const belgeOnayla = async (b, onayliMi) => {
    try {
      await supabase.from('belgeler').update({ onaylandi: onayliMi }).eq('id', b.id);
      await bildirimGonder(b.kullanici_id, onayliMi ? "✅ Belgeniz onaylandı" : "⚠️ Belgeniz reddedildi",
        `"${b.dosya_adi || 'Belge'}" ${onayliMi ? "onaylandı. Artık profil güvenilirliğiniz arttı." : "reddedildi. Lütfen yeniden yükleyin veya destekle iletişime geçin."}`);
      setBelgeler(prev => prev.map(x => x.id === b.id ? { ...x, onaylandi: onayliMi } : x));
      gosterToast(onayliMi ? "✅ Belge onaylandı" : "⚠️ Belge reddedildi");
    } catch (err) {
      console.error('Belge güncelleme hatası:', err);
      gosterToast("Belge güncellenemedi");
    }
  };

  const filtreliIlanlar = ilanlarList.filter(i => {
    if (ilanFiltre !== "tumu" && i.durum !== ilanFiltre) return false;
    const q = ilanAra.trim().toLocaleLowerCase("tr-TR");
    if (!q) return true;
    return (i.yuk || "").toLocaleLowerCase("tr-TR").includes(q)
      || (i.nereden || "").toLocaleLowerCase("tr-TR").includes(q)
      || (i.nereye || "").toLocaleLowerCase("tr-TR").includes(q);
  });

  const filtreliSeferler = seferlerList.filter(s => {
    if (seferFiltre === "aktif") { if (s.durum !== "yolda" && s.durum !== "teslima_bekleniyor") return false; }
    else if (seferFiltre === "odendi") { if (s.durum !== "odendi" && s.durum !== "tamamlandı" && s.durum !== "tamamlandi") return false; }
    else if (seferFiltre !== "tumu" && s.durum !== seferFiltre) return false;
    const q = seferAra.trim().toLocaleLowerCase("tr-TR");
    if (!q) return true;
    return (s.yuk || "").toLocaleLowerCase("tr-TR").includes(q)
      || (s.nereden || "").toLocaleLowerCase("tr-TR").includes(q)
      || (s.nereye || "").toLocaleLowerCase("tr-TR").includes(q)
      || (s.kamyoncu || "").toLocaleLowerCase("tr-TR").includes(q);
  });

  const filtreliKullanicilar = kullanicilarList.filter(k => {
    if (kullaniciRolFiltre !== "tumu" && rolBul(k) !== kullaniciRolFiltre) return false;
    const q = kullaniciAra.trim().toLocaleLowerCase("tr-TR");
    if (!q) return true;
    return (k.ad || "").toLocaleLowerCase("tr-TR").includes(q)
      || (k.telefon || "").toLocaleLowerCase("tr-TR").includes(q);
  });

  const adresFiltreliBelgeler = belgeler.filter(b => {
    if (belgeFiltre === "tumu") return true;
    const durum = b.onaylandi ? "onayli" : "bekliyor";
    return durum === belgeFiltre;
  });

  const kullaniciIstatistik = (k) => {
    const id = k.id;
    return {
      ilanSayisi: ilanlarList.filter(i => i.olusturan_id === id).length,
      seferSayisi: seferlerList.filter(s => s.kamyoncu_user_id === id || s.olusturan_id === id).length,
      tamamlanan: seferlerList.filter(s => (s.kamyoncu_user_id === id || s.olusturan_id === id) && (s.durum === "odendi" || s.durum === "tamamlandı")).length,
      ihtilafSayisi: ihtilaflarList.filter(i => i.acan_id === id).length,
    };
  };

  const gelirVerisi = useMemo(() => {
    const odendiler = seferlerList.filter(s => s.durum === "odendi" || s.durum === "tamamlandı" || s.durum === "tamamlandi");
    const bekleyenler = seferlerList.filter(s => s.durum === "teslima_bekleniyor");
    const toplam = odendiler.reduce((t, s) => t + Number(s.ucret || 0), 0);
    const bekleyenToplam = bekleyenler.reduce((t, s) => t + Number(s.ucret || 0), 0);
    const komisyon = toplam * 0.03;

    // Kamyoncu bazlı kazanç
    const kamyoncuGelir = {};
    odendiler.forEach(s => {
      const ad = s.kamyoncu || "Bilinmeyen";
      kamyoncuGelir[ad] = (kamyoncuGelir[ad] || 0) + Number(s.ucret || 0);
    });
    const topKamyoncular = Object.entries(kamyoncuGelir).sort((a, b) => b[1] - a[1]).slice(0, 5);

    // Aylık dağılım
    const aylik = {};
    odendiler.forEach(s => {
      const d = s.odeme_tarihi ? new Date(s.odeme_tarihi) : null;
      if (!d || isNaN(d.getTime())) return;
      const anahtar = `${d.getMonth() + 1}.${d.getFullYear()}`;
      aylik[anahtar] = (aylik[anahtar] || 0) + Number(s.ucret || 0);
    });
    const aylikListe = Object.entries(aylik).sort((a, b) => {
      const [ay1, yil1] = a[0].split(".").map(Number);
      const [ay2, yil2] = b[0].split(".").map(Number);
      return (yil2 - yil1) || (ay2 - ay1);
    }).slice(0, 6);

    return { odendiler, bekleyenler, toplam, bekleyenToplam, komisyon, topKamyoncular, aylikListe };
  }, [seferlerList]);

  const onayBekleyenBelgeSayisi = belgeler.filter(b => !b.onaylandi).length;

  const sekmeIcon = (key) => {
    const m = menu.find(x => x.key === key);
    const Icon = IconMap[m.icon] || IconMap.settings;
    return <Icon size={18} style={{ color: aktif === key ? m.renk : "var(--text3)" }} />;
  };

  const Sekme = () => {
    switch (aktif) {
      case "ozet": return (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(170px, 1fr))`, gap: 12 }}>
            <StatKart ikon="📋" val={aktifIlanSayisi} lbl="Aktif İlan" renk="#10b981" alt={`Toplam ${ilanlarList.length} ilan`} onClick={() => setAktif("ilanlar")} />
            <StatKart ikon="🚚" val={aktifSeferSayisi} lbl="Aktif Sefer" renk="#3b82f6" alt={`${seferlerList.filter(s => s.durum === "yolda").length} yolda`} onClick={() => setAktif("seferler")} />
            <StatKart ikon="👥" val={kullanicilarList.length} lbl="Toplam Kullanıcı" renk="#8b5cf6" alt={`${kamyoncuSayisi} kamyoncu · ${issizSayisi} işveren`} onClick={() => setAktif("kullanicilar")} />
            <StatKart ikon="💰" val={`₺${gelirVerisi.toplam.toLocaleString("tr-TR")}`} lbl="Toplam Ciro" renk="#059669" alt={`Komisyon ₺${gelirVerisi.komisyon.toLocaleString("tr-TR")}`} onClick={() => setAktif("gelir")} />
            <StatKart ikon="⚠️" val={gecikenOdemeler.length} lbl="Geciken Ödeme" renk="#ef4444" alt={`${bekleyenOdemeSayisi} ödeme bekliyor`} onClick={() => setAktif("seferler")} />
            <StatKart ikon="⚖️" val={acikIhtilafSayisi} lbl="Açık İhtilaf" renk="#ea580c" alt={onayBekleyenBelgeSayisi > 0 ? `${onayBekleyenBelgeSayisi} belge onay bekliyor` : "Onay bekleyen belge yok"} onClick={() => setAktif("ihtilaflar")} />
          </div>

          {/* Dikkat gerektirenler */}
          <div style={{ background: "var(--bg1)", border: "1px solid var(--border)", borderRadius: 18, padding: 18, boxShadow: "0 4px 18px rgba(15,23,42,0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 18 }}>🚨</span>
              <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.5, color: "var(--text3)", textTransform: "uppercase" }}>Dikkat Gerektirenler</span>
            </div>
            {(gecikenOdemeler.length === 0 && acikIhtilafSayisi === 0 && onayBekleyenBelgeSayisi === 0) ? (
              <div style={{ fontSize: 13, color: "#10b981", padding: "8px 0" }}>✅ Her şey yolunda — bekleyen işlem yok.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {gecikenOdemeler.slice(0, 3).map(s => (
                  <div key={`g-${s.id}`} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12 }}>
                    <span style={{ fontSize: 16 }}>⏰</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>{s.yuk} · {s.nereden}→{s.nereye}</div>
                      <div style={{ fontSize: 11, color: "#ef4444" }}>Ödeme vadesi geçti ({formatTarih(vadeTarihiniBul(s))})</div>
                    </div>
                    <button onClick={() => { setAktif("seferler"); setSeferFiltre("tumu"); }} style={{ background: "rgba(239,68,68,0.12)", border: "none", color: "#ef4444", fontSize: 11, fontWeight: 700, padding: "7px 12px", borderRadius: 9, cursor: "pointer" }}>Git</button>
                  </div>
                ))}
                {acikIhtilafSayisi > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "rgba(234,88,12,0.06)", border: "1px solid rgba(234,88,12,0.2)", borderRadius: 12 }}>
                    <span style={{ fontSize: 16 }}>⚖️</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>{acikIhtilafSayisi} açık ihtilaf var</div>
                      <div style={{ fontSize: 11, color: "var(--text3)" }}>Çözüm bekliyor</div>
                    </div>
                    <button onClick={() => setAktif("ihtilaflar")} style={{ background: "rgba(234,88,12,0.12)", border: "none", color: "#ea580c", fontSize: 11, fontWeight: 700, padding: "7px 12px", borderRadius: 9, cursor: "pointer" }}>Git</button>
                  </div>
                )}
                {onayBekleyenBelgeSayisi > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "rgba(14,165,233,0.06)", border: "1px solid rgba(14,165,233,0.2)", borderRadius: 12 }}>
                    <span style={{ fontSize: 16 }}>🛡️</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>{onayBekleyenBelgeSayisi} belge onay bekliyor</div>
                      <div style={{ fontSize: 11, color: "var(--text3)" }}>Kullanıcı güvenilirlik onayı</div>
                    </div>
                    <button onClick={() => setAktif("belgeler")} style={{ background: "rgba(14,165,233,0.12)", border: "none", color: "#0ea5e9", fontSize: 11, fontWeight: 700, padding: "7px 12px", borderRadius: 9, cursor: "pointer" }}>Git</button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Son seferler */}
          <div style={{ background: "var(--bg1)", border: "1px solid var(--border)", borderRadius: 18, padding: 18, boxShadow: "0 4px 18px rgba(15,23,42,0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 18 }}>🚚</span>
                <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.5, color: "var(--text3)", textTransform: "uppercase" }}>Aktif Seferler</span>
              </div>
              <button onClick={() => setAktif("seferler")} style={{ background: "none", border: "none", color: "#1d4ed8", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Tümü ›</button>
            </div>
            {aktifSeferSayisi === 0 ? (
              <div style={{ fontSize: 13, color: "var(--text3)", padding: "10px 0" }}>Şu an aktif sefer yok.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {seferlerList.filter(s => s.durum === "yolda" || s.durum === "teslima_bekleniyor").slice(0, 4).map(s => (
                  <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 12px", background: "var(--bg2)", borderRadius: 12, border: "1px solid var(--border)" }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: s.durum === "yolda" ? "rgba(59,130,246,0.12)" : "rgba(245,158,11,0.12)", color: s.durum === "yolda" ? "#3b82f6" : "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>
                      {s.durum === "yolda" ? "🚛" : "⏳"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.yuk}</div>
                      <div style={{ fontSize: 11, color: "var(--text3)" }}>{s.nereden} → {s.nereye}</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#f59e0b" }}>₺{Number(s.ucret || 0).toLocaleString()}</div>
                      <div style={{ fontSize: 10, color: "var(--text3)" }}>{s.kamyoncu}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* En çok kazanan kamyoncular */}
          {gelirVerisi.topKamyoncular.length > 0 && (
            <div style={{ background: "var(--bg1)", border: "1px solid var(--border)", borderRadius: 18, padding: 18, boxShadow: "0 4px 18px rgba(15,23,42,0.05)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 18 }}>🏆</span>
                <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.5, color: "var(--text3)", textTransform: "uppercase" }}>En Çok Kazanan Kamyoncular</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {gelirVerisi.topKamyoncular.map(([ad, kazanc], i) => (
                  <div key={ad} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: "var(--bg2)", borderRadius: 12, border: "1px solid var(--border)" }}>
                    <div style={{ width: 26, height: 26, borderRadius: "50%", background: ["linear-gradient(135deg,#f59e0b,#b45309)", "linear-gradient(135deg,#94a3b8,#64748b)", "linear-gradient(135deg,#d97706,#92400e)"][i] || "var(--bg3)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
                      {i + 1}
                    </div>
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ad}</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#059669" }}>₺{kazanc.toLocaleString("tr-TR")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );

      case "ilanlar": return (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <Ara deger={ilanAra} setDeger={setIlanAra} yer="İlan ara (yük / güzergah)..." stil={{ flex: 1, minWidth: 220 }} />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[["tumu", "Tümü", ilanlarList.length], ["aktif", "Aktif", ilanlarList.filter(i => i.durum === "aktif").length], ["pasif", "Pasif", ilanlarList.filter(i => i.durum === "pasif").length], ["silindi", "Silindi", ilanlarList.filter(i => i.durum === "silindi").length]].map(([k, lbl, sayi]) => (
                <button key={k} onClick={() => setIlanFiltre(k)} style={{
                  padding: "8px 16px", borderRadius: "20px", fontSize: 12, fontWeight: 700,
                  border: "1px solid " + (ilanFiltre === k ? "transparent" : "var(--border)"),
                  background: ilanFiltre === k ? "linear-gradient(135deg,#f59e0b,#d97706)" : "var(--bg1)",
                  color: ilanFiltre === k ? "#fff" : "var(--text2)", cursor: "pointer",
                  boxShadow: ilanFiltre === k ? "0 4px 14px rgba(245,158,11,0.3)" : "none"
                }}>
                  {lbl} <span style={{ opacity: 0.75 }}>({sayi})</span>
                </button>
              ))}
            </div>
          </div>

          {filtreliIlanlar.length === 0 ? (
            <EmptyState icon="📋" title="İlan bulunamadı" alt="Filtreyi değiştirin veya yeni ilan oluşturun." />
          ) : (
            <div style={{ background: "var(--bg1)", border: "1px solid var(--border)", borderRadius: 18, overflow: "hidden", boxShadow: "0 4px 18px rgba(15,23,42,0.05)" }}>
              <div style={{ overflowX: "auto" }}>
                <table className="tbl" style={{ minWidth: 720 }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Yük</th><th style={thStyle}>Güzergah</th><th style={thStyle}>İşveren</th>
                      <th style={thStyle}>Ücret</th><th style={thStyle}>Tarih</th><th style={thStyle}>Durum</th><th style={thStyle}>İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtreliIlanlar.map(i => (
                      <tr key={i.id}>
                        <td style={tdStyle}>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{i.yuk}</div>
                          <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 1 }}>{(i.aciklama || "").substring(0, 40)}</div>
                        </td>
                        <td style={tdStyle}><div style={{ fontSize: 12, color: "var(--text2)" }}>{i.nereden} <span style={{ color: "#f59e0b" }}>→</span> {i.nereye}</div></td>
                        <td style={tdStyle}>
                          <div style={{ fontSize: 12 }}>{adBul(i.olusturan_id)}</div>
                          {i.olusturanPuan ? <div style={{ fontSize: 10, color: "#f59e0b" }}>⭐ {i.olusturanPuan} ({i.olusturanOySayisi || 0})</div> : null}
                        </td>
                        <td style={{ ...tdStyle, color: "#f59e0b", fontWeight: 800, whiteSpace: "nowrap" }}>₺{Number(i.ucret || 0).toLocaleString("tr-TR")}</td>
                        <td style={tdStyle}><div style={{ fontSize: 12, whiteSpace: "nowrap" }}>{formatTarih(i.tarih)}</div></td>
                        <td style={tdStyle}><Rozet durum={i.durum} /></td>
                        <td style={tdStyle}>
                          <div style={{ display: "flex", gap: 6 }}>
                            {i.durum === "aktif" ? (
                              <button onClick={async () => { await ilanDurumuGuncelle(i.id, "pasif"); gosterToast("⏸ İlan pasife alındı"); }} style={eylemBtn("pasif")}>⏸ Pasif</button>
                            ) : i.durum !== "silindi" ? (
                              <button onClick={async () => { await ilanDurumuGuncelle(i.id, "aktif"); gosterToast("✓ İlan aktifleştirildi"); }} style={eylemBtn("aktif")}>✓ Aktif</button>
                            ) : null}
                            {i.durum !== "silindi" && (
                              <button onClick={() => setSilinecek({ tip: "ilan", id: i.id, ad: i.yuk })} style={eylemBtn("sil")}>🗑 Sil</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      );

      case "seferler": return (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <Ara deger={seferAra} setDeger={setSeferAra} yer="Sefer ara (yük / kamyoncu)..." stil={{ flex: 1, minWidth: 220 }} />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[["tumu", "Tümü", seferlerList.length], ["aktif", "Aktif", aktifSeferSayisi], ["odendi", "Ödendi", seferlerList.filter(s => s.durum === "odendi" || s.durum === "tamamlandı" || s.durum === "tamamlandi").length]].map(([k, lbl, sayi]) => (
                <button key={k} onClick={() => setSeferFiltre(k)} style={{
                  padding: "8px 16px", borderRadius: "20px", fontSize: 12, fontWeight: 700,
                  border: "1px solid " + (seferFiltre === k ? "transparent" : "var(--border)"),
                  background: seferFiltre === k ? "linear-gradient(135deg,#1d4ed8,#0f172a)" : "var(--bg1)",
                  color: seferFiltre === k ? "#fff" : "var(--text2)", cursor: "pointer",
                  boxShadow: seferFiltre === k ? "0 4px 14px rgba(29,78,216,0.3)" : "none"
                }}>
                  {lbl} <span style={{ opacity: 0.75 }}>({sayi})</span>
                </button>
              ))}
            </div>
          </div>

          {filtreliSeferler.length === 0 ? (
            <EmptyState icon="🚚" title="Sefer bulunamadı" alt="Filtreyi değiştirin." />
          ) : (
            <div style={{ background: "var(--bg1)", border: "1px solid var(--border)", borderRadius: 18, overflow: "hidden", boxShadow: "0 4px 18px rgba(15,23,42,0.05)" }}>
              <div style={{ overflowX: "auto" }}>
                <table className="tbl" style={{ minWidth: 900 }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Yük</th><th style={thStyle}>Güzergah</th><th style={thStyle}>Kamyoncu</th>
                      <th style={thStyle}>Ücret</th><th style={thStyle}>Teslim</th><th style={thStyle}>Durum</th><th style={thStyle}>Vade</th><th style={thStyle}>İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtreliSeferler.map(s => {
                      const vade = vadeTarihiniBul(s);
                      const gecti = vade ? vadeGectiMi(vade) : false;
                      const odemeBekliyor = s.durum === "teslima_bekleniyor" && s.odeme_durumu !== "odendi";
                      return (
                        <tr key={s.id}>
                          <td style={tdStyle}><div style={{ fontWeight: 700, fontSize: 13 }}>{s.yuk}</div></td>
                          <td style={tdStyle}><div style={{ fontSize: 12, color: "var(--text2)" }}>{s.nereden} <span style={{ color: "#f59e0b" }}>→</span> {s.nereye}</div></td>
                          <td style={tdStyle}>
                            <div style={{ fontSize: 12 }}>{s.kamyoncu || "—"}</div>
                            <div style={{ fontSize: 11, color: "var(--text3)" }}>{s.plaka || ""}</div>
                          </td>
                          <td style={{ ...tdStyle, color: "#f59e0b", fontWeight: 800, whiteSpace: "nowrap" }}>₺{Number(s.ucret || 0).toLocaleString("tr-TR")}</td>
                          <td style={tdStyle}><div style={{ fontSize: 12, whiteSpace: "nowrap" }}>{formatTarih(s.teslim_tarihi)}</div></td>
                          <td style={tdStyle}>
                            <select
                              value={s.durum}
                              onChange={(e) => { seferDurumuGuncelle(s.id, e.target.value); gosterToast("✓ Sefer durumu güncellendi"); }}
                              style={{ background: "var(--bg2)", border: "1px solid var(--border2)", borderRadius: 8, padding: "6px 10px", color: "var(--text)", fontSize: 12, fontWeight: 600 }}
                            >
                              <option value="bekliyor">Bekliyor</option>
                              <option value="yolda">Yolda</option>
                              <option value="teslima_bekleniyor">Teslim Bekleniyor</option>
                              <option value="tamamlandı">Tamamlandı</option>
                              <option value="odendi">Ödendi</option>
                            </select>
                          </td>
                          <td style={tdStyle}>
                            {vade ? (
                              <div style={{ fontSize: 11, color: gecti ? "#ef4444" : "var(--text3)", fontWeight: gecti ? 700 : 400, whiteSpace: "nowrap" }}>
                                {gecti ? `⚠️ ${formatTarih(vade)}` : formatTarih(vade)}
                              </div>
                            ) : <div style={{ fontSize: 11, color: "var(--text3)" }}>—</div>}
                          </td>
                          <td style={tdStyle}>
                            {odemeBekliyor ? (
                              <button
                                onClick={async () => {
                                  await odemeOnayla(s.id);
                                  gosterToast("✅ Ödeme onaylandı, kamyoncuya bildirildi");
                                }}
                                style={eylemBtn("aktif")}
                              >💰 Onayla</button>
                            ) : <span style={{ fontSize: 11, color: "var(--text3)" }}>{s.odeme_durumu === "odendi" ? "Ödendi" : "—"}</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      );

      case "kullanicilar": return (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <Ara deger={kullaniciAra} setDeger={setKullaniciAra} yer="Kullanıcı ara (ad / telefon)..." stil={{ flex: 1, minWidth: 220 }} />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[["tumu", "Tümü", kullanicilarList.length], ["kamyoncu", "Kamyoncu", kamyoncuSayisi], ["issiz", "İşveren", issizSayisi], ["admin", "Admin", kullanicilarList.filter(k => rolBul(k) === "admin").length]].map(([k, lbl, sayi]) => (
                <button key={k} onClick={() => setKullaniciRolFiltre(k)} style={{
                  padding: "8px 16px", borderRadius: "20px", fontSize: 12, fontWeight: 700,
                  border: "1px solid " + (kullaniciRolFiltre === k ? "transparent" : "var(--border)"),
                  background: kullaniciRolFiltre === k ? "linear-gradient(135deg,#8b5cf6,#6d28d9)" : "var(--bg1)",
                  color: kullaniciRolFiltre === k ? "#fff" : "var(--text2)", cursor: "pointer",
                  boxShadow: kullaniciRolFiltre === k ? "0 4px 14px rgba(139,92,246,0.3)" : "none"
                }}>
                  {lbl} <span style={{ opacity: 0.75 }}>({sayi})</span>
                </button>
              ))}
            </div>
          </div>

          {filtreliKullanicilar.length === 0 ? (
            <EmptyState icon="👥" title="Kullanıcı bulunamadı" alt="Filtreyi değiştirin." />
          ) : (
            <div style={{ background: "var(--bg1)", border: "1px solid var(--border)", borderRadius: 18, overflow: "hidden", boxShadow: "0 4px 18px rgba(15,23,42,0.05)" }}>
              <div style={{ overflowX: "auto" }}>
                <table className="tbl" style={{ minWidth: 760 }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Kullanıcı</th><th style={thStyle}>Rol</th><th style={thStyle}>Telefon</th>
                      <th style={thStyle}>Puan</th><th style={thStyle}>Durum</th><th style={thStyle}>İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtreliKullanicilar.map(k => {
                      const rol = rolBul(k);
                      const pasif = k.durum === "pasif";
                      const st = kullaniciIstatistik(k);
                      return (
                        <tr key={k.id} onClick={() => setSeciliKullanici(k)} style={{ cursor: "pointer" }}>
                          <td style={tdStyle}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, flexShrink: 0 }}>
                                {(k.ad || "?")[0].toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: 13 }}>{k.ad || "—"}</div>
                                <div style={{ fontSize: 11, color: "var(--text3)" }}>{k.sehir || ""} · {st.ilanSayisi} ilan · {st.seferSayisi} sefer</div>
                              </div>
                            </div>
                          </td>
                          <td style={tdStyle}><Rozet durum={rol} /></td>
                          <td style={tdStyle}><div style={{ fontSize: 12, whiteSpace: "nowrap" }}>{k.telefon || "-"}</div></td>
                          <td style={tdStyle}>
                            <div style={{ fontSize: 12, color: k.puan ? "#f59e0b" : "var(--text3)", fontWeight: 700 }}>⭐ {k.puan || "—"}</div>
                            <div style={{ fontSize: 10, color: "var(--text3)" }}>{k.oy_sayisi || 0} oy</div>
                          </td>
                          <td style={tdStyle}><Rozet durum={pasif ? "pasif" : "aktif"} /></td>
                          <td style={tdStyle} onClick={e => e.stopPropagation()}>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button onClick={() => setSeciliKullanici(k)} style={eylemBtn("detay")}>👁 Detay</button>
                              <button
                                onClick={async () => {
                                  await kullaniciDurumuGuncelle(k.id, pasif ? "aktif" : "pasif");
                                  gosterToast(`${k.ad} ${pasif ? "aktifleştirildi" : "askıya alındı"}`);
                                }}
                                style={eylemBtn(pasif ? "aktif" : "askiya")}
                              >{pasif ? "✓ Aktifleştir" : "🚫 Askıya Al"}</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      );

      case "belgeler": return (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[["bekliyor", "Onay Bekleyen", belgeler.filter(b => !b.onaylandi).length], ["onayli", "Onaylı", belgeler.filter(b => b.onaylandi).length], ["tumu", "Tümü", belgeler.length]].map(([k, lbl, sayi]) => (
                <button key={k} onClick={() => setBelgeFiltre(k)} style={{
                  padding: "8px 16px", borderRadius: "20px", fontSize: 12, fontWeight: 700,
                  border: "1px solid " + (belgeFiltre === k ? "transparent" : "var(--border)"),
                  background: belgeFiltre === k ? "linear-gradient(135deg,#0ea5e9,#0369a1)" : "var(--bg1)",
                  color: belgeFiltre === k ? "#fff" : "var(--text2)", cursor: "pointer",
                  boxShadow: belgeFiltre === k ? "0 4px 14px rgba(14,165,233,0.3)" : "none"
                }}>
                  {lbl} <span style={{ opacity: 0.75 }}>({sayi})</span>
                </button>
              ))}
            </div>
            <button onClick={belgeleriGetir} style={{ padding: "9px 16px", borderRadius: 12, fontSize: 12, fontWeight: 700, background: "var(--bg1)", border: "1px solid var(--border)", color: "var(--text2)", cursor: "pointer" }}>
              🔄 Yenile
            </button>
          </div>

          {belgelerYukleniyor ? (
            <EmptyState icon="⏳" title="Belgeler yükleniyor..." />
          ) : adresFiltreliBelgeler.length === 0 ? (
            <EmptyState icon="🛡️" title="Belge bulunamadı" alt="Bu filtrede belge yok." />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {adresFiltreliBelgeler.map(b => {
                const sahip = kullanicilarList.find(k => k.id === b.kullanici_id);
                return (
                  <div key={b.id} style={{ background: "var(--bg1)", border: "1px solid var(--border)", borderRadius: 16, padding: 14, boxShadow: "0 4px 18px rgba(15,23,42,0.05)", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: b.onaylandi ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                      {b.onaylandi ? "✅" : "⏳"}
                    </div>
                    <div style={{ flex: 1, minWidth: 180 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{b.dosya_adi || "Belge"}</div>
                      <div style={{ fontSize: 11, color: "var(--text3)" }}>
                        {sahip ? `${sahip.ad} · ${sahip.telefon || ""}` : "Kullanıcı"} · {formatTarih(b.olusturulma_tarihi)}
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: b.onaylandi ? "#10b981" : "#f59e0b", fontWeight: 700 }}>
                      {b.onaylandi ? "Onaylı" : "Onay Bekliyor"}
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {b.url && (
                        <a href={b.url} target="_blank" rel="noreferrer" style={{ ...eylemBtn("detay"), textDecoration: "none" }}>Görüntüle</a>
                      )}
                      {!b.onaylandi && (
                        <>
                          <button onClick={() => belgeOnayla(b, true)} style={eylemBtn("aktif")}>✓ Onayla</button>
                          <button onClick={() => belgeOnayla(b, false)} style={eylemBtn("sil")}>✕ Reddet</button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );

      case "gelir": return (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(170px, 1fr))`, gap: 12 }}>
            <StatKart ikon="💰" val={`₺${gelirVerisi.toplam.toLocaleString("tr-TR")}`} lbl="Toplam Ciro (Ödenen)" renk="#10b981" alt={`${gelirVerisi.odendiler.length} sefer`} />
            <StatKart ikon="📈" val={`₺${gelirVerisi.komisyon.toLocaleString("tr-TR")}`} lbl="Komisyon (%3)" renk="#1d4ed8" alt="Platform geliri" />
            <StatKart ikon="⏳" val={`₺${gelirVerisi.bekleyenToplam.toLocaleString("tr-TR")}`} lbl="Bekleyen Ödeme" renk="#ea580c" alt={`${gelirVerisi.bekleyenler.length} sefer`} />
            <StatKart ikon="🧮" val={gelirVerisi.odendiler.length} lbl="Ödenen Sefer" renk="#f59e0b" alt={`Ort. ₺${gelirVerisi.odendiler.length ? Math.round(gelirVerisi.toplam / gelirVerisi.odendiler.length).toLocaleString("tr-TR") : 0}`} />
          </div>

          {gelirVerisi.aylikListe.length > 0 && (
            <div style={{ background: "var(--bg1)", border: "1px solid var(--border)", borderRadius: 18, padding: 18, boxShadow: "0 4px 18px rgba(15,23,42,0.05)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <span style={{ fontSize: 18 }}>📅</span>
                <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.5, color: "var(--text3)", textTransform: "uppercase" }}>Aylık Ciro</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {gelirVerisi.aylikListe.map(([anahtar, tutar], i) => {
                  const max = gelirVerisi.aylikListe[0][1];
                  const [ay, yil] = anahtar.split(".");
                  const ayAdi = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"][Number(ay) - 1];
                  return (
                    <div key={anahtar} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 90, fontSize: 12, fontWeight: 700, color: "var(--text2)", flexShrink: 0 }}>{ayAdi} {yil}</div>
                      <div style={{ flex: 1, height: 10, background: "var(--bg3)", borderRadius: 5, overflow: "hidden" }}>
                        <div style={{ width: `${(tutar / max) * 100}%`, height: "100%", background: "linear-gradient(90deg,#059669,#10b981)", borderRadius: 5, transition: "width 0.5s ease" }} />
                      </div>
                      <div style={{ width: 90, fontSize: 12, fontWeight: 800, color: "#059669", textAlign: "right", flexShrink: 0 }}>₺{tutar.toLocaleString("tr-TR")}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {gelirVerisi.topKamyoncular.length > 0 && (
            <div style={{ background: "var(--bg1)", border: "1px solid var(--border)", borderRadius: 18, padding: 18, boxShadow: "0 4px 18px rgba(15,23,42,0.05)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 18 }}>🏆</span>
                <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.5, color: "var(--text3)", textTransform: "uppercase" }}>En Çok Kazanan Kamyoncular</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {gelirVerisi.topKamyoncular.map(([ad, kazanc], i) => (
                  <div key={ad} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: "var(--bg2)", borderRadius: 12, border: "1px solid var(--border)" }}>
                    <div style={{ width: 26, height: 26, borderRadius: "50%", background: ["linear-gradient(135deg,#f59e0b,#b45309)", "linear-gradient(135deg,#94a3b8,#64748b)", "linear-gradient(135deg,#d97706,#92400e)"][i] || "var(--bg3)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
                      {i + 1}
                    </div>
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{ad}</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#059669" }}>₺{kazanc.toLocaleString("tr-TR")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {gelirVerisi.odendiler.length > 0 && (
            <div style={{ background: "var(--bg1)", border: "1px solid var(--border)", borderRadius: 18, overflow: "hidden", boxShadow: "0 4px 18px rgba(15,23,42,0.05)" }}>
              <div style={{ padding: 16, borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.5, color: "var(--text3)", textTransform: "uppercase" }}>Ödenen Seferler</span>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table className="tbl" style={{ minWidth: 700 }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Yük</th><th style={thStyle}>Güzergah</th><th style={thStyle}>Kamyoncu</th>
                      <th style={thStyle}>Ödeme Tarihi</th><th style={thStyle}>Ücret</th><th style={thStyle}>Komisyon</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gelirVerisi.odendiler.map(s => (
                      <tr key={s.id}>
                        <td style={tdStyle}><div style={{ fontWeight: 700, fontSize: 13 }}>{s.yuk}</div></td>
                        <td style={tdStyle}><div style={{ fontSize: 12, color: "var(--text2)" }}>{s.nereden} → {s.nereye}</div></td>
                        <td style={tdStyle}><div style={{ fontSize: 12 }}>{s.kamyoncu}</div></td>
                        <td style={tdStyle}><div style={{ fontSize: 12, whiteSpace: "nowrap" }}>{formatTarih(s.odeme_tarihi)}</div></td>
                        <td style={{ ...tdStyle, color: "#f59e0b", fontWeight: 800 }}>₺{Number(s.ucret || 0).toLocaleString("tr-TR")}</td>
                        <td style={{ ...tdStyle, color: "#10b981", fontWeight: 700 }}>₺{(Number(s.ucret || 0) * 0.03).toLocaleString("tr-TR")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      );

      case "ihtilaflar": {
        const aciklar = ihtilaflarList.filter(i => i.durum === "acik");
        const cozulenler = ihtilaflarList.filter(i => i.durum === "cozuldu");
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <div style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", padding: "8px 16px", borderRadius: "20px", fontSize: 12, fontWeight: 700, border: "1px solid rgba(239,68,68,0.25)" }}>⚠️ {aciklar.length} açık ihtilaf</div>
              <div style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", padding: "8px 16px", borderRadius: "20px", fontSize: 12, fontWeight: 700, border: "1px solid rgba(16,185,129,0.25)" }}>✓ {cozulenler.length} çözüldü</div>
            </div>

            {ihtilaflarList.length === 0 ? (
              <EmptyState icon="⚖️" title="İhtilaf yok" alt="Açılan tüm ihtilaflar burada listelenir." />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {ihtilaflarList.map(i => {
                  const { acan, diger, sefer } = ihtilafTaraflar(i);
                  return (
                    <div key={i.id} style={{
                      background: "var(--bg1)", border: "1px solid " + (i.durum === "acik" ? "rgba(239,68,68,0.25)" : "rgba(16,185,129,0.2)"),
                      borderRadius: 16, padding: 16, boxShadow: "0 4px 18px rgba(15,23,42,0.05)"
                    }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                        <div style={{ width: 42, height: 42, borderRadius: 12, background: i.durum === "acik" ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19, flexShrink: 0 }}>
                          {i.durum === "acik" ? "⚖️" : "✅"}
                        </div>
                        <div style={{ flex: 1, minWidth: 220 }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>
                            {adBul(i.acan_id)} <span style={{ color: "var(--text3)", fontWeight: 500 }}>· {formatTarih(i.olusturma_zamani)}</span>
                          </div>
                          <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 3 }}>
                            {sefer ? `${sefer.yuk} · ${sefer.nereden} → ${sefer.nereye}` : "Sefer bilgisi yok"}
                          </div>
                          <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 6, background: "var(--bg2)", padding: "8px 12px", borderRadius: 10, border: "1px solid var(--border)" }}>
                            "{i.sebep}"
                          </div>
                          {i.admin_notu && (
                            <div style={{ fontSize: 11, color: "#10b981", marginTop: 6 }}>📝 Çözüm notu: {i.admin_notu}</div>
                          )}

                          {/* Tarafların iletişim bilgileri */}
                          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
                            <TarafKarti baslik="İhtilafı Açan" kullanici={acan} renk="#ea580c" />
                            <TarafKarti baslik={diger ? "Diğer Taraf" : "Diğer Taraf (kayıt yok)"} kullanici={diger} renk="#1d4ed8" />
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <Rozet durum={i.durum === "acik" ? "pasif" : "aktif"} />
                          {i.durum === "acik" && (
                            <button onClick={() => { setIhtilafCozulen(i); setIhtilafNotu(""); }} style={eylemBtn("aktif")}>Çöz</button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      }

      case "ayarlar": return (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
            {[
              { ikon: "ℹ️", baslik: "Uygulama", alanlar: [["Uygulama Adı", "NakliYol"], ["Destek E-posta", "info@nakliyol.com"], ["Versiyon", "3.0.0"]] },
              { ikon: "💳", baslik: "Komisyon & Üyelik", alanlar: [["Komisyon Oranı", "%3"], ["Pro Üyelik (Aylık)", "₺299"], ["Kurumsal Üyelik", "₺699"]] },
            ].map(grup => (
              <div key={grup.baslik} style={{ background: "var(--bg1)", border: "1px solid var(--border)", borderRadius: 18, padding: 18, boxShadow: "0 4px 18px rgba(15,23,42,0.05)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 18 }}>{grup.ikon}</span>
                  <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.2, color: "var(--text2)", textTransform: "uppercase" }}>{grup.baslik}</span>
                </div>
                <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 12 }}>Bilgilendirme amaçlıdır.</div>
                {grup.alanlar.map(([lbl, val]) => (
                  <div key={lbl} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ fontSize: 13, color: "var(--text2)" }}>{lbl}</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>{val}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div style={{ background: "var(--bg1)", border: "1px solid var(--border)", borderRadius: 18, padding: 18, boxShadow: "0 4px 18px rgba(15,23,42,0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 18 }}>⚙️</span>
              <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.2, color: "var(--text2)", textTransform: "uppercase" }}>Özellik Yönetimi</span>
            </div>
            <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 8 }}>Bu ayarlar istemci tarafında saklanır.</div>
            {[
              { key: "sms", lbl: "SMS Bildirimleri", desc: "Kritik gelişmelerde SMS gönderilsin" },
              { key: "eposta", lbl: "E-posta Bildirimleri", desc: "Duyuru ve raporlar e-postaya gelsin" },
              { key: "belgeZorunlu", lbl: "Belge Zorunluluğu", desc: "Yeni kullanıcılar belge yüklemeden işlem yapamasın" },
              { key: "bakimModu", lbl: "Bakım Modu", desc: "Bakım sırasında yeni kayıtlar kapatılsın" },
            ].map(a => (
              <div key={a.key} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 0", borderBottom: "1px solid var(--border)" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{a.lbl}</div>
                  <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 1 }}>{a.desc}</div>
                </div>
                <button
                  onClick={() => setAyarlar(prev => ({ ...prev, [a.key]: !prev[a.key] }))}
                  style={{ width: 46, height: 25, background: ayarlar[a.key] ? "#10b981" : "var(--bg3)", borderRadius: 14, position: "relative", cursor: "pointer", border: "none", transition: "background 0.2s" }}
                >
                  <div style={{ width: 21, height: 21, background: "#fff", borderRadius: "50%", position: "absolute", top: 2, left: ayarlar[a.key] ? 23 : 2, transition: "left 0.2s", boxShadow: "0 2px 5px rgba(0,0,0,0.2)" }} />
                </button>
              </div>
            ))}
            <button onClick={() => gosterToast("✓ Ayarlar kaydedildi")} className="btn btn-primary" style={{ marginTop: 14, fontSize: 13 }}>💾 Ayarları Kaydet</button>
          </div>
        </div>
      );

      default: return null;
    }
  };

  const thStyle = { padding: "12px 14px", textAlign: "left", color: "var(--text3)", fontWeight: 800, fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", borderBottom: "1px solid var(--border)", background: "var(--bg2)" };
  const tdStyle = { padding: "13px 14px", borderBottom: "1px solid var(--border)", color: "var(--text)", fontSize: 13, verticalAlign: "middle" };
  const eylemBtn = (tur) => {
    const map = {
      aktif: { bg: "rgba(16,185,129,0.1)", c: "#10b981", b: "rgba(16,185,129,0.3)" },
      pasif: { bg: "rgba(245,158,11,0.1)", c: "#f59e0b", b: "rgba(245,158,11,0.3)" },
      askiya: { bg: "rgba(239,68,68,0.1)", c: "#ef4444", b: "rgba(239,68,68,0.3)" },
      sil: { bg: "rgba(239,68,68,0.08)", c: "#ef4444", b: "rgba(239,68,68,0.25)" },
      detay: { bg: "rgba(29,78,216,0.08)", c: "#1d4ed8", b: "rgba(29,78,216,0.25)" },
    };
    const s = map[tur] || map.detay;
    return { fontSize: 11, fontWeight: 700, padding: "7px 12px", borderRadius: 9, cursor: "pointer", background: s.bg, color: s.c, border: "1px solid " + s.b, whiteSpace: "nowrap", transition: "all 0.15s" };
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      {/* Sidebar (mobilde drawer) */}
      <div style={{
        width: 224, background: "var(--bg1)", borderRight: "1px solid var(--border)",
        flexShrink: 0, display: "flex", flexDirection: "column", position: mobil ? "fixed" : "sticky",
        top: 0, height: "100vh", zIndex: 50, left: 0,
        transform: mobil ? (mobilMenu ? "translateX(0)" : "translateX(-100%)") : "none",
        transition: "transform 0.25s ease", boxShadow: mobil && mobilMenu ? "0 0 40px rgba(15,23,42,0.25)" : "none"
      }}>
        <div style={{ padding: "18px 16px 16px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ fontFamily: "var(--font-d)", fontSize: 22, letterSpacing: 2 }}>NAKLI<span style={{ background: "var(--guldum-gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>YOL</span></div>
          <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 2, letterSpacing: 1.5, textTransform: "uppercase" }}>Admin Panel</div>
        </div>
        <div style={{ flex: 1, padding: "10px 8px", overflowY: "auto" }}>
          {menu.map(m => {
            const badge = m.key === "ihtilaflar" && acikIhtilafSayisi > 0 ? acikIhtilafSayisi
              : m.key === "belgeler" && onayBekleyenBelgeSayisi > 0 ? onayBekleyenBelgeSayisi
              : m.key === "seferler" && bekleyenOdemeSayisi > 0 ? bekleyenOdemeSayisi : 0;
            const Icon = IconMap[m.icon] || IconMap.settings;
            return (
              <button key={m.key} onClick={() => { setAktif(m.key); setMobilMenu(false); }} style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "11px 12px", background: "none", border: "none", borderRadius: 12,
                color: aktif === m.key ? m.renk : "var(--text3)",
                background: aktif === m.key ? `${m.renk}0d` : "transparent",
                fontSize: 13, fontWeight: aktif === m.key ? 800 : 500,
                cursor: "pointer", textAlign: "left", transition: "all 0.2s", marginBottom: 2, position: "relative"
              }}>
                <Icon size={18} />
                <span style={{ flex: 1 }}>{m.label}</span>
                {badge > 0 && <span style={{ minWidth: 20, height: 20, padding: "0 6px", borderRadius: 10, background: "#ef4444", color: "#fff", fontSize: 10, fontWeight: 800, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{badge}</span>}
              </button>
            );
          })}
        </div>
        <div style={{ padding: 12, borderTop: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 8px 12px" }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#1d4ed8,#0f172a)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800 }}>{(oturum?.ad || "A")[0].toUpperCase()}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{oturum?.ad || "Admin"}</div>
              <div style={{ fontSize: 10, color: "var(--text3)" }}>Yönetici</div>
            </div>
          </div>
          <button onClick={cikisYap} style={{ width: "100%", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, padding: "10px", color: "#ef4444", fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>🚪 Çıkış Yap</button>
        </div>
      </div>

      {mobil && mobilMenu && (
        <div onClick={() => setMobilMenu(false)} style={{ position: "fixed", inset: 0, zIndex: 45, background: "rgba(15,23,42,0.4)" }} />
      )}

      {/* Main */}
      <div style={{ flex: 1, overflow: "auto", minWidth: 0 }}>
        <div style={{
          padding: "12px 20px", borderBottom: "1px solid var(--border)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          position: "sticky", top: 0, background: "rgba(245,241,234,0.9)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", zIndex: 20, gap: 10, flexWrap: "wrap"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {mobil && (
              <button onClick={() => setMobilMenu(true)} style={{ width: 38, height: 38, borderRadius: 12, background: "var(--bg1)", border: "1px solid var(--border)", cursor: "pointer", fontSize: 18, color: "var(--text2)" }}>☰</button>
            )}
            <div>
              <div style={{ fontSize: 17, fontWeight: 900, color: "var(--text)", letterSpacing: 0.5 }}>{menu.find(m => m.key === aktif)?.label}</div>
              <div style={{ fontSize: 11, color: "var(--text3)" }}>Yönetim paneli</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <button onClick={() => setDuyuruModal(true)} style={{
              background: "linear-gradient(135deg, rgba(251,191,36,0.15) 0%, rgba(251,191,36,0.08) 100%)",
              color: "#b45309", padding: "8px 14px", borderRadius: 12, fontSize: 12, fontWeight: 800,
              border: "1px solid rgba(251,191,36,0.3)", cursor: "pointer"
            }}>📢 Duyuru Gönder</button>
            {bekleyenOdemeSayisi > 0 && (
              <button onClick={() => { setAktif("seferler"); setSeferFiltre("aktif"); }} style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b", padding: "8px 14px", borderRadius: 12, fontSize: 12, fontWeight: 700, border: "1px solid rgba(245,158,11,0.3)", cursor: "pointer" }}>
                💰 {bekleyenOdemeSayisi} ödeme bekliyor
              </button>
            )}
            {acikIhtilafSayisi > 0 && (
              <button onClick={() => setAktif("ihtilaflar")} style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444", padding: "8px 14px", borderRadius: 12, fontSize: 12, fontWeight: 700, border: "1px solid rgba(239,68,68,0.3)", cursor: "pointer" }}>
                ⚖️ {acikIhtilafSayisi} ihtilaf
              </button>
            )}
          </div>
        </div>
        <div style={{ padding: 20 }}><Sekme /></div>
      </div>

      {/* Kullanıcı detay modal */}
      {seciliKullanici && (() => {
        const k = seciliKullanici;
        const rol = rolBul(k);
        const pasif = k.durum === "pasif";
        const st = kullaniciIstatistik(k);
        const kullaniciIlanlari = ilanlarList.filter(i => i.olusturan_id === k.id);
        const kullaniciSeferleri = seferlerList.filter(s => s.kamyoncu_user_id === k.id || s.olusturan_id === k.id);
        return (
          <Modal baslik="Kullanıcı Detayı" onKapat={() => setSeciliKullanici(null)} genislik={560}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg,#f59e0b,#d97706)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, flexShrink: 0 }}>
                {(k.ad || "?")[0].toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text)" }}>{k.ad || "—"}</div>
                <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 1 }}>{k.telefon || "—"} {k.sehir ? `· ${k.sehir}` : ""}</div>
              </div>
              <Rozet durum={rol} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 18 }}>
              {[
                { val: st.ilanSayisi, lbl: "İlan" },
                { val: st.seferSayisi, lbl: "Sefer" },
                { val: st.tamamlanan, lbl: "Tamamlanan" },
                { val: st.ihtilafSayisi, lbl: "İhtilaf" },
              ].map(x => (
                <div key={x.lbl} style={{ textAlign: "center", background: "var(--bg2)", borderRadius: 12, padding: "12px 6px", border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: "#f59e0b" }}>{x.val}</div>
                  <div style={{ fontSize: 9, color: "var(--text3)", marginTop: 2, letterSpacing: 1, textTransform: "uppercase" }}>{x.lbl}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, color: "var(--text3)", textTransform: "uppercase" }}>İşlemler</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  onClick={async () => {
                    await kullaniciDurumuGuncelle(k.id, pasif ? "aktif" : "pasif");
                    setSeciliKullanici(prev => ({ ...prev, durum: pasif ? "aktif" : "pasif" }));
                    gosterToast(`${k.ad} ${pasif ? "aktifleştirildi" : "askıya alındı"}`);
                  }}
                  style={eylemBtn(pasif ? "aktif" : "askiya")}
                >{pasif ? "✓ Aktifleştir" : "🚫 Askıya Al"}</button>
                <button onClick={() => { setMesajModal(k); setMesajMetni(""); }} style={eylemBtn("detay")}>📨 Mesaj Gönder</button>
                {k.id !== oturum?.id && (
                  <button onClick={() => { setRotaDegisecek(k); setYeniRol(rol === "kamyoncu" ? "issiz" : "kamyoncu"); }} style={eylemBtn("pasif")}>🔄 Rolü Değiştir</button>
                )}
                {k.id !== oturum?.id && (
                  <button onClick={() => setSilinecek({ tip: "kullanici", id: k.id, ad: k.ad })} style={eylemBtn("sil")}>🗑 Kullanıcıyı Sil</button>
                )}
              </div>
            </div>

            {kullaniciIlanlari.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, color: "var(--text3)", textTransform: "uppercase", marginBottom: 8 }}>İlanları ({kullaniciIlanlari.length})</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {kullaniciIlanlari.slice(0, 4).map(i => (
                    <div key={i.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: "var(--bg2)", borderRadius: 10, border: "1px solid var(--border)" }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{i.yuk}</span>
                      <span style={{ fontSize: 11, color: "var(--text3)" }}>{i.nereden}→{i.nereye}</span>
                      <Rozet durum={i.durum} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {kullaniciSeferleri.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, color: "var(--text3)", textTransform: "uppercase", marginBottom: 8 }}>Seferleri ({kullaniciSeferleri.length})</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {kullaniciSeferleri.slice(0, 4).map(s => (
                    <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: "var(--bg2)", borderRadius: 10, border: "1px solid var(--border)" }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.yuk}</span>
                      <span style={{ fontSize: 11, color: "var(--text3)" }}>{s.nereden}→{s.nereye}</span>
                      <Rozet durum={s.durum} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Modal>
        );
      })()}

      {/* Mesaj modal */}
      {mesajModal && (
        <Modal baslik={`${mesajModal.ad} için mesaj`} onKapat={() => setMesajModal(null)}>
          <textarea
            value={mesajMetni}
            onChange={e => setMesajMetni(e.target.value)}
            placeholder="Kullanıcıya gönderilecek bildirim metni..."
            rows={4}
            style={{ width: "100%", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 14px", color: "var(--text)", fontSize: 13, resize: "vertical", marginBottom: 14 }}
          />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button onClick={() => setMesajModal(null)} style={eylemBtn("askiya")}>İptal</button>
            <button
              onClick={async () => {
                if (!mesajMetni.trim()) return;
                await bildirimGonder(mesajModal.id, "📩 Admin Mesajı", mesajMetni.trim());
                setMesajModal(null);
                gosterToast("✅ Bildirim gönderildi");
              }}
              style={eylemBtn("aktif")}
            >📨 Gönder</button>
          </div>
        </Modal>
      )}

      {/* Duyuru modal */}
      {duyuruModal && (
        <Modal baslik="📢 Duyuru Gönder" onKapat={() => setDuyuruModal(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input
              value={duyuruBaslik}
              onChange={e => setDuyuruBaslik(e.target.value)}
              placeholder="Duyuru başlığı"
              style={{ width: "100%", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 14px", color: "var(--text)", fontSize: 13 }}
            />
            <textarea
              value={duyuruIcerik}
              onChange={e => setDuyuruIcerik(e.target.value)}
              placeholder="Duyuru içeriği..."
              rows={4}
              style={{ width: "100%", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 14px", color: "var(--text)", fontSize: 13, resize: "vertical" }}
            />
            <div style={{ fontSize: 11, color: "var(--text3)" }}>Duyuru tüm kullanıcılara bildirim olarak gönderilir.</div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setDuyuruModal(false)} style={eylemBtn("askiya")}>İptal</button>
              <button
                onClick={async () => {
                  if (!duyuruIcerik.trim()) return;
                  await duyuruGonder(duyuruBaslik.trim() || "Duyuru", duyuruIcerik.trim());
                  setDuyuruModal(false);
                  setDuyuruBaslik("");
                  setDuyuruIcerik("");
                  gosterToast("✅ Duyuru tüm kullanıcılara gönderildi");
                }}
                style={eylemBtn("aktif")}
              >📢 Gönder</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Rol değiştir modal */}
      {rotaDegisecek && (
        <Modal baslik={`Rol Değiştir — ${rotaDegisecek.ad}`} onKapat={() => setRotaDegisecek(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 13, color: "var(--text2)" }}>
              Mevcut rol: <b>{rolBul(rotaDegisecek)}</b>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {["kamyoncu", "issiz", "admin"].map(r => (
                <button key={r} onClick={() => setYeniRol(r)} style={{
                  flex: 1, padding: "12px", borderRadius: 12, cursor: "pointer",
                  border: "1px solid " + (yeniRol === r ? "transparent" : "var(--border)"),
                  background: yeniRol === r ? "linear-gradient(135deg,#8b5cf6,#6d28d9)" : "var(--bg2)",
                  color: yeniRol === r ? "#fff" : "var(--text2)", fontWeight: 800, fontSize: 13,
                  boxShadow: yeniRol === r ? "0 4px 14px rgba(139,92,246,0.3)" : "none"
                }}>
                  {r === "kamyoncu" ? "🚛 Kamyoncu" : r === "issiz" ? "🏢 İşveren" : "🛡️ Admin"}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setRotaDegisecek(null)} style={eylemBtn("askiya")}>İptal</button>
              <button
                onClick={async () => {
                  await kullaniciRolunuGuncelle(rotaDegisecek.id, yeniRol);
                  setRotaDegisecek(null);
                  gosterToast("✅ Rol güncellendi");
                }}
                style={eylemBtn("aktif")}
              >🔄 Güncelle</button>
            </div>
          </div>
        </Modal>
      )}

      {/* İhtilaf çöz modal */}
      {ihtilafCozulen && (
        <Modal baslik="İhtilafı Çöz" onKapat={() => setIhtilafCozulen(null)} genislik={560}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 13, color: "var(--text2)" }}>
              <b>{adBul(ihtilafCozulen.acan_id)}</b> tarafından açıldı · {formatTarih(ihtilafCozulen.olusturma_zamani)}
            </div>
            <div style={{ fontSize: 12, color: "var(--text2)", background: "var(--bg2)", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)" }}>
              "{ihtilafCozulen.sebep}"
            </div>

            {/* Tarafların iletişim bilgileri */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(() => {
                const { acan, diger, sefer } = ihtilafTaraflar(ihtilafCozulen);
                return (
                  <>
                    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.2, color: "var(--text3)", textTransform: "uppercase" }}>
                      Taraflarla İletişime Geçin
                    </div>
                    {sefer && (
                      <div style={{ fontSize: 12, color: "var(--text2)" }}>
                        📦 {sefer.yuk} · {sefer.nereden} → {sefer.nereye} · <b style={{ color: "#f59e0b" }}>₺{Number(sefer.ucret || 0).toLocaleString("tr-TR")}</b>
                      </div>
                    )}
                    <TarafKarti baslik="İhtilafı Açan" kullanici={acan} renk="#ea580c" />
                    <TarafKarti baslik={diger ? "Diğer Taraf" : "Diğer Taraf (kayıt yok)"} kullanici={diger} renk="#1d4ed8" />
                  </>
                );
              })()}
            </div>

            <textarea
              value={ihtilafNotu}
              onChange={e => setIhtilafNotu(e.target.value)}
              placeholder="Çözüm notu (kullanıcıya bildirilir)"
              rows={3}
              style={{ width: "100%", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 14px", color: "var(--text)", fontSize: 13, resize: "vertical" }}
            />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setIhtilafCozulen(null)} style={eylemBtn("askiya")}>İptal</button>
              <button
                onClick={async () => {
                  await ihtilafCoz(ihtilafCozulen.id, ihtilafNotu.trim());
                  setIhtilafCozulen(null);
                  gosterToast("✅ İhtilaf çözüldü, taraflara bildirildi");
                }}
                style={eylemBtn("aktif")}
              >✅ Çöz ve Bildir</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Silme onay modal */}
      {silinecek && (
        <Modal baslik="Emin misiniz?" onKapat={() => setSilinecek(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 13, color: "var(--text2)" }}>
              {silinecek.tip === "ilan"
                ? `"${silinecek.ad}" ilanı kalıcı olarak silinecek.`
                : `"${silinecek.ad}" kullanıcısı kalıcı olarak silinecek. İlanları, seferleri ve tüm kayıtları silinir.`}
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setSilinecek(null)} style={eylemBtn("detay")}>Vazgeç</button>
              <button
                onClick={async () => {
                  if (silinecek.tip === "ilan") {
                    await ilanSil(silinecek.id);
                    gosterToast("🗑 İlan silindi");
                  } else {
                    try {
                      await kullaniciSil(silinecek.id);
                      setSeciliKullanici(null);
                      gosterToast("🗑 Kullanıcı silindi");
                    } catch (e) {
                      gosterToast("Silme hatası: " + (e.message || e));
                    }
                  }
                  setSilinecek(null);
                }}
                style={eylemBtn("sil")}
              >🗑 Evet, Sil</button>
            </div>
          </div>
        </Modal>
      )}

      <Toast mesaj={toast} />
    </div>
  );
}
