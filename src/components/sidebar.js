// Navegación lateral fija: Inicio, Alertas, Historial + cierre de sesión.
// El item activo se resalta según la ruta actual (currentPath).

import { icon } from "../utils/icons.js";
import { getCurrentUser, signOutUser } from "../data/auth.js";
import { escapeHtml } from "../utils/dom.js";

const NAV_ITEMS = [
  { path: "/", label: "Inicio", icon: "home" },
  { path: "/alertas", label: "Alertas", icon: "bell" },
  { path: "/historial", label: "Historial", icon: "history" },
];

export function renderSidebar(currentPath) {
  const user = getCurrentUser();

  return `
    <aside class="sidebar">
      <div class="sidebar-logo">
        <span class="logo-mark">${icon("plane", "logo-mark-plane")}</span>
        <span class="logo-wordmark">Tripflow</span>
      </div>

      <nav class="sidebar-nav">
        ${NAV_ITEMS.map(
          (item) => `
          <a href="#${item.path}" class="sidebar-nav-item${item.path === currentPath ? " is-active" : ""}">
            ${icon(item.icon)}
            <span>${item.label}</span>
          </a>
        `
        ).join("")}
      </nav>

      <div class="sidebar-footer">
        ${user ? `<p class="sidebar-user">${icon("user")}<span>${escapeHtml(user.email)}</span></p>` : ""}
        <button id="sidebar-signout" type="button" class="sidebar-nav-item sidebar-signout">
          ${icon("log-out")}
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  `;
}

export function bindSidebar(container) {
  container.querySelector("#sidebar-signout")?.addEventListener("click", () => {
    signOutUser();
  });
}
