// Card blanca de KPI (ícono + label + valor) — mismo componente visual
// en Inicio y Historial, para que la sensación de "resumen numérico
// arriba de la lista" sea consistente en toda la app.

import { icon } from "../utils/icons.js";

// formatCurrency (ver utils/currency.js) siempre agrega " COP" al final del
// monto — lo separamos para poder mostrarlo en un tono más tenue y pequeño
// que el número, en vez de que ambos se vean como un solo bloque.
function splitCurrencyUnit(value) {
  const match = /^(.*)\s(COP)$/.exec(value);
  return match ? { amount: match[1], unit: match[2] } : { amount: value, unit: null };
}

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
