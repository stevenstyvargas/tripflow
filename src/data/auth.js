// Autenticación con Google. Fase 2 del prompt maestro:
// login con Google, sin contraseñas propias que gestionar.

import {
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "./firebase.js";

const provider = new GoogleAuthProvider();

export function signInWithGoogle() {
  return signInWithRedirect(auth, provider);
}

/**
 * Recupera el resultado del signInWithRedirect al volver de Google.
 * Debe llamarse al inicializar la app, antes de mostrar el login.
 */
export function getGoogleRedirectResult() {
  return getRedirectResult(auth);
}

export function signOutUser() {
  return signOut(auth);
}

/** @param {(user: import("firebase/auth").User | null) => void} callback */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

export function getCurrentUser() {
  return auth.currentUser;
}
