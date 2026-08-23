// Página: Inicio. KPIs del periodo activo (una sola divisa, COP — ver
// docs/product-decisions.md) y viajes activos como cards con foto de
// destino + semáforo de estado. El desglose por categoría de un viaje
// vive en trip-detail.js, no acá.

import { getActiveTrips, getTripTotal, closeTrip } from "../data/store.js";
import { formatCurrency } from "../utils/currency.js";
import { getBudgetStatus } from "../utils/status.js";
import { statusBadge } from "../components/status-badge.js";
import { renderKpiCard } from "../components/kpi-card.js";
import { icon } from "../utils/icons.js";
import { escapeHtml } from "../utils/dom.js";

function computeKpis(trips) {
  let totalSpent = 0;
  let totalBudget = 0;

  for (const trip of trips) {
    totalSpent += getTripTotal(trip.id);
    totalBudget += trip.budgetLimit;
  }

  return {
    totalSpent,
    remaining: totalBudget - totalSpent,
    activeCount: trips.length,
  };
}

function renderTripCard(trip) {
  const spent = getTripTotal(trip.id);
  const status = getBudgetStatus(spent, trip.budgetLimit);
  const safePhotoUrl = /^https?:\/\//.test(trip.photoUrl || "") ? escapeHtml(trip.photoUrl) : "";

  return `
    <li class="trip-card">
      <a href="#/viaje/${trip.id}" class="trip-card-link">
        <div class="trip-card-photo"${safePhotoUrl ? ` style="background-image:url('${safePhotoUrl}')"` : ""}>
          ${!safePhotoUrl ? icon("plane", "trip-card-photo-placeholder") : ""}
        </div>
        <div class="trip-card-body">
          <p class="trip-card-name">${escapeHtml(trip.name)}</p>
          <p class="trip-card-budget">
            ${formatCurrency(spent)} / ${formatCurrency(trip.budgetLimit)}
          </p>
          ${statusBadge(status)}
        </div>
      </a>
      <button type="button" class="trip-card-close button-danger-outline" data-trip-id="${trip.id}">
        ${icon("trash-2")}<span>Finalizar viaje</span>
      </button>
    </li>
  `;
}

export function render(container) {
  const trips = getActiveTrips();
  const kpis = computeKpis(trips);

  container.innerHTML = `
    <main class="page page-home">
      <header class="page-header">
        <h1>Inicio</h1>
        <a href="#/nuevo-viaje" class="button-primary">${icon("plus")}<span>Nuevo viaje</span></a>
      </header>

      <ul class="kpi-row">
        ${renderKpiCard({ iconName: "wallet", label: "Gastado en el periodo", value: formatCurrency(kpis.totalSpent) })}
        ${renderKpiCard({ iconName: "piggy-bank", label: "Presupuesto restante", value: formatCurrency(kpis.remaining) })}
        ${renderKpiCard({ iconName: "plane", label: "Viajes activos", value: kpis.activeCount })}
      </ul>

      <section class="section">
        <h2>Tus viajes activos</h2>
        ${
          trips.length === 0
            ? `<p class="empty-state">Todavía no tienes viajes activos. Crea el primero para empezar a controlar tu presupuesto.</p>`
            : `<ul class="trip-list">${trips.map(renderTripCard).join("")}</ul>`
        }
      </section>
    </main>
  `;

  container.querySelectorAll(".trip-card-close").forEach((button) => {
    button.addEventListener("click", async () => {
      button.disabled = true;
      await closeTrip(button.dataset.tripId);
      render(container);
    });
  });
}
