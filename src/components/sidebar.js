// Navegación lateral fija: Inicio, Mis viajes, Alertas, Historial. La
// información de cuenta (foto/nombre/email + cerrar sesión) vive en el
// menú de cuenta del header de cada página (components/account-menu.js),
// no acá. El item activo se resalta según la ruta actual (currentPath).

import { icon } from "../utils/icons.js";

const NAV_ITEMS = [
  { path: "/", label: "Inicio", icon: "home" },
  { path: "/viajes", label: "Mis viajes", icon: "map" },
  { path: "/alertas", label: "Alertas", icon: "bell" },
  { path: "/historial", label: "Historial", icon: "history" },
];

export function renderSidebar(currentPath) {
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
    </aside>
  `;
}
