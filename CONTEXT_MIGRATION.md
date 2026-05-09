# 🔄 Context Dosyalarını Supabase'e Geçirmek

## Özet
Firebase'den Supabase'e geçiş için tüm context dosyalarını güncelleyeceğiz.

---

## Dosyalar

1. `src/context/AppContext.js` - Kullanıcı ve ilan verileri
2. `src/context/MesajContext.js` - Mesajlaşma sistemi
3. `src/firebase/firestore.js` - Firebase client (değiştirilecek)

---

## Adım 1: AppContext.js Güncelleme

### Mevcut Firebase:
```javascript
import { collection, addDoc, getDocs, onSnapshot, doc, updateDoc } from "firebase/firestore";
```

### Yeni Supabase:
```javascript
import { supabase } from "../supabase/supabaseClient";
```

---

## Adım 2: Fonksiyon Örnekleri

### Kullanıcı Girişi
```javascript
// Firebase
const { data } = await getDocs(collection(db, "kullanicilar"));

// Supabase
const { data, error } = await supabase.from('users').select('*');
```

### İlan Ekleme
```javascript
// Firebase
const docRef = await addDoc(ilanlarRef, ilanVerisi);

// Supabase
const { data, error } = await supabase.from('ilanlar').insert([ilanVerisi]).select();
```

### İlan Güncelleme
```javascript
// Firebase
await updateDoc(doc(db, "ilanlar", ilanId), { durum: "alindi" });

// Supabase
await supabase.from('ilanlar').update({ durum: "alindi" }).eq('id', ilanId);
```

---

## Yol Haritası

1. `src/context/AppContext.js` - Firebase'i sil, Supabase import et
2. Tüm `collection()` çağrılarını `supabase.from('tablo')` ile değiştir
3. Tüm `doc()` çağrılarını `.eq('id', ...)` ile değiştir
4. Tüm `addDoc()` çağrılarını `.insert()` ile değiştir
5. Tüm `updateDoc()` çağrılarını `.update()` ile değiştir

---

## RLS Notları

Supabase RLS (Row Level Security) otomatik authentication kontrolü yapar.
Aynı kullanıcı veriye erişemez.

---

## Dönüştürme Şeması

| Firebase | Supabase |
|----------|----------|
| `collection(db, "ilanlar")` | `supabase.from('ilanlar')` |
| `doc(db, "ilanlar", id)` | `.eq('id', id)` |
| `addDoc(ilanlarRef, veri)` | `.insert([veri])` |
| `updateDoc(docRef, veri)` | `.update(veri).eq('id', id)` |
| `deleteDoc(docRef)` | `.delete().eq('id', id)` |
| `getDocs(query)` | `.select('*')` (veya `.select('sütunlar')`) |
| `onSnapshot(query, callback)` | Realtime Subscription (After) |

---

## README Güncelleme

Proje README dosyasına Supabase geçişini ekleyin.
