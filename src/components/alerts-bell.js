// Campana de acceso rápido a Alertas — visible sin abrir el menú, en
// mobile (header compartido, sidebar.js) y desktop (header de Inicio/
// Mis viajes, únicas 2 pantallas con buscador). Es ADICIONAL al badge
// con número que ya vive en el ítem "Alertas" del sidebar/drawer (ver
// renderNavBadge en sidebar.js) — ese no se toca, sigue funcionando
// igual en paralelo. Acá se reusa la misma fuente de estado
// (getTripAlerts(), data/store.js) pero se muestra como punto simple
// sin número: un solo componente para las 2 variantes, para que la
// lógica de "hay alerta o no" nunca se desincronice entre ellas.

import { icon } from "../utils/icons.js";
import { getTripAlerts } from "../data/store.js";

/**
 * @param {{ variant?: "mobile" | "desktop" }} [options] "mobile" agrega
 *   .sidebar-icon-button (ícono blanco sobre navy, mismo trato que la
 *   lupa/hamburguesa del header mobile); "desktop" (default) queda con
 *   el .icon-button genérico (ícono mudo sobre superficie clara).
 */
export function alertsBell({ variant = "desktop" } = {}) {
  const hasAlerts = getTripAlerts().length > 0;
  const variantClass = variant === "mobile" ? " sidebar-icon-button" : "";

  return `
    <a
      href="#/alertas"
      class="icon-button alerts-bell${variantClass}"
      aria-label="${hasAlerts ? "Alertas: hay viajes que requieren atención" : "Alertas"}"
    >
      ${icon("bell")}
      ${hasAlerts ? `<span class="alerts-bell-dot" aria-hidden="true"></span>` : ""}
    </a>
  `;
}
