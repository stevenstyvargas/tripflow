// Card blanca de KPI (ícono + label + valor) — mismo componente visual
// en Inicio y Historial, para que la sensación de "resumen numérico
// arriba de la lista" sea consistente en toda la app.

import { icon } from "../utils/icons.js";
import { splitCurrencyUnit } from "../utils/currency.js";

export function renderKpiCard({ iconName, label, value }) {
  const { amount, unit } = splitCurrencyUnit(String(value));

  return `
    <li class="kpi-card">
      ${icon(iconName, "kpi-card-icon")}
      <div>
        <p class="kpi-card-label">${label}</p>
        <p class="kpi-card-value">${amount}${unit ? `<span class="kpi-card-unit">${unit}</span>` : ""}</p>
      </div>
    </li>
  `;
}
