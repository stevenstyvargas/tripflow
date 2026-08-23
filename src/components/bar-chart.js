// Gráfico de barras verticales por categoría, en orden fijo (el orden de
// EXPENSE_CATEGORIES, nunca por monto) — para la vista agregada de
// Inicio. A propósito es un tipo de gráfico distinto al de la dona que
// vive en el detalle de viaje: la dona es "cómo se reparte ESTE viaje",
// la torre es "cuánto llevas en cada categoría en total" — tipos de
// gráfico distintos ayudan a que el usuario no confunda una vista con
// la otra de un vistazo.

import { icon } from "../utils/icons.js";
import { formatCurrency } from "../utils/currency.js";

/**
 * @param {{ id: string, label: string, icon: string, value: number, color: string }[]} categories en el orden en que deben mostrarse
 * @param {string} currency divisa en la que ya vienen los `value`, para formatear el monto
 */
export function barChart(categories, currency) {
  const maxValue = Math.max(0, ...categories.map((c) => c.value));

  const bars = categories
    .map((c) => {
      const hasSpend = c.value > 0;
      const heightPercent = maxValue > 0 ? (c.value / maxValue) * 100 : 0;
      const color = hasSpend ? c.color : "var(--color-text-muted)";

      return `
        <li class="bar-chart-item">
          <p class="bar-chart-amount">${formatCurrency(c.value, currency)}</p>
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
