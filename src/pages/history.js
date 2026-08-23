// Página: Historial. Viajes cerrados, con presupuesto vs. gasto real.

import { getClosedTrips, getTripTotal } from "../data/store.js";
import { formatCurrency } from "../utils/currency.js";
import { getBudgetStatus } from "../utils/status.js";
import { statusBadge } from "../components/status-badge.js";
import { icon } from "../utils/icons.js";
import { escapeHtml } from "../utils/dom.js";

function formatDateRange(startDate, endDate) {
  if (!startDate && !endDate) return "Sin fechas registradas";
  if (startDate && endDate) return `${startDate} — ${endDate}`;
  return startDate || endDate;
}

function renderHistoryItem(trip) {
  const spent = getTripTotal(trip.id);
  const status = getBudgetStatus(spent, trip.budgetLimit);

  return `
    <li class="history-item">
      <div class="history-item-header">
        <p class="history-item-name">${escapeHtml(trip.name)}</p>
        ${statusBadge(status)}
      </div>
      <p class="history-item-dates">${icon("calendar")}${escapeHtml(formatDateRange(trip.startDate, trip.endDate))}</p>
      <p class="history-item-budget">
        ${formatCurrency(spent)} gastado / ${formatCurrency(trip.budgetLimit)} presupuestado
      </p>
    </li>
  `;
}

export function render(container) {
  const trips = getClosedTrips();

  container.innerHTML = `
    <main class="page page-history">
      <header class="page-header">
        <h1>Historial</h1>
      </header>

      ${
        trips.length === 0
          ? `<p class="empty-state">Todavía no tienes viajes cerrados. Cuando cierres un viaje desde Inicio, aparecerá aquí.</p>`
          : `<ul class="history-list">${trips.map(renderHistoryItem).join("")}</ul>`
      }
    </main>
  `;
}
