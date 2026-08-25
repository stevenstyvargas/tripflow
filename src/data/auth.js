// Autenticación con Google. Fase 2 del prompt maestro:
// login con Google, sin contraseñas propias que gestionar.

import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "./firebase.js";

const provider = new GoogleAuthProvider();

// Códigos que indican que el navegador bloqueó el popup (AdBlock,
// restricciones de terceros), no que el usuario lo cerró a propósito.
// En ambos casos Firebase reporta el mismo código, así que no hay forma
// 100% confiable de distinguirlos — caer a redirect es seguro en los dos
// casos: si fue intencional, el usuario simplemente ve la pantalla de
// Google de nuevo.
const POPUP_BLOCKED_CODES = new Set([
  "auth/popup-blocked",
  "auth/popup-closed-by-user",
]);

export async function signInWithGoogle() {
  try {
    return await signInWithPopup(auth, provider);
  } catch (err) {
    if (POPUP_BLOCKED_CODES.has(err.code)) {
      return signInWithRedirect(auth, provider);
    }
    throw err;
  }
}

/**
 * Recupera el resultado del signInWithRedirect al volver de Google
 * (fallback cuando el popup fue bloqueado). Debe llamarse al
 * inicializar la app, antes de mostrar el login.
 */
export function getGoogleRedirectResult() {
  return getRedirectResult(auth);
}

export function signOutUser() {
  return signOut(auth);
}

/**
 * @param {(user: import("firebase/auth").User | null) => void} callback
 * @param {(error: Error) => void} [onError] Variables presentes pero
 *   inválidas (ej. apiKey de otro proyecto) recién fallan acá, en la
 *   primera llamada real a Firebase — a diferencia de "faltan
 *   variables", que se detecta antes en firebase.js sin llegar a este
 *   punto.
 */
export function onAuthChange(callback, onError) {
  return onAuthStateChanged(auth, callback, onError);
}

export function getCurrentUser() {
  return auth.currentUser;
}
