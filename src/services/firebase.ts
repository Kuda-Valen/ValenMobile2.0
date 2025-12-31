import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import {
  getReactNativePersistence,
  initializeAuth
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your provided Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCnbMQymfJr88mwNj2b_Y8XIJppWg-AX_c",
  authDomain: "my-website-94468.firebaseapp.com",
  projectId: "my-website-94468",
  storageBucket: "my-website-94468.firebasestorage.app",
  messagingSenderId: "944915839141",
  appId: "1:944915839141:web:47e20cfffc2d162bb4b54c",
  measurementId: "G-GFBLGLFKCV"
};

// Prevent "App already exists" error on refresh
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth with Persistence so users stay logged in on mobile
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
}); 

const db = getFirestore(app);
const storage = getStorage(app);

// This ID MUST match your Firestore security rules path
export const VALEN_APP_ID = "valen-mobile-v1"; 

export { auth, db, storage };
