import { initializeApp } from 'firebase/app';
import * as firestore from 'firebase/firestore';

// Bypass TypeScript errors for missing exports by casting the namespace to any.
// This handles cases where the environment's type definitions for Firebase might be outdated or mismatched.
const { 
    getFirestore, 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    setDoc, 
    query, 
    where,
    getCountFromServer
} = firestore as any;

const firebaseConfig = {
  apiKey: "AIzaSyBNBtyQmQrxKv6xqAbdboXl0j6tHh2_wPg",
  authDomain: "project-5197287404933591507.firebaseapp.com",
  projectId: "project-5197287404933591507",
  storageBucket: "project-5197287404933591507.firebasestorage.app",
  messagingSenderId: "981966018084",
  appId: "1:981966018084:web:6a638c172f74224121eab1",
  measurementId: "G-1NY21T37SY"
};

let db: any = null;

try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log("Google Cloud Firestore подключен успешно (Modular Mode)");
} catch (error) {
    console.error("Ошибка подключения к Firebase:", error);
}

export { 
    db, 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    setDoc, 
    query, 
    where,
    getCountFromServer
};