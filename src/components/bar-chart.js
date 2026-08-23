// Gráfico de barras verticales por categoría, en orden fijo (el orden de
// EXPENSE_CATEGORIES, nunca por monto). Lo usan tanto Inicio (agregado
// de todos los viajes activos) como el detalle de un viaje (solo ese
// viaje) — mismo componente y misma paleta en las dos vistas, el título
// de cada sección es lo que distingue qué se está viendo.

import { icon } from "../utils/icons.js";
import { formatCurrency } from "../utils/currency.js";

/**
 * @param {{ id: string, label: string, icon: string, value: number, color: string }[]} categories en el orden en que deben mostrarse
 */
export function barChart(categories) {
  const maxValue = Math.max(0, ...categories.map((c) => c.value));

  const bars = categories
    .map((c) => {
      const hasSpend = c.value > 0;
      const heightPercent = maxValue > 0 ? (c.value / maxValue) * 100 : 0;
      const color = hasSpend ? c.color : "var(--color-text-muted)";

      return `
        <li class="bar-chart-item">
          <p class="bar-chart-amount">${formatCurrency(c.value)}</p>
          <div class="bar-chart-track">
            <div class="bar-chart-fill" style="height:${heightPercent}%;background:${color}"></div>
          </div>
          <p class="bar-chart-label">${icon(c.icon, "bar-chart-icon")}<span>${c.label}</span></p>
        </li>
      `;
    })
    .join("");

  return `<ul class="bar-chart">${bars}</ul>`;
}
