import { useState } from "react";
import { useApp } from "../../context/AppContext";
import { IconMap } from "../../components/Icons";
import { formatTarih, vadeTarihiniBul, vadeGectiMi } from "../../components/UI";

const menu = [
  { key: "ozet", icon: "activity", label: "Özet" },
  { key: "ilanlar", icon: "file", label: "İlanlar" },
  { key: "seferler", icon: "map", label: "Seferler" },
  { key: "kullanicilar", icon: "users", label: "Kullanıcılar" },
  { key: "gelir", icon: "creditcard", label: "Gelir" },
  { key: "ihtilaflar", icon: "alert", label: "İhtilaflar" },
  { key: "ayarlar", icon: "settings", label: "Ayarlar" },
];

export default function AdminPanel() {
  const { oturum, ilanlar, seferler, kullanicilar, ilanSil, odemeYap, odemeOnayla, cikisYap, ihtilaflar, ihtilafCoz, kullaniciDurumuGuncelle, kullaniciRolunuGuncelle, kullaniciSil, ilanDurumuGuncelle, seferDurumuGuncelle, bildirimGonder, duyuruGonder } = useApp();
  const [aktif, setAktif] = useState("ozet");
  const [mobilMenu, setMobilMenu] = useState(false);
  const [ilanFiltre, setIlanFiltre] = useState("aktif");

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
              { val: seferlerList.filter(s=>s.durum==="yolda"||s.durum==="teslima_bekleniyor").length, lbl: "Aktif Sefer", renk: "#1d4ed8", icon: "map" },
              { val: kullanicilarList.length, lbl: "Toplam Kullanıcı", renk: "#1d4ed8", icon: "users" },
              { val: seferlerList.filter(s => s.durum === "teslima_bekleniyor" && vadeGectiMi(vadeTarihiniBul(s))).length, lbl: "Geciken Ödeme", renk: "#ef4444", icon: "alert" },
              { val: (ihtilaflar || []).filter(i => i.durum === "acik").length, lbl: "Açık İhtilaf", renk: "#ea580c", icon: "alert" },
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
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", gap: 8 }}>
            {["aktif", "pasif", "silindi"].map(d => (
              <button key={d} onClick={() => setIlanFiltre(d)} style={{ padding: "8px 14px", borderRadius: "10px", fontSize: 12, fontWeight: 600, border: "1px solid rgba(251,191,36,0.2)", background: ilanFiltre === d ? "rgba(251,191,36,0.15)" : "none", color: ilanFiltre === d ? "#fbbf24" : "var(--text3)", cursor: "pointer" }}>
                {d === "aktif" ? "Aktif" : d === "pasif" ? "Pasif" : "Silinen"}
              </button>
            ))}
          </div>
          <div style={{ background: "var(--bg1)", border: "1px solid rgba(251,191,36,0.15)", borderRadius: "16px", overflow: "auto" }}>
            <table className="tbl">
              <thead><tr><th style={thStyle}>Yük</th><th style={thStyle}>Güzergah</th><th style={thStyle}>Ücret</th><th style={thStyle}>Durum</th><th style={thStyle}>İşlem</th></tr></thead>
              <tbody>{ilanlar.filter(i => i.durum === ilanFiltre).map(i => (
                <tr key={i.id}>
                  <td style={tdStyle}>{i.yuk}</td>
                  <td style={tdStyle}>{i.nereden}→{i.nereye}</td>
                  <td style={{...tdStyle,color:"#fbbf24",fontWeight:700}}>₺{Number(i.ucret||0).toLocaleString()}</td>
                  <td style={tdStyle}><div style={{ background: i.durum === "aktif" ? "rgba(16,185,129,0.1)" : i.durum === "pasif" ? "rgba(245,158,11,0.1)" : "rgba(239,68,68,0.1)", color: i.durum === "aktif" ? "#10b981" : i.durum === "pasif" ? "#f59e0b" : "#ef4444", padding: "4px 10px", borderRadius: "12px", fontSize: 11, fontWeight: 600, display: "inline-block" }}>{i.durum === "aktif" ? "Aktif" : i.durum === "pasif" ? "Pasif" : "Silindi"}</div></td>
                  <td style={tdStyle}>
                    {i.durum === "aktif" ? (
                      <button onClick={() => { ilanDurumuGuncelle(i.id, "pasif"); alert("⏸ İlan pasife alındı."); }} style={{...btnStyle,border:"1px solid rgba(245,158,11,0.3)",background:"rgba(245,158,11,0.08)",color:"#f59e0b"}}>⏸ Pasif</button>
                    ) : (
                      <button onClick={() => { ilanDurumuGuncelle(i.id, "aktif"); alert("✓ İlan aktifleştirildi."); }} style={{...btnStyle,border:"1px solid rgba(16,185,129,0.3)",background:"rgba(16,185,129,0.08)",color:"#10b981"}}>✓ Aktif</button>
                    )}
                    {i.durum === "aktif" && (
                      <button onClick={()=>ilanSil(i.id)} style={{...btnStyle,border:"1px solid rgba(239,68,68,0.3)",background:"rgba(239,68,68,0.08)",color:"#ef4444"}}>Kaldır</button>
                    )}
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
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
            <thead><tr><th style={thStyle}>Yük</th><th style={thStyle}>Güzergah</th><th style={thStyle}>Kamyoncu</th><th style={thStyle}>Ücret</th><th style={thStyle}>Teslim</th><th style={thStyle}>Durum</th><th style={thStyle}>İşlem</th></tr></thead>
            <tbody>{seferler.map(s => (
              <tr key={s.id}>
                <td style={tdStyle}>{s.yuk}</td>
                <td style={tdStyle}>{s.nereden}→{s.nereye}</td>
                <td style={tdStyle}>{s.kamyoncu} • {s.plaka}</td>
                <td style={{...tdStyle,color:"#fbbf24",fontWeight:700}}>₺{Number(s.ucret||0).toLocaleString()}</td>
                <td style={tdStyle}>{formatTarih(s.teslim_tarihi)}</td>
                <td style={tdStyle}>
                  <select
                    value={s.durum}
                    onChange={(e) => seferDurumuGuncelle(s.id, e.target.value)}
                    style={{ background: "var(--bg2)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: "8px", padding: "6px 10px", color: "var(--text)", fontSize: 12 }}
                  >
                    <option value="bekliyor">Bekliyor</option>
                    <option value="yolda">Yolda</option>
                    <option value="teslima_bekleniyor">Teslim Bekleniyor</option>
                    <option value="odendi">Ödendi</option>
                  </select>
                  {s.durum === "teslima_bekleniyor" && vadeGectiMi(vadeTarihiniBul(s)) && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 4 }}>⚠️ Vade geçti</div>}
                </td>
                <td style={tdStyle}>
                  {s.durum === "teslima_bekleniyor" && s.odeme_durumu !== "odendi" && (
                    <button onClick={() => { odemeOnayla(s.id); alert("✅ Ödeme onaylandı, kamyoncuya bildirildi."); }} style={{...btnStyle,border:"1px solid rgba(16,185,129,0.3)",background:"rgba(16,185,129,0.1)",color:"#10b981"}}>💰 Onayla</button>
                  )}
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      );

      case "kullanicilar": return (
        <div style={{ background: "var(--bg1)", border: "1px solid rgba(251,191,36,0.15)", borderRadius: "16px", overflow: "auto" }}>
          <table className="tbl">
            <thead><tr><th style={thStyle}>Ad</th><th style={thStyle}>Rol</th><th style={thStyle}>Telefon</th><th style={thStyle}>Durum</th><th style={thStyle}>İşlem</th></tr></thead>
            <tbody>{kullanicilar.map(k => {
              const rol = k.role || k.rol || "—";
              const pasif = k.durum === "pasif";
              return (
              <tr key={k.id}>
                <td style={tdStyle}>{k.ad}</td>
                <td style={tdStyle}><div style={{ background: "linear-gradient(135deg, rgba(29,78,216,0.15) 0%, rgba(29,78,216,0.08) 100%)", color: "#1d4ed8", padding: "4px 10px", borderRadius: "12px", fontSize: 11, fontWeight: 600, display: "inline-block" }}>{rol}</div></td>
                <td style={tdStyle}>{k.telefon || "-"}</td>
                <td style={tdStyle}><div style={{ background: pasif ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)", color: pasif ? "#ef4444" : "#10b981", padding: "4px 10px", borderRadius: "12px", fontSize: 11, fontWeight: 600, display: "inline-block" }}>{pasif ? "Askıda" : "Aktif"}</div></td>
                <td style={tdStyle}>
                  <button
                    onClick={() => {
                      kullaniciDurumuGuncelle(k.id, pasif ? "aktif" : "pasif");
                      alert(`${k.ad} ${pasif ? "aktifleştirildi" : "askıya alındı"}. Askıdaki kullanıcı giriş yapamaz.`);
                    }}
                    style={{...btnStyle,border: pasif ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(239,68,68,0.3)", background: pasif ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)", color: pasif ? "#10b981" : "#ef4444"}}
                  >{pasif ? "✓ Aktifleştir" : "🚫 Askıya Al"}</button>
                  {k.id !== oturum?.id && (
                    <>
                      <button
                        onClick={() => {
                          const yeniRol = prompt("Yeni rol (kamyoncu / issiz / admin):", rol);
                          if (!yeniRol || !["kamyoncu", "issiz", "admin"].includes(yeniRol.trim())) { alert("Geçersiz rol!"); return; }
                          kullaniciRolunuGuncelle(k.id, yeniRol.trim());
                          alert("✅ Rol güncellendi.");
                        }}
                        style={{...btnStyle,border:"1px solid rgba(251,191,36,0.3)",background:"rgba(251,191,36,0.1)",color:"#fbbf24"}}
                      >🔄 Rol</button>
                      <button
                        onClick={() => {
                          const mesaj = prompt(`${k.ad} için gönderilecek mesaj:`);
                          if (mesaj === null || !mesaj.trim()) return;
                          bildirimGonder(k.id, "📩 Admin Mesajı", mesaj.trim());
                          alert("✅ Bildirim gönderildi.");
                        }}
                        style={{...btnStyle,border:"1px solid rgba(29,78,216,0.3)",background:"rgba(29,78,216,0.1)",color:"#1d4ed8"}}
                      >📨 Mesaj</button>
                      <button
                        onClick={async () => {
                          if (!confirm(`${k.ad} adlı kullanıcıyı kalıcı olarak silmek istediğinize emin misiniz?\n\nİlanları, seferleri ve tüm kayıtları silinir.`)) return;
                          try {
                            await kullaniciSil(k.id);
                            alert("🗑 Kullanıcı silindi.");
                          } catch (e) {
                            alert("Silme hatası: " + (e.message || e));
                          }
                        }}
                        style={{...btnStyle,border:"1px solid rgba(239,68,68,0.3)",background:"rgba(239,68,68,0.08)",color:"#ef4444"}}
                      >🗑 Sil</button>
                    </>
                  )}
                </td>
              </tr>
            )})}</tbody>
          </table>
        </div>
      );

      case "gelir": {
        const odendiler = seferlerList.filter(s => s.durum === "odendi");
        const bekleyenler = seferlerList.filter(s => s.durum === "teslima_bekleniyor");
        const toplam = odendiler.reduce((t, s) => t + Number(s.ucret || 0), 0);
        const bekleyenToplam = bekleyenler.reduce((t, s) => t + Number(s.ucret || 0), 0);
        const komisyon = toplam * 0.03;
        return (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            {[
              { lbl: "Toplam Ciro (Ödenen)", val: `₺${toplam.toLocaleString("tr-TR")}`, renk: "#10b981" },
              { lbl: "Komisyon (%3)", val: `₺${komisyon.toLocaleString("tr-TR")}`, renk: "#1d4ed8" },
              { lbl: "Bekleyen Ödeme", val: `₺${bekleyenToplam.toLocaleString("tr-TR")}`, renk: "#ea580c" },
              { lbl: "Ödenen Sefer", val: odendiler.length, renk: "#fbbf24" },
            ].map(s => (
              <div key={s.lbl} style={{ background: "var(--bg1)", border: "1px solid rgba(251,191,36,0.15)", borderRadius: "12px", padding: 16 }}>
                <div style={{ fontSize: 10, color: "var(--text3)", marginBottom: 6, letterSpacing: 1 }}>/{s.lbl}</div>
                <div style={{ fontFamily: "var(--font-d)", fontSize: 24, color: s.renk }}>{s.val}</div>
              </div>
            ))}
          </div>
          <div style={{ background: "var(--bg1)", border: "1px solid rgba(251,191,36,0.15)", borderRadius: "16px", overflow: "auto" }}>
            <table className="tbl">
              <thead><tr><th style={thStyle}>Yük</th><th style={thStyle}>Güzergah</th><th style={thStyle}>Kamyoncu</th><th style={thStyle}>Ödeme Tarihi</th><th style={thStyle}>Ücret</th><th style={thStyle}>Komisyon</th></tr></thead>
              <tbody>
                {odendiler.map(s => (
                  <tr key={s.id}>
                    <td style={tdStyle}>{s.yuk}</td>
                    <td style={tdStyle}>{s.nereden}→{s.nereye}</td>
                    <td style={tdStyle}>{s.kamyoncu}</td>
                    <td style={tdStyle}>{formatTarih(s.odeme_tarihi)}</td>
                    <td style={{...tdStyle,color:"#fbbf24",fontWeight:700}}>₺{Number(s.ucret||0).toLocaleString("tr-TR")}</td>
                    <td style={{...tdStyle,color:"#10b981",fontWeight:600}}>₺{(Number(s.ucret||0)*0.03).toLocaleString("tr-TR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        );
      }

      case "ihtilaflar": {
        const aciklar = (ihtilaflar || []).filter(i => i.durum === "acik");
        const cozulenler = (ihtilaflar || []).filter(i => i.durum === "cozuldu");
        const adBul = (uid) => kullanicilarList.find(k => k.id === uid)?.ad || "—";
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ background: "linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(239,68,68,0.08) 100%)", color: "#ef4444", padding: "6px 12px", borderRadius: "12px", fontSize: 11, fontWeight: 600, border: "1px solid rgba(239,68,68,0.3)" }}>{aciklar.length} açık ihtilaf</div>
              <div style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0.08) 100%)", color: "#10b981", padding: "6px 12px", borderRadius: "12px", fontSize: 11, fontWeight: 600, border: "1px solid rgba(16,185,129,0.3)" }}>{cozulenler.length} çözüldü</div>
            </div>
            <div style={{ background: "var(--bg1)", border: "1px solid rgba(251,191,36,0.15)", borderRadius: "16px", overflow: "auto" }}>
              <table className="tbl">
                <thead><tr><th style={thStyle}>Kamyoncu</th><th style={thStyle}>Sefer</th><th style={thStyle}>Sebep</th><th style={thStyle}>Tarih</th><th style={thStyle}>Durum</th><th style={thStyle}>İşlem</th></tr></thead>
                <tbody>
                  {(ihtilaflar || []).map(i => {
                    const sefer = seferlerList.find(s => s.id === i.sefer_id);
                    return (
                      <tr key={i.id}>
                        <td style={tdStyle}>{adBul(i.acan_id)}</td>
                        <td style={tdStyle}>{sefer ? `${sefer.yuk} - ${sefer.nereden}→${sefer.nereye}` : "—"}</td>
                        <td style={tdStyle}>{i.sebep}</td>
                        <td style={tdStyle}>{formatTarih(i.olusturma_zamani)}</td>
                        <td style={tdStyle}>
                          <div style={{ background: i.durum === "acik" ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)", color: i.durum === "acik" ? "#ef4444" : "#10b981", padding: "4px 10px", borderRadius: "12px", fontSize: 11, fontWeight: 600, display: "inline-block" }}>{i.durum === "acik" ? "Açık" : "Çözüldü"}</div>
                          {i.admin_notu && <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}>📝 {i.admin_notu}</div>}
                        </td>
                        <td style={tdStyle}>
                          {i.durum === "acik" && (
                            <button
                              onClick={() => {
                                const not = prompt("Çözüm notu (açan kullanıcıya gönderilecek):");
                                if (not === null) return;
                                ihtilafCoz(i.id, not || "");
                                alert("✅ İhtilaf çözüldü ve taraflara bildirildi.");
                              }}
                              style={{ ...btnStyle, border: "1px solid rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.1)", color: "#10b981" }}
                            >Çöz</button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      }

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
              color: aktif === m.key ? "#1d4ed8" : "var(--text3)",
              borderRight: aktif === m.key ? "3px solid #1d4ed8" : "3px solid transparent",
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
        <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(251,191,36,0.2)", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(14px)", zIndex: 10 }}>
          <div style={{ fontFamily: "var(--font-d)", fontSize: 18, letterSpacing: 1, color: "#1d4ed8" }}>{menu.find(m=>m.key===aktif)?.label?.toUpperCase()}</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={() => {
                const baslik = prompt("Duyuru başlığı:");
                if (baslik === null) return;
                const icerik = prompt("Duyuru içeriği:");
                if (icerik === null || !icerik.trim()) return;
                duyuruGonder(baslik.trim() || "Duyuru", icerik.trim());
                alert("✅ Duyuru tüm kullanıcılara gönderildi.");
              }}
              style={{ background: "linear-gradient(135deg, rgba(251,191,36,0.15) 0%, rgba(251,191,36,0.08) 100%)", color: "#fbbf24", padding: "6px 12px", borderRadius: "12px", fontSize: 11, fontWeight: 600, border: "1px solid rgba(251,191,36,0.2)", cursor: "pointer" }}
            >📢 Duyuru Gönder</button>
            <div style={{ background: "linear-gradient(135deg, rgba(29,78,216,0.15) 0%, rgba(29,78,216,0.08) 100%)", color: "#1d4ed8", padding: "6px 12px", borderRadius: "12px", fontSize: 11, fontWeight: 600, border: "1px solid rgba(29,78,216,0.2)" }}>{seferlerList.filter(s=>s.durum==="teslima_bekleniyor").length} teslim bekliyor</div>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, var(--guldum-gradient), var(--purple-gradient))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}><IconMap.settings size={16} className="icon-primary" /></div>
          </div>
        </div>
        <div style={{ padding: 20 }}><Sekme /></div>
      </div>
    </div>
  );
}
