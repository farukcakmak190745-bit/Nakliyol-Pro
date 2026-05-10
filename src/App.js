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

function MobilApp() {
  const { oturum, konusmalar } = useApp();
  const [sekme, setSekme] = useState("ilanlar");
  const [seciliKonusma, setSeciliKonusma] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);

  // Sekmeyi sadece ilk yüklemede ayarla
  useEffect(() => {
    setSekme(oturum?.rol === "kamyoncu" ? "ilanlar" : "ilanver");
    setYukleniyor(false);
  }, [oturum?.rol]);

  if (yukleniyor) return <div>Yükleniyor...</div>;

  if (!oturum) {
    console.error("❌ Oturum yok!");
    return <div style={{ padding: 40, textAlign: 'center', color: 'red' }}>Oturum bilgisi yüklenemedi. Lütfen sayfayı yenileyin.</div>;
  }

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
      <Header />
      <div>{sayfa}</div>
      <BottomNav aktif={sekme} setAktif={setSekme} rol={oturum.rol} />
    </div>
  );
}

function AppIcerigi() {
  const { oturum } = useApp();

  if (!oturum) {
    console.error("❌ AppIcerigi - Oturum yok!");
    return <div style={{ padding: 40, textAlign: 'center', color: 'red' }}>Oturum bilgisi yüklenemedi. Giriş yapılıyor...</div>;
  }

  if (oturum.rol === "admin") {
    return <AdminPanel />;
  }

  return <MobilApp />;
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
    return (
      <ErrorBoundary>
        <HashRouter>
          <MesajProvider>
            <AppProvider>
              <Routes>
                <Route path="/" element={<LoadingScreen />} />
                <Route path="/app" element={<AppIcerigi />} />
                <Route path="/profil/bildirim" element={<ProfilIcContent defaultPath="bildirim" />} />
              </Routes>
            </AppProvider>
          </MesajProvider>
        </HashRouter>
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
