// Inicialización de Firebase. La config sale de variables de entorno
// (VITE_FIREBASE_*, ver .env.example) para no hardcodear credenciales
// en el código fuente versionado.

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Mensaje único para "faltan variables" (detectable acá, sin llamar a
// Firebase con un config a medio llenar) y "variables presentes pero
// inválidas" (ej. apiKey de otro proyecto — Firebase solo lo descubre
// después, en la primera llamada real a auth, ver error callback de
// onAuthChange en router.js). Mismo texto en los 2 casos a propósito:
// desde la perspectiva del usuario que sigue el README, el diagnóstico
// y el siguiente paso son los mismos.
export const FIREBASE_CONFIG_ERROR =
  "No se pudo conectar con Firebase. Verifica que tu archivo .env tenga las variables VITE_FIREBASE_* configuradas correctamente, ver README.md.";

const missingVars = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

export const firebaseConfigError = missingVars.length > 0 ? FIREBASE_CONFIG_ERROR : null;

// auth/db quedan null si faltan variables — nada de lo que las use
// (auth.js, store.js) se llega a invocar en ese caso: main.js corta
// antes de montar el router, ver firebaseConfigError ahí.
const app = firebaseConfigError ? null : initializeApp(firebaseConfig);

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
