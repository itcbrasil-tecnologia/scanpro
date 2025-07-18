// lib/firebase/config.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Suas chaves do Firebase. NUNCA exponha chaves sensíveis no lado do cliente.
// As chaves do SDK do cliente são projetadas para serem públicas.
const firebaseConfig = {
  apiKey: "AIzaSyAWGRIFERJ6I5NITSpe_mvNxbQ0xC2yMlE",
  authDomain: "itcbrasil-adbed.firebaseapp.com",
  projectId: "itcbrasil-adbed",
  storageBucket: "itcbrasil-adbed.firebasestorage.app", // Mantido conforme solicitado.
  messagingSenderId: "765244535921",
  appId: "1:765244535921:web:7370a2b1bba7d5582ed7d0",
};

// Inicializa o Firebase
// Garante que a inicialização ocorra apenas uma vez (evita erros no hot-reloading do Next.js)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
