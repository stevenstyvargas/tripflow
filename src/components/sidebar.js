// Navegación lateral fija: Inicio, Mis viajes, Alertas. La información
// de cuenta (foto/nombre/email + cerrar sesión) vive en el menú de
// cuenta del header de cada página (components/account-menu.js), no
// acá. El item activo se resalta según la ruta actual (currentPath).
// Historial se fusionó con Mis viajes (ver docs/product-decisions.md) —
// los viajes cerrados viven en su pestaña "Cerrados". Fondo navy (ver
// docs/branding.md): el logo usa la versión "fondo oscuro" de los
// assets reales (public/img/), con dos <img> — logotipo completo en
// desktop, isotipo solo en mobile (`.sidebar-logo-full`/`-compact`,
// alternados por CSS) — ya no es CSS puro (`.logo-mark`).

import { icon } from "../utils/icons.js";

const NAV_ITEMS = [
  { path: "/", label: "Inicio", icon: "home" },
  { path: "/viajes", label: "Mis viajes", icon: "map" },
  { path: "/alertas", label: "Alertas", icon: "bell" },
];

export function renderSidebar(currentPath) {
  return `
    <aside class="sidebar">
      <div class="sidebar-logo">
        <img src="/img/Logotipo-fondo-oscuro.svg" alt="Tripflow" class="sidebar-logo-full" />
        <img src="/img/Isotipo-fondo-oscuro.svg" alt="Tripflow" class="sidebar-logo-compact" />
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
