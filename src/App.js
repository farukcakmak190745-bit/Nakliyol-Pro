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

  // Sekmeyi sadece ilk yüklemede ayarla
  useEffect(() => {
    setSekme(oturum?.rol === "kamyoncu" ? "ilanlar" : "ilanver");
  }, [oturum?.rol]);

  if (!oturum) return <div>Hata: oturum tanımsız</div>;

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
    mesajlar:  <IssizMesajlarSayfasi />,
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
    return <GirisEkrani />;
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
      </div>
      {oturum.rol === "kamyoncu" && <BottomNav aktif="profil" setAktif={() => {}} rol="kamyoncu" />}
    </div>
  );
}

export default function App() {
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
}
