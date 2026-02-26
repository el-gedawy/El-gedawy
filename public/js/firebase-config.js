import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { getMessaging, isSupported } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging.js';

// TODO: Replace with your Firebase project's web app configuration.
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_AUTH_DOMAIN',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_STORAGE_BUCKET',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const getMessagingClient = async () => {
  if (!(await isSupported())) return null;
  try {
    return getMessaging(app);
  } catch {
    return null;
  }
};

export { app, auth, db, firebaseConfig, getMessagingClient };
