// Página: dashboard de control de gastos.
// v1 mínimo: lista los viajes creados y da acceso a crear uno nuevo.
// El registro/monitoreo de gastos por viaje se aborda en otra iteración.

import { getTrips, getTripTotal } from "../data/store.js";
import { formatCurrency } from "../utils/currency.js";

function renderTripCard(trip) {
  const spent = getTripTotal(trip.id);
  return `
    <li class="trip-card">
      <p class="trip-card-name">${trip.name}</p>
      <p class="trip-card-budget">
        ${formatCurrency(spent, trip.currency)} / ${formatCurrency(trip.budgetLimit, trip.currency)}
      </p>
    </li>
  `;
}

export function render(container) {
  const trips = getTrips();

  container.innerHTML = `
    <main class="page page-dashboard">
      <header class="page-dashboard-header">
        <h1>Tus viajes</h1>
        <a href="#/nuevo-viaje">Nuevo viaje</a>
      </header>

      ${
        trips.length === 0
          ? `<p class="empty-state">Todavía no tienes viajes. Crea el primero para empezar a controlar tu presupuesto.</p>`
          : `<ul class="trip-list">${trips.map(renderTripCard).join("")}</ul>`
      }
    </main>
  `;
}
