// Página: Inicio. KPIs del periodo activo, gasto por categoría (dona)
// y viajes activos como cards con foto de destino + semáforo de estado.
// El registro/monitoreo de gastos por viaje se aborda en otra iteración.

import { getActiveTrips, getTripTotal, getExpensesByTrip, closeTrip } from "../data/store.js";
import { formatCurrency, convert } from "../utils/currency.js";
import { getBudgetStatus } from "../utils/status.js";
import { statusBadge } from "../components/status-badge.js";
import { donutChart } from "../components/donut-chart.js";
import { EXPENSE_CATEGORIES } from "../utils/categories.js";
import { icon } from "../utils/icons.js";
import { escapeHtml } from "../utils/dom.js";

// KPIs y dona se normalizan a COP para poder sumar viajes en distintas
// divisas en un solo número (ver utils/currency.js: convert()).
const REPORT_CURRENCY = "COP";

function computeKpis(trips) {
  let totalSpent = 0;
  let totalBudget = 0;

  for (const trip of trips) {
    totalSpent += convert(getTripTotal(trip.id), trip.currency, REPORT_CURRENCY);
    totalBudget += convert(trip.budgetLimit, trip.currency, REPORT_CURRENCY);
  }

  return {
    totalSpent,
    remaining: totalBudget - totalSpent,
    activeCount: trips.length,
  };
}

function computeCategoryBreakdown(trips) {
  const totals = Object.fromEntries(EXPENSE_CATEGORIES.map((c) => [c.id, 0]));

  for (const trip of trips) {
    for (const expense of getExpensesByTrip(trip.id)) {
      if (expense.category in totals) {
        totals[expense.category] += convert(expense.amount, expense.currency, REPORT_CURRENCY);
      }
    }
  }

  return EXPENSE_CATEGORIES.map((c) => ({
    label: c.label,
    value: totals[c.id],
    color: `var(${c.colorVar})`,
  }));
}

function renderKpiCard({ iconName, label, value }) {
  return `
    <li class="kpi-card">
      ${icon(iconName, "kpi-card-icon")}
      <div>
        <p class="kpi-card-label">${label}</p>
        <p class="kpi-card-value">${value}</p>
      </div>
    </li>
  `;
}

function renderTripCard(trip) {
  const spent = getTripTotal(trip.id);
  const status = getBudgetStatus(spent, trip.budgetLimit);
  const safePhotoUrl = /^https?:\/\//.test(trip.photoUrl || "") ? escapeHtml(trip.photoUrl) : "";

  return `
    <li class="trip-card">
      <div class="trip-card-photo"${safePhotoUrl ? ` style="background-image:url('${safePhotoUrl}')"` : ""}>
        ${!safePhotoUrl ? icon("plane", "trip-card-photo-placeholder") : ""}
      </div>
      <div class="trip-card-body">
        <p class="trip-card-name">${escapeHtml(trip.name)}</p>
        <p class="trip-card-budget">
          ${formatCurrency(spent, trip.currency)} / ${formatCurrency(trip.budgetLimit, trip.currency)}
        </p>
        ${statusBadge(status)}
        <button type="button" class="trip-card-close" data-trip-id="${trip.id}">
          ${icon("history")}<span>Cerrar viaje</span>
        </button>
      </div>
    </li>
  `;
}

export function render(container) {
  const trips = getActiveTrips();
  const kpis = computeKpis(trips);
  const categoryBreakdown = computeCategoryBreakdown(trips);

  container.innerHTML = `
    <main class="page page-home">
      <header class="page-header">
        <h1>Inicio</h1>
        <a href="#/nuevo-viaje" class="button-primary">${icon("plus")}<span>Nuevo viaje</span></a>
      </header>

      <ul class="kpi-row">
        ${renderKpiCard({ iconName: "wallet", label: "Gastado en el periodo", value: formatCurrency(kpis.totalSpent, REPORT_CURRENCY) })}
        ${renderKpiCard({ iconName: "piggy-bank", label: "Presupuesto restante", value: formatCurrency(kpis.remaining, REPORT_CURRENCY) })}
        ${renderKpiCard({ iconName: "plane", label: "Viajes activos", value: kpis.activeCount })}
      </ul>

      <section class="section">
        <h2>Gasto por categoría</h2>
        ${donutChart(categoryBreakdown)}
      </section>

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
