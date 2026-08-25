// Campana de acceso rápido a Alertas — visible sin abrir el menú, en
// mobile (header compartido, sidebar.js) y desktop (header de Inicio/
// Mis viajes, únicas 2 pantallas con buscador). Es ADICIONAL al badge
// con número que ya vive en el ítem "Alertas" del sidebar/drawer — ese
// no se toca, sigue funcionando igual en paralelo, y de hecho es el
// mismo renderNavBadge() de acá abajo (sidebar.js lo importa desde este
// módulo en vez de tener su propia copia): mismo número, mismo formato
// "9+", en los 2 lugares a la vez, siempre.

import { icon } from "../utils/icons.js";
import { getTripAlerts } from "../data/store.js";

// "9+" en vez de desbordar el círculo con 2+ dígitos. Única fuente de
// este formato — la usan tanto la campana (acá abajo) como el ítem
// "Alertas" del sidebar (sidebar.js importa esta misma función).
export function renderNavBadge(count) {
  if (count <= 0) return "";
  return `<span class="nav-badge">${count > 9 ? "9+" : count}</span>`;
}

/**
 * @param {{ variant?: "mobile" | "desktop" }} [options] "mobile" agrega
 *   .sidebar-icon-button (ícono blanco sobre navy, mismo trato que la
 *   lupa/hamburguesa del header mobile); "desktop" (default) queda con
 *   el .icon-button genérico (ícono mudo sobre superficie clara).
 */
export function alertsBell({ variant = "desktop" } = {}) {
  const alertsCount = getTripAlerts().length;
  const variantClass = variant === "mobile" ? " sidebar-icon-button" : "";

  return `
    <a
      href="#/alertas"
      class="icon-button alerts-bell${variantClass}"
      aria-label="${alertsCount > 0 ? `Alertas: ${alertsCount} viaje${alertsCount === 1 ? "" : "s"} requieren atención` : "Alertas"}"
    >
      <span class="sidebar-nav-icon">
        ${icon("bell")}
        ${renderNavBadge(alertsCount)}
      </span>
    </a>
  `;
}
