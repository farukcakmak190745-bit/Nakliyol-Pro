# Demo Butonları Kaldırma Planı

Demo butonları gerçek kullanıcıya sunulduğunda kaldırılacak.

---

## Kaldırılacak Bileşenler

### 1. GirisEkrani.js'de

Aşağıdaki kod bloğu tamamen kaldırılacak:

```javascript
<div style={{ textAlign: "center", marginTop: 12 }}>
  <div style={{ fontSize: 10, color: "var(--text3)", marginBottom: 10, letterSpacing: 1.5 }}>VEYA HIZLI GİRİŞ</div>
  <div style={{ display: "flex", gap: 8 }}>
    {roller.map(r => (
      <button
        key={r.key}
        onClick={() => girisYapDemo(r.key, "Demo " + r.baslik)}
        style={{ flex: 1, background: "var(--bg1)", border: "1px solid var(--border2)", borderRadius: "12px", padding: "12px 10px", color: "var(--text)", cursor: "pointer", fontSize: 11, transition: "var(--tr)" }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = r.renk; e.currentTarget.style.background = "var(--bg2)"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border2)"; e.currentTarget.style.background = "var(--bg1)"; }}
      >
        <span style={{ fontSize: 22, display: "block", marginBottom: 4 }}>{r.icon}</span>
        {r.baslik} Demo
      </button>
    ))}
  </div>
</div>
```

---

## Neden Kaldırılacak?

1. **Demo modu kapatıldı** - Artık gerçek kullanıcı sistemi aktif
2. **Hata riski** - Demo butonları yanlış kullanıcıya girilmesini önler
3. **Güvenlik** - Gerçek kullanıcılar için daha profesyonel görünüm

---

## Gerçek Sisteme Geçtiğinde

1. Supabase kurulumu tamamlandığında:
   - Demo butonları `GirisEkrani.js`'den tamamen kaldırılacak
   - Yalnızca email/şifre giriş kalacak

2. Admin paneli için özel demo:
   - Admin panelinde test kullanıcıları oluşturulacak
   - Bu tekilleştirilecek

---

## Yerine Ne Gelecek?

Sadece şunlar kalacak:

1. **Kayıt Ol** butonu (kullanıcı yeni kayıt olabilir)
2. **Giriş Yap** butonu (mevcut kullanıcı girişi)

Basit, profesyonel ve temiz.

---

**Şimdi demo butonlarını kaldıralım ama önce Supabase kurulumu bitmeli.**
