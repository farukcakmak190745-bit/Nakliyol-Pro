# 🔥 Firebase Setup Assistant

Click this link to open Firebase Console and create a new project:

https://console.firebase.google.com/

**Steps:**

1. Click "Create Project" button
2. Project name: `nakliyol-pro`
3. Location: Turkey
4. Click "Create"

After creating the project, follow these steps:

### 1. Create Firestore Database

1. In Firebase Console, click "Build" → "Firestore Database"
2. Click "Create database"
3. Choose "Test mode" (for development)
4. Choose "Nearby" location

### 2. Get Firebase Config

1. Click the gear icon (⚙️) → "Project settings"
2. Scroll to "Your apps" section
3. Click the web icon (<<) to add a web app
4. Register app with nickname: `nakliyol-web`
5. Copy the `firebaseConfig` object:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyDxxxxx",
  authDomain: "nakliyol-pro.firebaseapp.com",
  projectId: "nakliyol-pro",
  storageBucket: "nakliyol-pro.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

### 3. Configure Environment Variables

1. Edit `.env` file in project root
2. Add these lines:

```
REACT_APP_FIREBASE_API_KEY=your-api-key-here
REACT_APP_FIREBASE_AUTH_DOMAIN=nakliyol-pro.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=nakliyol-pro
REACT_APP_FIREBASE_STORAGE_BUCKET=nakliyol-pro.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
```

### 4. Restart Development Server

```bash
npm start
```

---

**Need help?** Open the FIREBASE_SETUP.md file in this folder for detailed instructions.
