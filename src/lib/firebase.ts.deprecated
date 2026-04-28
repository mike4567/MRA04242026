// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth"; 
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  // Real API Key from your Google Cloud Console
  apiKey: "AIzaSyBACeqNzeiRXGJXuySIeQzYrrVxFUj3xqE",
  
  // Real Auth Domain
  authDomain: "fedramp-app-prod.firebaseapp.com",
  
  projectId: "fedramp-app-prod",
  storageBucket: "mra-media",
  
  messagingSenderId: "243685499638",
  appId: "1:243685499638:web:ae7e70cdb55086651e02d7"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize services
const auth = getAuth(app); 
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };