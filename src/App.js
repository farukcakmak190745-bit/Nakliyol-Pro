import React, { useState, useEffect, useRef } from "react";
// Force rebuild - fixing hoisting issues
import { AppProvider, useApp } from "./context/AppContext";
import { MesajProvider, useMesaj } from "./context/MesajContext";
import GirisEkrani from "./pages/GirisEkrani";
import AdminPanel from "./pages/admin/AdminPanel";
import IlanlarSayfasi from "./pages/kamyoncu/IlanlarSayfasi";
import KamyoncuProfil from "./pages/kamyoncu/ProfilSayfasi";
import {
  SeferlerSayfasi,
  MesajlarSayfasi as KamyoncuMesajlarSayfasi
} from "./pages/kamyoncu/DigerSayfalar";
import {
  IlanVerSayfasi,
  TekliflerSayfasi,
  MesajlarSayfasi,
  IssizProfilSayfasi,
  IssizIlanlarSayfasi
} from "./pages/issiz/IssizSayfalar";
import { BildirimlerSayfasi } from "./pages/BildirimlerSayfasi";
import { BildirimlerModal } from "./components/BildirimlerModal";
import ChatSayfasi from "./components/ChatSayfasi";
import HalkaAcikProfil from "./components/HalkaAcikProfil";
import { Header, BottomNav } from "./components/UI";
import AyarlarSayfasi from "./pages/AyarlarSayfasi";
import YasalSayfa from "./pages/YasalSayfa";
import "./index.css";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import LoadingScreen from "./components/LoadingScreen";

function MobilApp({ cikisYap }) {
  const { oturum, ilanlar, seferler, teklifler, konusmaOluştur, seciliProfilId, profiliKapat } = useApp();
  const { konusmalar, loadConversations } = useMesaj();
  const [sekme, setSekme] = useState("ilanlar");
  const [seciliKonusma, setSeciliKonusma] = useState(null);

  // URL'den sekme parametresini oku (hash-based navigation)
  const urlSekmeKullanildi = useRef(false);
  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.split('?')[1] || '');
    const urlSekme = params.get('sekme');
    if (urlSekme) {
      setSekme(urlSekme);
      urlSekmeKullanildi.current = true;
    }
  }, []);

  // ChatSayfasi açma handler
  const onChatAc = (konusmaId, seferBilgileri) => {
    console.log('💬 ChatSayfasi açılıyor:', konusmaId, seferBilgileri);
    setSeciliKonusma(konusmaId);
  };

  // Profil üzerinden "Mesaj Gönder" — konuşma açıp chat'e geç
  const profildenMesaj = async (hedef) => {
    if (!hedef?.id || !oturum?.id) return;
    const konusmaId = await konusmaOluştur({
      userId: oturum.id,
      partnerId: hedef.id,
      partnerAd: hedef.ad || "Kullanıcı",
      partnerRol: oturum.role === "kamyoncu" ? "issiz" : "kamyoncu",
      isTrucker: oturum.role === "kamyoncu",
      konusmaTuru: "direkt",
      baslik: hedef.ad || "Kullanıcı",
      resim: hedef.fotograf || "https://api.dicebear.com/7.x/initials/svg?seed=" + String(hedef.ad || "K").substring(0, 2).toUpperCase()
    });
    if (konusmaId) {
      profiliKapat();
      setSeciliKonusma(konusmaId);
    }
  };

  // Açılan konuşma listede yoksa konuşmaları yeniden yükle
  useEffect(() => {
    if (seciliKonusma && oturum?.id && !konusmalar?.find(k => k.id === seciliKonusma)) {
      loadConversations(oturum.id);
    }
  }, [seciliKonusma, konusmalar, oturum?.id, loadConversations]);

  // Use useMemo to avoid hoisting issues with state variables
  const sayfa = React.useMemo(() => {
    if (!oturum || !oturum.role) return null;
    const kamyoncuSayfalar = {
      ilanlar:     <IlanlarSayfasi />,
      seferler:    <SeferlerSayfasi onChatAc={onChatAc} />,
      mesajlar:    <KamyoncuMesajlarSayfasi />,
      profil:      <KamyoncuProfil />,
      bildirimler: <BildirimlerSayfasi />,
    };
    const issizSayfalar = {
      ilanver:    <IlanVerSayfasi />,
      ilanlarim:  <IssizIlanlarSayfasi />,
      teklifler:  <TekliflerSayfasi onChatAc={onChatAc} />,
      mesajlar:   <MesajlarSayfasi />,
      profil:     <IssizProfilSayfasi />,
    };
    return oturum.role === "kamyoncu" ? kamyoncuSayfalar[sekme] : issizSayfalar[sekme];
  }, [sekme, oturum, onChatAc]);

  console.log("🚀 MobilApp render edildi - oturum:", oturum);



  // Oturum değiştiğinde default sekme'yi ayarla (URL'den gelmediyse)
  useEffect(() => {
    if (urlSekmeKullanildi.current) return;
    if (oturum) {
      if (oturum.role === 'kamyoncu') {
        setSekme("ilanlar");
      } else if (oturum.role === 'issiz' || oturum.role === 'admin') {
        setSekme("ilanver");
      } else {
        setSekme("ilanver");
      }
    }
  }, [oturum?.id]);  // sadece kullanıcı değişiminde, sekme değişimlerinde tetiklenmesin

  if (seciliKonusma) {
    const konusma = konusmalar?.find(k => k.id === seciliKonusma);
    if (!konusma) {
      return (
        <div className="scroll-content" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
          <div style={{ fontSize: 14, color: "var(--text3)" }}>⏳ Konuşma yükleniyor...</div>
        </div>
      );
    }
    // Profil overlay sohbet üzerinde de açılabilsin
    return (
      <>
        <ChatSayfasi konusmaId={seciliKonusma} onGeri={() => setSeciliKonusma(null)} isKamyoncu={oturum.role === "kamyoncu"} />
        {seciliProfilId && <HalkaAcikProfil onGeri={profiliKapat} onMesajGonder={profildenMesaj} />}
      </>
    );
  }

  return (
    <div className="app-shell">
      <Header cikisYap={cikisYap} />
      {sayfa !== undefined && sayfa !== null ? sayfa : null}
      <BottomNav aktif={sekme} setAktif={setSekme} rol={oturum.role} />
      <BildirimlerModal />
      <BildirimlerToast />
      {seciliProfilId && <HalkaAcikProfil onGeri={profiliKapat} onMesajGonder={profildenMesaj} />}
    </div>
  );
}

// Yeni bildirim gelince ekranın üstünde kısa süre görünen toast
function BildirimlerToast() {
  const { toastBildirim, setGosterenBildirim } = useApp();

  if (!toastBildirim) return null;

  return (
    <div
      onClick={() => {
        // Toast'a tıklayınca tam içeriği modal olarak aç
        setGosterenBildirim(toastBildirim);
      }}
      style={{
        position: "fixed",
        top: 70,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 999,
        width: "calc(100% - 32px)",
        maxWidth: 440,
        cursor: "pointer",
        background: "rgba(255,255,255,0.97)",
        border: "1px solid rgba(251,191,36,0.4)",
        boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
        borderRadius: "14px",
        padding: "12px 14px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        animation: "slideDown 0.25s ease"
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: "50%",
        background: "linear-gradient(135deg, var(--guldum-gradient), var(--purple-gradient))",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "#fff", flexShrink: 0
      }}>
        {toastBildirim.icon || '🔔'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#fbbf24" }}>{toastBildirim.baslik}</div>
        <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {toastBildirim.icerik}
        </div>
      </div>
    </div>
  );
}

function AppIceriki() {
  const { oturum, loading, cikisYap } = useApp();

  console.log("🔄 AppIceriki render", { oturum: !!oturum, loading });

  // Session yükleniyorsa (F5 refresh sonrası) bekle
  if (loading && !oturum) {
    console.log("⏳ Session yükleniyor (F5 sonrası normal)");
    return <LoadingScreen />;
  }

  // Loading bitti ama oturum hala yok → giriş ekranına yönlendir
  if (!oturum) {
    console.log("⚠️ Oturum yok, GirisEkrani'a yönlendiriliyor");
    return <Navigate to="/" replace />;
  }

  console.log("✅ AppIceriki - Oturum yüklendi:", oturum.role);

  if (oturum.role === "admin") {
    return <AdminPanel />;
  }

  return <MobilApp cikisYap={cikisYap} />;
}


export default function App() {
  try {
    console.log('🚀 Uygulama başlatılıyor...');
    console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? '✓ Var' : '❌ Yok');

    return (
      <ErrorBoundary>
        <MesajProvider>
          <AppProvider>
            <Routes>
              <Route path="/" element={<GirisEkrani />} />
              <Route path="/app" element={<AppIceriki />} />
              <Route path="/ayarlar" element={<AyarlarSayfasi />} />
              <Route path="/kosullar" element={<YasalSayfa tur="kosullar" />} />
              <Route path="/gizlilik" element={<YasalSayfa tur="gizlilik" />} />
            </Routes>
          </AppProvider>
        </MesajProvider>
      </ErrorBoundary>
    );
  } catch (error) {
    console.error('❌ App Component HATASI:', error);
    return (
      <div style={{
        padding: 40,
        textAlign: 'center',
        fontFamily: 'Arial, sans-serif',
        background: 'var(--bg1)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div>
          <div style={{ fontSize: 48, marginBottom: 20 }}>🚨</div>
          <div style={{ fontSize: 18, color: 'var(--text)', marginBottom: 10 }}>
            Uygulamada hata oluştu
          </div>
          <div style={{ fontSize: 14, color: 'var(--text3)', marginBottom: 20 }}>
            Hata: {error.message}
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              background: 'var(--guldum-gradient)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontSize: 14,
              cursor: 'pointer'
            }}
          >
            Sayfayı Yenile
          </button>
        </div>
      </div>
    );
  }
}
