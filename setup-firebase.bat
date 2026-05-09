@echo off
echo ========================================
echo 🔥 Firebase Kurulum Scripti
echo ========================================
echo.

echo Adım 1: Firebase CLI yuklendi mi?
npm list -g firebase-tools
if %errorlevel% neq 0 (
    echo Firebase CLI yukleniyor...
    npm install -g firebase-tools
)

echo.
echo Adım 2: Firebase Console'dan proje oluşturun:
echo - Git: https://console.firebase.google.com/
echo - "Yeni proje" → Project name: nakliyol-pro
echo - Firestore Database oluştur → Test mode başlat
echo.

pause
echo.
echo Adım 3: Firebase Config'i al:
echo - Proje ayarları (⚙️ ikonu) → Project settings
echo - "Web uygulaması ekle" → nakliyol-web
echo - Firebase config kopyala
echo.

echo Adım 4: .env dosyası oluştur:
echo.

set /p FIREBASE_API_KEY="REACT_APP_FIREBASE_API_KEY: "
set /p FIREBASE_AUTH_DOMAIN="REACT_APP_FIREBASE_AUTH_DOMAIN: "
set /p FIREBASE_PROJECT_ID="REACT_APP_FIREBASE_PROJECT_ID: "
set /p FIREBASE_STORAGE_BUCKET="REACT_APP_FIREBASE_STORAGE_BUCKET: "
set /p FIREBASE_MESSAGING_SENDER_ID="REACT_APP_FIREBASE_MESSAGING_SENDER_ID: "
set /p FIREBASE_APP_ID="REACT_APP_FIREBASE_APP_ID: "

(
    echo REACT_APP_FIREBASE_API_KEY=%FIREBASE_API_KEY%
    echo REACT_APP_FIREBASE_AUTH_DOMAIN=%FIREBASE_AUTH_DOMAIN%
    echo REACT_APP_FIREBASE_PROJECT_ID=%FIREBASE_PROJECT_ID%
    echo REACT_APP_FIREBASE_STORAGE_BUCKET=%FIREBASE_STORAGE_BUCKET%
    echo REACT_APP_FIREBASE_MESSAGING_SENDER_ID=%FIREBASE_MESSAGING_SENDER_ID%
    echo REACT_APP_FIREBASE_APP_ID=%FIREBASE_APP_ID%
) > .env

echo.
echo ✓ .env dosyası oluşturuldu!
echo.

echo Adım 5: Firestore Database kurulumu:
echo - Firebase Console'da Build → Firestore Database
echo - "Create database" → "Test mode başlat" → "Sonraki" → "Enable"
echo.

echo Adım 6: Server'ı yeniden başlat:
echo.
echo npm start yazıp Enter'a basın
echo.

pause
npm start
