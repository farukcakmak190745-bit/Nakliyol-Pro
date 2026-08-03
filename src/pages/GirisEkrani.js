import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import { harfFiltre, plakaFiltre, rakamFiltre } from "../utils/inputFilters";

// SMS doğrulama simülasyonu
const SMSDogrula = ({ telefon, onDogrulandi, onGeri }) => {
  const [kod, setKod] = useState("");
  const [gonderildi, setGonderildi] = useState(true);
  const [hata, setHata] = useState("");

  const dogrula = () => {
    if (kod === "1234") {
      onDogrulandi();
    } else {
      setHata("Kod hatalı. Demo için: 1234");
    }
  };

  return (
    <div style={{ animation: "slideDown 0.25s ease" }}>
      <button onClick={onGeri} style={{ color: "var(--text3)", fontSize: 13, marginBottom: 20, display: "flex", alignItems: "center", gap: 6 }}>← Geri</button>
      <div className="card" style={{ padding: 24 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📱</div>
          <div className="display" style={{ fontSize: 22, marginBottom: 6 }}>SMS Doğrulama</div>
          <div style={{ fontSize: 13, color: "var(--text2)" }}>
            <span style={{ color: "var(--text)" }}>+90 {telefon}</span> numarasına<br />doğrulama kodu gönderildi
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: "#fbbf24", background: "rgba(251,191,36,0.15)", padding: "6px 12px", borderRadius: "20px", display: "inline-block" }}>
            Demo kodu: <strong>1234</strong>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1.5, color: "var(--text3)", display: "block", marginBottom: 8 }}>6 HANELİ KOD</label>
          <input
            className="input"
            style={{ textAlign: "center", fontSize: 24, letterSpacing: 8, fontFamily: "var(--font-d)" }}
            placeholder="• • • •"
            maxLength={6}
            value={kod}
            onChange={e => { setKod(e.target.value.replace(/\D/g, "")); setHata(""); }}
            onKeyDown={e => e.key === "Enter" && dogrula()}
            autoFocus
          />
          {hata && <div style={{ color: "#ef4444", fontSize: 12, marginTop: 8 }}>{hata}</div>}
        </div>

        <button onClick={dogrula} disabled={kod.length < 4} className="btn btn-primary btn-full" style={{ padding: "14px", letterSpacing: 2 }}>
          DOĞRULA
        </button>

        <button style={{ width: "100%", marginTop: 12, fontSize: 13, color: "var(--text3)", background: "none", border: "none", cursor: "pointer" }}>
          Tekrar gönder (59s)
        </button>
      </div>
    </div>
  );
};

// Kayıt formu
const KayitFormu = ({ rol, hata, onGeri, onTamam, yukleniyor }) => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ ad: "", soyad: "", telefon: "", tc: "", sifre: "", sifre2: "", aracTip: "", plaka: "", firmaAdi: "", vergiNo: "" });
  const [hatalar, setHatalar] = useState({});
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const dogrula = () => {
    const h = {};
    if (!form.ad.trim()) h.ad = "Ad zorunlu";
    if (!form.soyad.trim()) h.soyad = "Soyad zorunlu";
    if (!form.telefon || form.telefon.length < 10) h.telefon = "Geçerli telefon girin";
    if (!form.tc || form.tc.length !== 11) h.tc = "TC 11 haneli olmalı";
    if (!form.sifre || form.sifre.length < 6) h.sifre = "En az 6 karakter";
    if (form.sifre !== form.sifre2) h.sifre2 = "Şifreler eşleşmiyor";
    if (rol === "kamyoncu" && !form.plaka.trim()) h.plaka = "Plaka zorunlu";
    if (rol === "issiz" && !form.firmaAdi.trim()) h.firmaAdi = "Firma adı zorunlu";
    setHatalar(h);
    if (Object.keys(h).length === 0) setAdim(2);
  };

  const Hata = ({ alan }) => hatalar[alan] ? <div style={{ color: "#ef4444", fontSize: 11, marginTop: 2 }}>{hatalar[alan]}</div> : null;

  if (adim === 2) return (
    <div>
      {hata && (
        <div style={{
          marginBottom: 14, padding: "12px 14px", borderRadius: "10px",
          background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
          color: "#ef4444", fontSize: 12, fontWeight: 600
        }}>
          ⚠️ {hata}
        </div>
      )}
      <SMSDogrula
        telefon={form.telefon}
        onDogrulandi={() => onTamam({ ...form, rol })}
        onGeri={() => setAdim(1)}
      />
    </div>
  );

  return (
    <div style={{ animation: "slideDown 0.25s ease" }}>
      <button onClick={onGeri} style={{ color: "var(--text3)", fontSize: 13, marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>← Geri</button>

      <div className="card" style={{ padding: 20, marginBottom: 12 }}>
        <div style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>👤</span>
          <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1.5, color: "#fbbf24" }}>KİŞİSEL BİLGİLER</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.5, color: "var(--text3)", display: "block", marginBottom: 6 }}>AD <span style={{ color: "var(--turuncu)" }}>*</span></label>
            <input className="input" placeholder="Mehmet" value={form.ad} onChange={e => set("ad", harfFiltre(e.target.value, 60))} />
            <Hata alan="ad" />
            <Hata alan="soyad" />
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.5, color: "var(--text3)", display: "block", marginBottom: 6 }}>SOYAD <span style={{ color: "var(--turuncu)" }}>*</span></label>
            <input className="input" placeholder="Yılmaz" value={form.soyad} onChange={e => set("soyad", harfFiltre(e.target.value, 40))} />
            <Hata alan="soyad" />
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <label style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.5, color: "var(--text3)", display: "block", marginBottom: 6 }}>TELEFON <span style={{ color: "var(--turuncu)" }}>*</span></label>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ background: "var(--bg2)", border: "1px solid rgba(251,191,36,0.1)", borderRadius: "12px", padding: "12px 16px", fontSize: 14, display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>🇹🇷 +90</div>
            <input className="input" placeholder="5xx xxx xx xx" maxLength={10} value={form.telefon} onChange={e => set("telefon", e.target.value.replace(/\D/g, ""))} />
          </div>
          <Hata alan="telefon" />
        </div>
        <div style={{ marginTop: 12 }}>
          <label style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.5, color: "var(--text3)", display: "block", marginBottom: 6 }}>TC KİMLİK NO <span style={{ color: "var(--turuncu)" }}>*</span></label>
          <input className="input" placeholder="xxxxxxxxxxx" maxLength={11} value={form.tc} onChange={e => set("tc", e.target.value.replace(/\D/g, ""))} />
        </div>
      </div>

      {rol === "kamyoncu" && (
        <div className="card" style={{ padding: 20, marginBottom: 12 }}>
          <div style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 20 }}>🚛</span>
            <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1.5, color: "#fbbf24" }}>ARAÇ BİLGİLERİ</span>
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.5, color: "var(--text3)", display: "block", marginBottom: 6 }}>ARAÇ TİPİ <span style={{ color: "var(--turuncu)" }}>*</span></label>
            <select className="input" value={form.aracTip} onChange={e => set("aracTip", e.target.value)} style={{ cursor: "pointer", background: "var(--bg2)" }}>
              <option value="">Seçin...</option>
              {["TIR", "10 Teker Açık", "10 Teker Tenteli", "Kırkayak Açık", "Kamyonet", "50 NC Kamyon", "Diğer"].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ marginTop: 12 }}>
            <label style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.5, color: "var(--text3)", display: "block", marginBottom: 6 }}>PLAKA <span style={{ color: "var(--turuncu)" }}>*</span></label>
            <input className="input" placeholder="34 ABC 123" value={form.plaka} onChange={e => set("plaka", plakaFiltre(e.target.value))} />
            <Hata alan="plaka" />
          </div>
        </div>
      )}

      {rol === "issiz" && (
        <div className="card" style={{ padding: 20, marginBottom: 12 }}>
          <div style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 20 }}>🏢</span>
            <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1.5, color: "#fbbf24" }}>FİRMA BİLGİLERİ</span>
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.5, color: "var(--text3)", display: "block", marginBottom: 6 }}>FİRMA ADI <span style={{ color: "var(--turuncu)" }}>*</span></label>
            <input className="input" placeholder="Örnek Taşımacılık A.Ş." value={form.firmaAdi} onChange={e => set("firmaAdi", harfFiltre(e.target.value, 60))} />
            <Hata alan="firmaAdi" />
          </div>
          <div style={{ marginTop: 12 }}>
            <label style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.5, color: "var(--text3)", display: "block", marginBottom: 6 }}>VERGİ NO</label>
            <input className="input" placeholder="xxxxxxxxxx" maxLength={10} value={form.vergiNo} onChange={e => set("vergiNo", e.target.value.replace(/\D/g, ""))} />
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>🔒</span>
          <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1.5, color: "#fbbf24" }}>ŞİFRE BELİRLE</span>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.5, color: "var(--text3)", display: "block", marginBottom: 6 }}>ŞİFRE <span style={{ color: "var(--turuncu)" }}>*</span></label>
          <input className="input" type="password" placeholder="En az 6 karakter" value={form.sifre} onChange={e => set("sifre", e.target.value)} />
          <Hata alan="sifre" />
        </div>
        <div>
          <label style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.5, color: "var(--text3)", display: "block", marginBottom: 6 }}>ŞİFRE TEKRAR <span style={{ color: "var(--turuncu)" }}>*</span></label>
          <input className="input" type="password" placeholder="Tekrar girin" value={form.sifre2} onChange={e => set("sifre2", e.target.value)} />
          <Hata alan="sifre2" />
        </div>
      </div>

      <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 14, lineHeight: 1.6 }}>
        Devam ederek <button onClick={() => navigate("/kosullar")} style={{ color: "#fbbf24", background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: 11, fontWeight: 600 }}>Kullanım Koşulları</button>'nı ve <button onClick={() => navigate("/gizlilik")} style={{ color: "#fbbf24", background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: 11, fontWeight: 600 }}>Gizlilik Politikası</button>'nı kabul etmiş olursunuz.
      </div>

      {hata && (
        <div style={{
          marginBottom: 14, padding: "12px 14px", borderRadius: "10px",
          background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
          color: "#ef4444", fontSize: 12, fontWeight: 600
        }}>
          ⚠️ {hata}
        </div>
      )}

      <button onClick={dogrula} disabled={yukleniyor} className="btn btn-primary btn-full" style={{ padding: "16px", letterSpacing: 3, fontWeight: 700 }}>
        {yukleniyor ? "KAYIT OLUŞTURULUYOR..." : "DEVAM ET → SMS DOĞRULAMA"}
      </button>
    </div>
  );
};

export default function GirisEkrani() {
  const { kayitOl, girisYap, oturum, loading } = useApp();
  const navigate = useNavigate();
  const [ekran, setEkran] = useState("ana");
  const [secRol, setSecRol] = useState(null);
  const [girisForm, setGirisForm] = useState({ telefon: "", sifre: "" });
  const [girisHata, setGirisHata] = useState("");
  const [kayitHata, setKayitHata] = useState("");
  const [girisYukleniyor, setGirisYukleniyor] = useState(false);
  const [kayitYukleniyor, setKayitYukleniyor] = useState(false);
  const [gosterSifre, setGosterSifre] = useState(false);
  const [sifreUnuttum, setSifreUnuttum] = useState(false);

  // Oturum varsa (örn. F5 sonrası session restore olduysa) otomatik /app'e git
  useEffect(() => {
    if (!loading && oturum) {
      console.log("✅ GirisEkrani: oturum var, /app'e yönlendiriliyor");
      navigate("/app", { replace: true });
    }
  }, [oturum, loading, navigate]);

  const handleKayit = (bilgiler) => {
    const kayitBilgileri = {
      ...bilgiler,
      plaka: bilgiler.plaka || "34 ABC 123",
      aracTip: bilgiler.aracTip || "TIR / Kapalı Kasa",
    };
    setKayitYukleniyor(true);
    kayitOl(kayitBilgileri).then(() => {
      setEkran("ana");
    }).catch(error => {
      console.error("Kayıt hatası:", error);
      setKayitHata(error?.message || "Kayıt başarısız, tekrar deneyin.");
    }).finally(() => {
      setKayitYukleniyor(false);
    });
  };

  const handleGiris = async () => {
    setGirisHata("");
    if (!girisForm.telefon || !girisForm.sifre) {
      setGirisHata("Telefon ve şifre gerekli.");
      return;
    }
    setGirisYukleniyor(true);
    try {
      await girisYap(girisForm.telefon, girisForm.sifre);
      navigate("/app");
    } catch (error) {
      console.error("Giriş hatası:", error);
      setGirisHata(error?.message || "Giriş başarısız, bilgilerinizi kontrol edin.");
    } finally {
      setGirisYukleniyor(false);
    }
  };

  if (ekran === "kayit-form") return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", padding: 20, overflowY: "auto" }}>
      <div style={{ maxWidth: 440, margin: "0 auto", paddingTop: 20 }}>
        <KayitFormu rol={secRol} hata={kayitHata} yukleniyor={kayitYukleniyor} onGeri={() => { setKayitHata(""); setEkran("kayit-rol"); }} onTamam={handleKayit} />
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 24px 40px", position: "relative", overflowX: "hidden", overflowY: "auto" }}>
      <div style={{ position: "absolute", top: -120, left: -120, width: 400, height: 400, background: "radial-gradient(circle, rgba(251,191,36,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -80, right: -80, width: 300, height: 300, background: "radial-gradient(circle, rgba(251,191,36,0.04) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: 440, margin: "auto", animation: "slideDown 0.35s ease" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontFamily: "var(--font-d)", fontSize: 56, letterSpacing: 5, lineHeight: 1, marginBottom: 8, color: "var(--navy)" }}>
            NAKLI<span style={{ background: "var(--guldum-gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>YOL</span>
          </div>
          <div style={{ fontSize: 10, color: "var(--text3)", letterSpacing: 2 }}>TÜRKİYE'NİN KAMYON PLATFORMU</div>
        </div>

        {ekran === "ana" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <button onClick={() => setEkran("kayit-rol")} className="btn btn-display-gold btn-full" style={{ padding: "18px", letterSpacing: 3 }}>
              KAYIT OL — ÜCRETSİZ
            </button>
            <button onClick={() => setEkran("giris")} className="btn btn-secondary btn-full" style={{ padding: "14px", fontWeight: 500 }}>
              Zaten hesabım var — Giriş Yap
            </button>
          </div>
        )}

        {ekran === "kayit-rol" && (
          <div style={{ animation: "slideDown 0.25s ease" }}>
            <button onClick={() => setEkran("ana")} style={{ color: "var(--text3)", fontSize: 13, marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>← Geri</button>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.5, color: "var(--text3)", marginBottom: 14, textAlign: "center" }}>NASIL KULLANACAKSINIZ?</div>
            <button onClick={() => { setSecRol("kamyoncu"); setEkran("kayit-form"); }} style={{ width: "100%", background: "var(--bg1)", border: "1px solid var(--border2)", borderRadius: "16px", padding: "18px 20px", display: "flex", alignItems: "center", gap: 16, cursor: "pointer", transition: "var(--tr)", marginBottom: 10, color: "var(--text)", textAlign: "left" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--turuncu)"; e.currentTarget.style.background = "var(--bg2)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border2)"; e.currentTarget.style.background = "var(--bg1)"; }}
            >
              <span style={{ fontSize: 36 }}>🚛</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "var(--font-d)", fontSize: 18, letterSpacing: 0.5, color: "var(--turuncu)" }}>Kamyoncu</div>
                <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>İlanları gör, teklif ver, sefer yönet</div>
              </div>
              <span style={{ color: "var(--text3)", fontSize: 20 }}>›</span>
            </button>
            <button onClick={() => { setSecRol("issiz"); setEkran("kayit-form"); }} style={{ width: "100%", background: "var(--bg1)", border: "1px solid var(--border2)", borderRadius: "16px", padding: "18px 20px", display: "flex", alignItems: "center", gap: 16, cursor: "pointer", transition: "var(--tr)", marginBottom: 10, color: "var(--text)", textAlign: "left" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#fbbf24"; e.currentTarget.style.background = "var(--bg2)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border2)"; e.currentTarget.style.background = "var(--bg1)"; }}
            >
              <span style={{ fontSize: 36 }}>🏢</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "var(--font-d)", fontSize: 18, letterSpacing: 0.5, color: "#fbbf24" }}>İş Veren</div>
                <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>İlan ver, teklif al, kamyon bul</div>
              </div>
              <span style={{ color: "var(--text3)", fontSize: 20 }}>›</span>
            </button>
          </div>
        )}

        {ekran === "giris" && (
          <div style={{ animation: "slideDown 0.25s ease" }}>
            <button onClick={() => { setGirisHata(""); setEkran("ana"); }} style={{ color: "var(--text3)", fontSize: 13, marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>← Geri</button>
            <div className="card" style={{ padding: 24 }}>
              <div style={{ fontSize: 20, fontWeight: 600, color: "#fbbf24", marginBottom: 4, letterSpacing: 1 }}>GİRİŞ YAP</div>
              <div style={{ fontSize: 10, color: "var(--text3)", marginBottom: 20, letterSpacing: 1.5 }}>HESABINIZA ERİŞİN</div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.5, color: "var(--text3)", display: "block", marginBottom: 8 }}>TELEFON</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ background: "var(--bg2)", border: "1px solid rgba(251,191,36,0.1)", borderRadius: "12px", padding: "12px 16px", fontSize: 14, display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>🇹🇷 +90</div>
                  <input
                    className="input"
                    placeholder="5xx xxx xx xx"
                    inputMode="numeric"
                    maxLength={10}
                    value={girisForm.telefon}
                    onChange={e => { setGirisHata(""); setGirisForm(f => ({ ...f, telefon: e.target.value.replace(/\D/g, "") })); }}
                  />
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.5, color: "var(--text3)", display: "block", marginBottom: 8 }}>ŞİFRE</label>
                <div style={{ position: "relative" }}>
                  <input
                    className="input"
                    type={gosterSifre ? "text" : "password"}
                    placeholder="••••••"
                    value={girisForm.sifre}
                    onChange={e => { setGirisHata(""); setGirisForm(f => ({ ...f, sifre: e.target.value })); }}
                    onKeyDown={e => e.key === "Enter" && handleGiris()}
                    style={{ paddingRight: 46 }}
                  />
                  <button
                    type="button"
                    onClick={() => setGosterSifre(g => !g)}
                    aria-label={gosterSifre ? "Şifreyi gizle" : "Şifreyi göster"}
                    style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 18, cursor: "pointer", padding: 4 }}
                  >
                    {gosterSifre ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              {girisHata && (
                <div style={{
                  marginBottom: 14, padding: "12px 14px", borderRadius: "10px",
                  background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
                  color: "#ef4444", fontSize: 12, fontWeight: 600
                }}>
                  ⚠️ {girisHata}
                </div>
              )}

              <button onClick={handleGiris} disabled={!girisForm.telefon || !girisForm.sifre || girisYukleniyor} className="btn btn-primary btn-full" style={{ padding: "14px", letterSpacing: 2 }}>
                {girisYukleniyor ? "GİRİŞ YAPILIYOR..." : "GİRİŞ YAP"}
              </button>

              <button
                onClick={() => setSifreUnuttum(u => !u)}
                style={{ width: "100%", marginTop: 14, fontSize: 12, color: "var(--text3)", background: "none", border: "none", cursor: "pointer", textAlign: "center" }}
              >
                🔑 Şifremi Unuttum
              </button>
              {sifreUnuttum && (
                <div style={{ marginTop: 12, padding: "12px 14px", borderRadius: "10px", background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)", fontSize: 12, color: "var(--text2)", lineHeight: 1.6 }}>
                  Şifre sıfırlama: destek ekibi telefonunuza geçici bir şifre gönderecektir. Kısa süre içinde bu özellik aktif olacak.
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 28, fontSize: 11, color: "var(--text3)" }}>NakliYol © 2026</div>
      </div>
    </div>
  );
}
