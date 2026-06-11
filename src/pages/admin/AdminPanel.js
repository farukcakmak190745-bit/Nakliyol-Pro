import { useState } from "react";
import { useApp } from "../../context/AppContext";
import { IconMap } from "../../components/Icons";

const menu = [
  { key: "ozet", icon: "activity", label: "Özet" },
  { key: "ilanlar", icon: "file", label: "İlanlar" },
  { key: "seferler", icon: "map", label: "Seferler" },
  { key: "kullanicilar", icon: "users", label: "Kullanıcılar" },
  { key: "gelir", icon: "creditcard", label: "Gelir" },
  { key: "ayarlar", icon: "settings", label: "Ayarlar" },
];

export default function AdminPanel() {
  const { ilanlar, seferler, kullanicilar, ilanSil, odemeYap, cikisYap } = useApp();
  const [aktif, setAktif] = useState("ozet");
  const [mobilMenu, setMobilMenu] = useState(false);

  const ilanlarList = ilanlar || [];
  const seferlerList = seferler || [];
  const kullanicilarList = kullanicilar || [];
  const aktifSeferler = seferlerList.filter(s => s.durum === "yolda" || s.durum === "teslima_bekleniyor");

  const thStyle = { padding: "12px 14px", textAlign: "left", color: "var(--text3)", fontWeight: 700, fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", borderBottom: "1px solid rgba(251,191,36,0.2)", background: "var(--bg2)" };
  const tdStyle = { padding: "14px 14px", borderBottom: "1px solid rgba(251,191,36,0.1)", color: "var(--text)", fontSize: 13, verticalAlign: "middle" };
  const btnStyle = { fontSize: 11, padding: "6px 14px", borderRadius: "8px", cursor: "pointer", marginRight: 6, transition: "var(--tr)" };

  const Sekme = () => {
    switch(aktif) {
      case "ozet": return (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12, marginBottom: 24 }}>
            {[
              { val: ilanlarList.filter(i=>i.durum==="aktif").length, lbl: "Aktif İlan", renk: "#10b981", icon: "file" },
              { val: seferlerList.filter(s=>s.durum==="yolda"||s.durum==="teslima_bekleniyor").length, lbl: "Aktif Sefer", renk: "#3b82f6", icon: "map" },
              { val: kullanicilarList.length, lbl: "Toplam Kullanıcı", renk: "#3b82f6", icon: "users" },
              { val: "₺142K", lbl: "Bu Ay Ciro", renk: "#fbbf24", icon: "creditcard" },
            ].map(s => (
              <div key={s.lbl} style={{ background: "var(--bg1)", border: "1px solid rgba(251,191,36,0.15)", borderRadius: "16px", padding: 18 }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</div>
                <div style={{ fontFamily: "var(--font-d)", fontSize: 28, color: s.renk }}>{s.val}</div>
                <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 4, letterSpacing: 1 }}>/{s.lbl}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: "var(--text3)" }}>AKTİF SEFERLER</div>
            <div style={{ flex: 1, height: 1, background: "rgba(251,191,36,0.1)" }}></div>
          </div>
          <div style={{ background: "var(--bg1)", border: "1px solid rgba(251,191,36,0.15)", borderRadius: "16px", overflow: "auto" }}>
            <table className="tbl">
              <thead><tr><th style={thStyle}>Yük</th><th style={thStyle}>Güzergah</th><th style={thStyle}>Kamyoncu</th><th style={thStyle}>Durum</th></tr></thead>
              <tbody>{seferler.filter(s=>s.durum==="yolda"||s.durum==="teslima_bekleniyor").slice(0,4).map(s => (
                <tr key={s.id}>
                  <td style={tdStyle}>{s.yuk}</td>
                  <td style={tdStyle}>{s.nereden}→{s.nereye}</td>
                  <td style={tdStyle}>{s.kamyoncu} • {s.plaka}</td>
                  <td style={tdStyle}><div style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0.08) 100%)", color: "#10b981", padding: "4px 10px", borderRadius: "12px", fontSize: 11, fontWeight: 600, display: "inline-block" }}>{s.durum.replace("_", " ")}</div></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      );

      case "ilanlar": return (
        <div style={{ background: "var(--bg1)", border: "1px solid rgba(251,191,36,0.15)", borderRadius: "16px", overflow: "auto" }}>
          <table className="tbl">
            <thead><tr><th style={thStyle}>Yük</th><th style={thStyle}>Güzergah</th><th style={thStyle}>Ücret</th><th style={thStyle}>İstek</th><th style={thStyle}>Durum</th><th style={thStyle}>İşlem</th></tr></thead>
            <tbody>{ilanlar.filter(i => i.durum === "aktif").map(i => (
              <tr key={i.id}>
                <td style={tdStyle}>{i.yuk}</td>
                <td style={tdStyle}>{i.nereden}→{i.nereye}</td>
                <td style={{...tdStyle,color:"#fbbf24",fontWeight:700}}>₺{i.ucret.toLocaleString()}</td>
                <td style={tdStyle}>{i.istekSayisi}</td>
                <td style={tdStyle}><div style={{ background: "linear-gradient(135deg, rgba(251,191,36,0.15) 0%, rgba(251,191,36,0.08) 100%)", color: "#fbbf24", padding: "4px 10px", borderRadius: "12px", fontSize: 11, fontWeight: 600, display: "inline-block" }}>Aktif</div></td>
                <td style={tdStyle}>
                  <button onClick={()=>ilanSil(i.id)} style={{...btnStyle,border:"1px solid rgba(239,68,68,0.3)",background:"rgba(239,68,68,0.08)",color:"#ef4444"}}>Kaldır</button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      );

      case "teklifler": return (
        <div style={{ background: "var(--bg1)", border: "1px solid rgba(251,191,36,0.15)", borderRadius: "16px", overflow: "auto" }}>
          <table className="tbl">
            <thead><tr><th style={thStyle}>Kamyoncu</th><th style={thStyle}>Plaka</th><th style={thStyle}>Yük</th><th style={thStyle}>Güzergah</th><th style={thStyle}>Durum</th></tr></thead>
            <tbody>{seferler.map(s => (
              <tr key={s.id}>
                <td style={tdStyle}>{s.kamyoncu}</td>
                <td style={tdStyle}>{s.plaka}</td>
                <td style={tdStyle}>{s.yuk}</td>
                <td style={tdStyle}>{s.nereden}→{s.nereye}</td>
                <td style={tdStyle}><div style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0.08) 100%)", color: "#10b981", padding: "4px 10px", borderRadius: "12px", fontSize: 11, fontWeight: 600, display: "inline-block" }}>{s.durum.replace("_", " ")}</div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      );

      case "seferler": return (
        <div style={{ background: "var(--bg1)", border: "1px solid rgba(251,191,36,0.15)", borderRadius: "16px", overflow: "auto" }}>
          <table className="tbl">
            <thead><tr><th style={thStyle}>Yük</th><th style={thStyle}>Güzergah</th><th style={thStyle}>Kamyoncu</th><th style={thStyle}>Plaka</th><th style={thStyle}>Teslim Tarihi</th><th style={thStyle}>Durum</th></tr></thead>
            <tbody>{seferler.map(s => (
              <tr key={s.id}>
                <td style={tdStyle}>{s.yuk}</td>
                <td style={tdStyle}>{s.nereden}→{s.nereye}</td>
                <td style={tdStyle}>{s.kamyoncu}</td>
                <td style={tdStyle}>{s.plaka}</td>
                <td style={tdStyle}>{s.teslimTarihi || "-"}</td>
                <td style={tdStyle}><div style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0.08) 100%)", color: "#10b981", padding: "4px 10px", borderRadius: "12px", fontSize: 11, fontWeight: 600, display: "inline-block" }}>{s.durum.replace("_", " ")}</div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      );

      case "kullanicilar": return (
        <div style={{ background: "var(--bg1)", border: "1px solid rgba(251,191,36,0.15)", borderRadius: "16px", overflow: "auto" }}>
          <table className="tbl">
            <thead><tr><th style={thStyle}>Ad</th><th style={thStyle}>Rol</th><th style={thStyle}>Puan</th><th style={thStyle}>Aktif Sefer</th><th style={thStyle}>Durum</th><th style={thStyle}>İşlem</th></tr></thead>
            <tbody>{kullanicilar.map(k => {
              const seferlerim = seferlerList.filter(s => s.kamyoncu === k.ad);
              const aktifSeferler = seferlerim.filter(s => s.durum === "yolda" || s.durum === "teslima_bekleniyor");
              return (
              <tr key={k.id}>
                <td style={tdStyle}>{k.ad}</td>
                <td style={tdStyle}><div style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(59,130,246,0.08) 100%)", color: "#3b82f6", padding: "4px 10px", borderRadius: "12px", fontSize: 11, fontWeight: 600, display: "inline-block" }}>{k.rol}</div></td>
                <td style={{...tdStyle,color:"#fbbf24",fontWeight:700}}><IconMap.star size={16} /> {k.puan}</td>
                <td style={tdStyle}>{aktifSeferler.length}</td>
                <td style={tdStyle}><div style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0.08) 100%)", color: "#10b981", padding: "4px 10px", borderRadius: "12px", fontSize: 11, fontWeight: 600, display: "inline-block" }}>{k.durum}</div></td>
                <td style={tdStyle}>
                  <button style={{...btnStyle,border:"1px solid rgba(251,191,36,0.2)",background:"none",color:"var(--text2)"}}>Profil</button>
                  <button style={{...btnStyle,border:"1px solid rgba(251,191,36,0.3)",background:"rgba(251,191,36,0.1)",color:"#fbbf24"}}>Askı</button>
                </td>
              </tr>
            )})}</tbody>
          </table>
        </div>
      );

      case "gelir": return (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            {[
              { lbl: "Bu Ay Komisyon", val: "₺14.280", renk: "#10b981" },
              { lbl: "Bu Ay Abonelik", val: "₺8.970", renk: "#3b82f6" },
              { lbl: "Toplam Ciro", val: "₺142K", renk: "#fbbf24" },
              { lbl: "Bekleyen Ödeme", val: "₺3.200", renk: "#ea580c" },
            ].map(s => (
              <div key={s.lbl} style={{ background: "var(--bg1)", border: "1px solid rgba(251,191,36,0.15)", borderRadius: "12px", padding: 16 }}>
                <div style={{ fontSize: 10, color: "var(--text3)", marginBottom: 6, letterSpacing: 1 }}>/{s.lbl}</div>
                <div style={{ fontFamily: "var(--font-d)", fontSize: 24, color: s.renk }}>{s.val}</div>
              </div>
            ))}
          </div>
          <div style={{ background: "var(--bg1)", border: "1px solid rgba(251,191,36,0.15)", borderRadius: "16px", overflow: "auto" }}>
            <table className="tbl">
              <thead><tr><th style={thStyle}>Tarih</th><th style={thStyle}>İşlem</th><th style={thStyle}>Komisyon</th><th style={thStyle}>Abonelik</th><th style={thStyle}>Durum</th></tr></thead>
              <tbody>
                {[
                  { tarih:"03 May", islem:"İstanbul→Gaziantep", kom:"₺525", ab:"—", d:"onaylandı" },
                  { tarih:"02 May", islem:"Pro Üyelik - Mehmet Y.", kom:"—", ab:"₺299", d:"onaylandı" },
                  { tarih:"01 May", islem:"Antalya→İzmir", kom:"₺410", ab:"—", d:"bekliyor" },
                  { tarih:"30 Nis", islem:"Pro Üyelik - Ali K.", kom:"—", ab:"₺299", d:"onaylandı" },
                ].map((r,i)=>(
                  <tr key={`history-${i}`}>
                    <td style={tdStyle}>{r.tarih}</td>
                    <td style={tdStyle}>{r.islem}</td>
                    <td style={{...tdStyle,color:"#10b981",fontWeight:600}}>{r.kom}</td>
                    <td style={{...tdStyle,color:"#3b82f6",fontWeight:600}}>{r.ab}</td>
                    <td style={tdStyle}><div style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0.08) 100%)", color: "#10b981", padding: "4px 10px", borderRadius: "12px", fontSize: 11, fontWeight: 600, display: "inline-block" }}>{r.d}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );

      case "ayarlar": return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { baslik: "Uygulama", alanlar: [{ lbl: "Uygulama Adı", val: "NakliYol" }, { lbl: "Destek E-posta", val: "info@nakliyol.com" }, { lbl: "Versiyon", val: "3.0.0" }] },
            { baslik: "Komisyon", alanlar: [{ lbl: "Komisyon Oranı", val: "%3" }, { lbl: "Pro Üyelik (Aylık)", val: "₺299" }, { lbl: "Kurumsal Üyelik", val: "₺699" }] },
          ].map(grup => (
            <div key={grup.baslik} style={{ background: "var(--bg1)", border: "1px solid rgba(251,191,36,0.15)", borderRadius: "16px", padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <span style={{ fontSize: 18 }}><IconMap.settings size={18} className="icon-primary" /></span>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: "#fbbf24" }}>{grup.baslik}</span>
              </div>
              {grup.alanlar.map(a => (
                <div key={a.lbl} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid rgba(251,191,36,0.1)" }}>
                  <span style={{ fontSize: 13 }}>{a.lbl}</span>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input defaultValue={a.val} style={{ width: 140, background: "var(--bg2)", border: "1px solid rgba(251,191,36,0.1)", borderRadius: "8px", padding: "8px 12px", color: "var(--text)", fontSize: 12 }} />
                    <button style={{ fontSize: 11, padding: "8px 14px", borderRadius: "8px", border: "1px solid rgba(251,191,36,0.2)", background: "none", color: "#fbbf24", cursor: "pointer" }}>Kaydet</button>
                  </div>
                </div>
              ))}
            </div>
          ))}
          <div style={{ background: "var(--bg1)", border: "1px solid rgba(251,191,36,0.15)", borderRadius: "16px", padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 18 }}><IconMap.star size={18} className="icon-primary" /></span>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: "#fbbf24" }}>ÖZELLİKLER</span>
            </div>
            {[["SMS Bildirimleri","on"],["E-posta Bildirimleri","on"],["Belge Zorunluluğu","off"],["Bakım Modu","off"]].map(([lbl,d])=>{
              const [on, setOn] = useState(d==="on");
              return <div key={lbl} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid rgba(251,191,36,0.1)" }}>
                <span style={{ fontSize: 13 }}>{lbl}</span>
                <button style={{ width: 44, height: 24, background: on ? "#10b981" : "var(--bg3)", borderRadius: "12px", position: "relative", cursor: "pointer", transition: "var(--tr)" }}>
                  <div style={{ width: 20, height: 20, background: "#fff", borderRadius: "50%", position: "absolute", top: 2, left: on ? 22 : 2, transition: "var(--tr)" }}></div>
                </button>
              </div>;
            })}
          </div>
        </div>
      );

      default: return null;
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      {/* Sidebar */}
      <div style={{ width: 200, background: "var(--bg1)", borderRight: "1px solid rgba(251,191,36,0.15)", padding: "0", flexShrink: 0, display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh" }}>
        <div style={{ padding: "18px 16px 16px", borderBottom: "1px solid rgba(251,191,36,0.15)" }}>
          <div style={{ fontFamily: "var(--font-d)", fontSize: 20, letterSpacing: 2 }}>NAKLI<span style={{ background: "var(--guldum-gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>YOL</span></div>
          <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 2, letterSpacing: 1 }}>ADMIN PANEL</div>
        </div>
        <div style={{ flex: 1, padding: "8px 0" }}>
          {menu.map(m => (
            <button key={m.key || `menu-${m.label}`} onClick={() => setAktif(m.key)} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10,
              padding: "12px 16px", background: "none", border: "none",
              color: aktif === m.key ? "#fbbf24" : "var(--text3)",
              borderRight: aktif === m.key ? "3px solid #fbbf24" : "3px solid transparent",
              fontSize: 13, fontWeight: aktif === m.key ? 600 : 400,
              cursor: "pointer", textAlign: "left", transition: "var(--tr)",
            }}>
              <span>{m.icon}</span> {m.label}
            </button>
          ))}
        </div>
        <div style={{ padding: 16, borderTop: "1px solid rgba(251,191,36,0.15)" }}>
          <button onClick={cikisYap} style={{ width: "100%", background: "none", border: "1px solid rgba(251,191,36,0.2)", borderRadius: "12px", padding: "10px", color: "var(--text3)", fontSize: 12, cursor: "pointer", transition: "var(--tr)" }} onMouseEnter={e => e.currentTarget.style.borderColor = "#fbbf24"} onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(251,191,36,0.2)"}>← Çıkış</button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflow: "auto" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(251,191,36,0.2)", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "rgba(15,15,15,0.95)", backdropFilter: "blur(14px)", zIndex: 10 }}>
          <div style={{ fontFamily: "var(--font-d)", fontSize: 18, letterSpacing: 1, color: "#fbbf24" }}>{menu.find(m=>m.key===aktif)?.label?.toUpperCase()}</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ background: "linear-gradient(135deg, rgba(251,191,36,0.15) 0%, rgba(251,191,36,0.08) 100%)", color: "#fbbf24", padding: "6px 12px", borderRadius: "12px", fontSize: 11, fontWeight: 600, border: "1px solid rgba(251,191,36,0.2)" }}>{seferlerList.filter(s=>s.durum==="teslima_bekleniyor").length} teslim bekliyor</div>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, var(--guldum-gradient), var(--purple-gradient))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}><IconMap.settings size={16} className="icon-primary" /></div>
          </div>
        </div>
        <div style={{ padding: 20 }}><Sekme /></div>
      </div>
    </div>
  );
}
