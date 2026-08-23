// Anillo de progreso en SVG puro (mismo criterio que donut-chart.js:
// sin librería de charting) para "Gasto vs presupuesto": % del
// presupuesto total gastado, con el semáforo de estado en el centro
// (ícono + texto + color juntos, nunca solo color — regla de
// accesibilidad del semáforo, ver utils/status.js) y una leyenda de
// Gastado/Restante.

import { icon } from "../utils/icons.js";
import { formatCurrency, splitCurrencyUnit } from "../utils/currency.js";
import { getBudgetStatus, getStatusMeta } from "../utils/status.js";

const RADIUS = 60;
const STROKE = 24;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// Mismo ícono/color por estado que el resto del semáforo
// (getStatusMeta), pero con el texto específico que pide este bloque
// en vez de las etiquetas de .status-badge ("En control", etc.).
const RING_LABELS = {
  ok: "en rango",
  warning: "cerca del límite",
  danger: "presupuesto excedido",
};

/**
 * @param {number} spent
 * @param {number} budgetLimit
 */
export function budgetRing(spent, budgetLimit) {
  const status = getBudgetStatus(spent, budgetLimit);
  const meta = getStatusMeta(status);
  const ratio = budgetLimit > 0 ? spent / budgetLimit : 0;
  const percent = Math.round(ratio * 100);
  // El aro nunca dibuja más de una vuelta completa, aunque el % real
  // supere 100 — el número del centro sí muestra el valor real.
  const dash = Math.min(Math.max(ratio, 0), 1) * CIRCUMFERENCE;

  const remaining = budgetLimit - spent;
  const isOverBudget = remaining < 0;
  const { amount: spentAmount, unit: spentUnit } = splitCurrencyUnit(formatCurrency(spent));
  const { amount: remainingAmount, unit: remainingUnit } = splitCurrencyUnit(formatCurrency(remaining));

  return `
    <div class="budget-ring-card">
      <div class="budget-ring-visual">
        <svg viewBox="0 0 160 160" width="160" height="160" role="img" aria-label="Gasto vs presupuesto: ${percent}% gastado, ${RING_LABELS[status]}">
          <circle cx="80" cy="80" r="${RADIUS}" fill="none" stroke="var(--color-bg)" stroke-width="${STROKE}" />
          <circle
            cx="80" cy="80" r="${RADIUS}" fill="none"
            stroke="var(${meta.colorVar})" stroke-width="${STROKE}"
            stroke-linecap="round"
            stroke-dasharray="${dash} ${CIRCUMFERENCE - dash}"
            transform="rotate(-90 80 80)"
          />
        </svg>
        <div class="budget-ring-center">
          <p class="budget-ring-percent">${percent}%</p>
          <p class="budget-ring-status" style="color:var(${meta.colorVar})">
            ${icon(meta.icon, "budget-ring-status-icon")}
            <span>${RING_LABELS[status]}</span>
          </p>
        </div>
      </div>
      <ul class="budget-ring-legend">
        <li class="budget-ring-legend-item">
          <span class="budget-ring-legend-left">
            <span class="budget-ring-legend-swatch budget-ring-legend-swatch-spent"></span>
            <span>Gastado</span>
          </span>
          <span class="budget-ring-legend-value">${spentAmount}${spentUnit ? `<span class="budget-ring-legend-unit">${spentUnit}</span>` : ""}</span>
        </li>
        <li class="budget-ring-legend-item">
          <span class="budget-ring-legend-left">
            <span class="budget-ring-legend-swatch budget-ring-legend-swatch-remaining"></span>
            <span>Restante</span>
          </span>
          <span class="budget-ring-legend-value${isOverBudget ? " budget-ring-legend-value-danger" : ""}">${remainingAmount}${remainingUnit ? `<span class="budget-ring-legend-unit">${remainingUnit}</span>` : ""}</span>
        </li>
      </ul>
    </div>
  `;
}
