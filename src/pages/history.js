// Página: Historial. Viajes cerrados, con presupuesto vs. gasto real.
// KPIs de resumen arriba (mismo componente que Inicio), buscador por
// nombre (mismo componente y filtrado en vivo que Inicio) y cards con
// foto, clickeables hacia el detalle de viaje en modo solo lectura.

import { getClosedTrips, getTripTotal } from "../data/store.js";
import { formatCurrency } from "../utils/currency.js";
import { getBudgetStatus, STATUS } from "../utils/status.js";
import { statusBadge } from "../components/status-badge.js";
import { renderKpiCard } from "../components/kpi-card.js";
import { accountMenu, bindAccountMenu } from "../components/account-menu.js";
import { searchField } from "../components/search-field.js";
import { getCurrentUser } from "../data/auth.js";
import { icon } from "../utils/icons.js";
import { escapeHtml } from "../utils/dom.js";

function computeKpis(trips) {
  const spentTotal = trips.reduce((sum, trip) => sum + getTripTotal(trip.id), 0);
  const fulfilledCount = trips.filter(
    (trip) => getBudgetStatus(getTripTotal(trip.id), trip.budgetLimit) === STATUS.OK
  ).length;

  return {
    count: trips.length,
    spentTotal,
    average: trips.length > 0 ? spentTotal / trips.length : 0,
    fulfilledPercent: trips.length > 0 ? Math.round((fulfilledCount / trips.length) * 100) : 0,
  };
}

function formatDateRange(startDate, endDate) {
  if (!startDate && !endDate) return "Sin fechas registradas";
  if (startDate && endDate) return `${startDate} — ${endDate}`;
  return startDate || endDate;
}

function renderHistoryItem(trip) {
  const spent = getTripTotal(trip.id);
  const status = getBudgetStatus(spent, trip.budgetLimit);
  const safePhotoUrl = /^https?:\/\//.test(trip.photoUrl || "") ? escapeHtml(trip.photoUrl) : "";

  return `
    <li class="history-item">
      <a href="#/viaje/${trip.id}" class="history-item-link">
        <div class="history-item-photo"${safePhotoUrl ? ` style="background-image:url('${safePhotoUrl}')"` : ""}>
          ${!safePhotoUrl ? icon("plane", "trip-card-photo-placeholder") : ""}
        </div>
        <div class="history-item-body">
          <p class="history-item-name">${escapeHtml(trip.name)}</p>
          <p class="history-item-dates">${icon("calendar")}${escapeHtml(formatDateRange(trip.startDate, trip.endDate))}</p>
        </div>
        <div class="history-item-meta">
          ${statusBadge(status)}
          <p class="history-item-budget">${formatCurrency(spent)} / ${formatCurrency(trip.budgetLimit)}</p>
        </div>
        ${icon("chevron-right", "history-item-chevron")}
      </a>
    </li>
  `;
}

function renderHistorySection(trips, query) {
  const filtered = query ? trips.filter((trip) => trip.name.toLowerCase().includes(query)) : trips;

  if (trips.length === 0) {
    return `<p class="empty-state">Todavía no tienes viajes cerrados. Cuando cierres un viaje desde Inicio, aparecerá aquí.</p>`;
  }
  if (filtered.length === 0) {
    return `<p class="empty-state">No se encontraron viajes con ese nombre.</p>`;
  }
  return `<ul class="history-list">${filtered.map(renderHistoryItem).join("")}</ul>`;
}

export function render(container) {
  const trips = getClosedTrips();
  const kpis = computeKpis(trips);

  container.innerHTML = `
    <main class="page page-history">
      <header class="page-header">
        <h1>Historial</h1>
        <div class="page-header-actions">
          ${searchField({ id: "trip-search" })}
          ${accountMenu(getCurrentUser())}
        </div>
      </header>

      <ul class="kpi-row">
        ${renderKpiCard({ iconName: "plane", label: "Viajes realizados", value: kpis.count })}
        ${renderKpiCard({ iconName: "wallet", label: "Gasto total", value: formatCurrency(kpis.spentTotal) })}
        ${renderKpiCard({ iconName: "calculator", label: "Promedio por viaje", value: formatCurrency(kpis.average) })}
        ${renderKpiCard({ iconName: "circle-check", label: "Presupuesto cumplido", value: `${kpis.fulfilledPercent}%` })}
      </ul>

      <div id="history-section-body">${renderHistorySection(trips, "")}</div>
    </main>
  `;

  bindAccountMenu(container);

  const sectionBody = container.querySelector("#history-section-body");
  container.querySelector("#trip-search").addEventListener("input", (event) => {
    const query = event.target.value.trim().toLowerCase();
    sectionBody.innerHTML = renderHistorySection(trips, query);
  });
}
