import * as firebaseApp from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBNBtyQmQrxKv6xqAbdboXl0j6tHh2_wPg",
  authDomain: "project-5197287404933591507.firebaseapp.com",
  projectId: "project-5197287404933591507",
  storageBucket: "project-5197287404933591507.firebasestorage.app",
  messagingSenderId: "981966018084",
  appId: "1:981966018084:web:6a638c172f74224121eab1",
  measurementId: "G-1NY21T37SY"
};

let db: Firestore | null = null;

try {
    // Use namespace import and cast to any to avoid "no exported member" error
    // which can happen with certain TS configurations even when v9 is installed.
    const app = (firebaseApp as any).initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log("Google Cloud Firestore подключен успешно");
} catch (error) {
    console.error("Ошибка подключения к Firebase:", error);
}

export { db };