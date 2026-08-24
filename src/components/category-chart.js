// "Gasto por categoría", unificado por BREAKPOINT en vez de por
// pantalla: torres (components/bar-chart.js) en desktop, dona
// (components/donut-chart.js) en mobile — antes Inicio siempre
// mostraba la dona y Detalle de viaje siempre la torre, cada uno fijo
// a su plataforma, sin importar el ancho de pantalla. Ambos formatos
// quedan en el DOM (misma técnica que .sidebar-logo-full/-compact,
// .search-field/.mobile-search-row, etc.): el CSS decide cuál se ve
// según el ancho (ver .category-chart-bars/.category-chart-donut en
// base.css), sin duplicar el cálculo de %/montos por categoría que ya
// hace cada página (dashboard.js agregado de todos los viajes activos,
// trip-detail.js de UN viaje) antes de llamar a este componente.

import { barChart } from "./bar-chart.js";
import { donutChart } from "./donut-chart.js";

/**
 * @param {{ id: string, label: string, icon: string, value: number, color: string }[]} categories
 */
export function categoryChart(categories) {
  return `
    <div class="category-chart">
      <div class="category-chart-bars">${barChart(categories)}</div>
      <div class="category-chart-donut">${donutChart(categories)}</div>
    </div>
  `;
}
