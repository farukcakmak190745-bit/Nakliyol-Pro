import React, { useState, useEffect } from "react";
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
import { Header, BottomNav } from "./components/UI";
import AyarlarSayfasi from "./pages/AyarlarSayfasi";
import "./index.css";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import LoadingScreen from "./components/LoadingScreen";

function MobilApp({ cikisYap }) {
  const { oturum, kullanicilar: adminKullanicilar, ilanlar, seferler, teklifler, bildirimlerList, gosterenBildirim, konusmalar, bildirimGoster } = useApp();
  const [sekme, setSekme] = useState("ilanlar");
  const [seciliKonusma, setSeciliKonusma] = useState(null);

  // ChatSayfasi açma handler
  const onChatAc = (konusmaId, seferBilgileri) => {
    console.log('💬 ChatSayfasi açılıyor:', konusmaId, seferBilgileri);
    setSeciliKonusma(konusmaId);
  };

  // Use useMemo to avoid hoisting issues with state variables
  const sayfa = React.useMemo(() => {
    if (!oturum) return null;
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
      teklifler:  <TekliflerSayfasi />,
      mesajlar:   <MesajlarSayfasi />,
      profil:     <IssizProfilSayfasi />,
    };
    return oturum.role === "kamyoncu" ? kamyoncuSayfalar[sekme] : issizSayfalar[sekme];
  }, [sekme, oturum, onChatAc]);

  console.log("🚀 MobilApp render edildi - oturum:", oturum);

  // Bildirimleri göster
  useEffect(() => {
    if (bildirimlerList && bildirimlerList.length > 0) {
      const enSonBildirim = bildirimlerList[0];
      if (!gosterenBildirim || gosterenBildirim.id !== enSonBildirim.id) {
        bildirimGoster(
          enSonBildirim.baslik,
          enSonBildirim.icerik,
          '🔔'
        );
      }
    }
  }, [bildirimlerList, gosterenBildirim, bildirimGoster]);

  // Oturum değiştiğinde默认 sekme'yi ayarla
  useEffect(() => {
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
      console.log("Konuşma bulunamadı, çıkılıyor:", seciliKonusma);
      setSeciliKonusma(null);
      return null;
    }
    return <ChatSayfasi konusmaId={seciliKonusma} onGeri={() => setSeciliKonusma(null)} isKamyoncu={oturum.role === "kamyoncu"} />;
  }

  return (
    <div className="app-shell">
      <Header cikisYap={cikisYap} />
      <div>{sayfa}</div>
      <BottomNav aktif={sekme} setAktif={setSekme} rol={oturum.role} />
      <BildirimlerModal />
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
