// Shell de la app autenticada: sidebar fija + área de contenido.
// Cada página renderiza dentro del contenedor que devuelve renderShell.

import { renderSidebar } from "./sidebar.js";

/**
 * @param {HTMLElement} container
 * @param {string} currentPath
 * @returns {HTMLElement} el contenedor donde la página debe renderizar
 */
export function renderShell(container, currentPath) {
  container.innerHTML = `
    <div class="app-shell">
      ${renderSidebar(currentPath)}
      <div class="app-shell-content" id="app-shell-content"></div>
    </div>
  `;
  return container.querySelector("#app-shell-content");
}
