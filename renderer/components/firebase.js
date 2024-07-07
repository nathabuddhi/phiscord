// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCtKp5ELiSU6j0WgxBHfGynjU1jgH1DlPs",
  authDomain: "phiscord-lc118.firebaseapp.com",
  projectId: "phiscord-lc118",
  storageBucket: "phiscord-lc118.appspot.com",
  messagingSenderId: "334719686130",
  appId: "1:334719686130:web:894a4d6b4e73b8da51876b",
  measurementId: "G-YWKQQ38PH5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;