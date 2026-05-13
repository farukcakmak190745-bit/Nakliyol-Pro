import { useState, useEffect } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { MesajProvider, useMesaj } from "./context/MesajContext";
import GirisEkrani from "./pages/GirisEkrani";
import AdminPanel from "./pages/admin/AdminPanel";
import IlanlarSayfasi from "./pages/kamyoncu/IlanlarSayfasi";
import KamyoncuProfil from "./pages/kamyoncu/ProfilSayfasi";
import {
  SeferlerSayfasi,
  MesajlarSayfasi as KamyoncuMesajlarSayfasi,
  DigerSayfalar
} from "./pages/kamyoncu/DigerSayfalar";
import {
  IlanVerSayfasi,
  TekliflerSayfasi,
  MesajlarSayfasi,
  IssizProfilSayfasi
} from "./pages/issiz/IssizSayfalar";
import BildirimAyarlariSayfasi from "./pages/kamyoncu/BildirimAyarlariSayfasi";
import ChatSayfasi from "./components/ChatSayfasi";
import { Header, BottomNav } from "./components/UI";
import "./index.css";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import LoadingScreen from "./components/LoadingScreen";

function MobilApp({ cikisYap }) {
  const { oturum, konusmalar } = useApp();
  const [sekme, setSekme] = useState("ilanlar");
  const [seciliKonusma, setSeciliKonusma] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);

  // Oturum yüklendiğinde yukleniyor false yap
  useEffect(() => {
    console.log("🔄 Oturum değişti:", oturum);
    console.log("🎭 Oturum rolü:", oturum?.role);

    if (oturum) {
      console.log("🔍 Oturum detayları:", {
        id: oturum.id,
        email: oturum.email,
        role: oturum.role,
        ad: oturum.ad
      });

      // Rolü kontrol et ve doğru sekmeyi seç
      const expectedRole = oturum.role?.toLowerCase();

      console.log("🔍 Beklenen rol:", expectedRole);

      if (expectedRole === 'kamyoncu') {
        console.log("🚚 Kamyoncu olarak giriş yapıldı. Sekme: 'ilanlar'");
        setSekme("ilanlar");
      } else if (expectedRole === 'issiz') {
        console.log("🏢 İşveren olarak giriş yapıldı. Sekme: 'ilanver'");
        setSekme("ilanver");
      } else if (expectedRole === 'admin') {
        console.log("⭐ Admin olarak giriş yapıldı");
        setSekme("ilanver");
      } else {
        console.warn("⚠️ Bilinmeyen rol:", expectedRole, ", default olarak 'ilanver' kullanılıyor");
        setSekme("ilanver");
      }

      setYukleniyor(false);
    }
  }, [oturum]);

  // Timeout fallback - en fazla 5 saniye bekler
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      console.log("Loading timeout - oturum null, boş ekran gösteriliyor");
      if (yukleniyor) {
        setYukleniyor(false);
      }
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [yukleniyor]);

  if (yukleniyor) return <LoadingScreen />;

  if (seciliKonusma) {
    const konusma = konusmalar?.find(k => k.id === seciliKonusma);
    if (!konusma) {
      console.log("Konuşma bulunamadı, çıkılıyor:", seciliKonusma);
      setSeciliKonusma(null);
      return null;
    }
    return <ChatSayfasi konusmaId={seciliKonusma} onGeri={() => setSeciliKonusma(null)} isKamyoncu={oturum.rol === "kamyoncu"} />;
  }

  const kamyoncuSayfalar = {
    ilanlar:  <IlanlarSayfasi />,
    seferler: <SeferlerSayfasi />,
    mesajlar: <KamyoncuMesajlarSayfasi />,
    profil:   <KamyoncuProfil />,
    bildirim: <BildirimAyarlariSayfasi />,
  };
  const issizSayfalar = {
    ilanver:   <IlanVerSayfasi />,
    teklifler: <TekliflerSayfasi />,
    mesajlar:  <MesajlarSayfasi />,
    profil:    <IssizProfilSayfasi />,
  };

  let sayfa;

  if (sekme === "bildirim") {
    sayfa = <BildirimAyarlariSayfasi />;
  } else {
    sayfa = oturum.rol === "kamyoncu" ? kamyoncuSayfalar[sekme] : issizSayfalar[sekme];
  }

  if (!sayfa) {
    console.log("Sayfa bulunamadı:", sekme);
    return <div>Sayfa bulunamadı: {sekme}</div>;
  }

  return (
    <div className="app-shell">
      <Header cikisYap={cikisYap} />
      <div>{sayfa}</div>
      <BottomNav aktif={sekme} setAktif={setSekme} rol={oturum.rol} />
    </div>
  );
}

function AppIceriki() {
  const { oturum, cikisYap } = useApp();

  if (!oturum) {
    console.error("❌ AppIceriki - Oturum yok!");
    return <div style={{ padding: 40, textAlign: 'center', color: 'red' }}>Oturum bilgisi yüklenemedi. Giriş yapılıyor...</div>;
  }

  if (oturum.rol === "admin") {
    return <AdminPanel />;
  }

  return <MobilApp cikisYap={cikisYap} />;
}

function ProfilIcContent({ defaultPath = "profil" }) {
  const { oturum } = useApp();

  if (!oturum) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="app-shell">
      <Header />
      <div>
        {oturum.rol === "kamyoncu" && (
          defaultPath === "bildirim"
            ? <BildirimAyarlariSayfasi />
            : <KamyoncuProfil />
        )}
        {oturum.rol === "issiz" && (
          defaultPath === "bildirim"
            ? <BildirimAyarlariSayfasi />
            : <IssizProfilSayfasi />
        )}
        {oturum.rol === "issiz" && <BottomNav aktif="profil" setAktif={() => {}} rol="issiz" />}
      </div>
      {oturum.rol === "kamyoncu" && <BottomNav aktif="profil" setAktif={() => {}} rol="kamyoncu" />}
    </div>
  );
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
              <Route path="/profil/bildirim" element={<ProfilIcContent defaultPath="bildirim" />} />
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
