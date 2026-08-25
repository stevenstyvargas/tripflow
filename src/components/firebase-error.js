// Pantalla de fallback cuando Firebase no se puede usar (variables de
// entorno faltantes, detectado en data/firebase.js antes de montar el
// router; o presentes pero inválidas, que Firebase solo reporta en la
// primera llamada real — ver el error callback de onAuthChange en
// router.js). Sin esto, la app quedaba en pantalla en blanco: el
// listener de auth nunca invocaba su callback de éxito, así que nada
// se llegaba a renderizar en #app (hallazgo de la auditoría integral
// pre-entrega, ver docs/ai-process.md).

import { FIREBASE_CONFIG_ERROR } from "../data/firebase.js";
import { icon } from "../utils/icons.js";

/** @param {HTMLElement} container */
export function renderFirebaseConfigError(container) {
  container.innerHTML = `
    <main class="firebase-config-error">
      ${icon("alert-octagon")}
      <h1>No se pudo conectar con Firebase</h1>
      <p>${FIREBASE_CONFIG_ERROR}</p>
    </main>
  `;
}
