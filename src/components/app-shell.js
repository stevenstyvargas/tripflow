// Shell de la app autenticada: sidebar fija + área de contenido. En
// mobile, sidebar.js también monta el drawer de nav+sesión (ver
// sidebar.js) — se bindea acá, una sola vez por navegación, en vez de
// en cada página. Cada página renderiza dentro del contenedor que
// devuelve renderShell.

import { renderSidebar, bindSidebar } from "./sidebar.js";

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
  bindSidebar(container);
  return container.querySelector("#app-shell-content");
}
