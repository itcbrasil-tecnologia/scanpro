// lib/firebase/config.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Suas chaves do Firebase. NUNCA exponha chaves sensíveis no lado do cliente.
// As chaves do SDK do cliente são projetadas para serem públicas.
const firebaseConfig = {
  apiKey: "AIzaSyCfmPQEWQH-PTsFiiEuaBs9uxpghK0qYjk",
  authDomain: "scanpro-fbd26.firebaseapp.com",
  projectId: "scanpro-fbd26",
  storageBucket: "scanpro-fbd26.firebasestorage.app",
  messagingSenderId: "72131923710",
  appId: "1:72131923710:web:6d7cbb53553f452cafdfaf",
};

// Inicializa o Firebase
// Garante que a inicialização ocorra apenas uma vez (evita erros no hot-reloading do Next.js)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
