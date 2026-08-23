// Página: Inicio. KPIs del periodo activo, separados por divisa (nunca
// sumados ni convertidos entre sí — ver docs/product-decisions.md), y
// viajes activos como cards con foto de destino + semáforo de estado.
// El desglose por categoría de un viaje vive en trip-detail.js, no acá:
// mezclar categorías de viajes en distintas divisas tenía el mismo
// problema que mezclar los KPIs.

import { getActiveTrips, getTripTotal, closeTrip } from "../data/store.js";
import { formatCurrency, SUPPORTED_CURRENCIES } from "../utils/currency.js";
import { getBudgetStatus } from "../utils/status.js";
import { statusBadge } from "../components/status-badge.js";
import { icon } from "../utils/icons.js";
import { escapeHtml } from "../utils/dom.js";

// Píldora navy/verde/gris (mismo estilo visual que .status-badge:
// fondo tintado + texto oscurecido del mismo tono, no color plano) para
// distinguir cada bloque de divisa de un vistazo, sin depender solo de
// leer el código de 3 letras.
const CURRENCY_PILL_CLASS = {
  COP: "currency-pill-cop",
  USD: "currency-pill-usd",
  EUR: "currency-pill-eur",
};

// Un bloque por cada divisa que REALMENTE esté en uso entre los viajes
// activos (nunca se fuerzan bloques de divisas sin viajes). Orden fijo
// según SUPPORTED_CURRENCIES, no según el orden en que se crearon los
// viajes, para que la posición de cada bloque no cambie entre renders.
function computeKpisByCurrency(trips) {
  const totals = {};

  for (const trip of trips) {
    const entry = totals[trip.currency] ?? { spent: 0, budget: 0 };
    entry.spent += getTripTotal(trip.id);
    entry.budget += trip.budgetLimit;
    totals[trip.currency] = entry;
  }

  return SUPPORTED_CURRENCIES.filter((currency) => currency in totals).map((currency) => ({
    currency,
    spent: totals[currency].spent,
    remaining: totals[currency].budget - totals[currency].spent,
  }));
}

function renderCurrencyKpiCard({ currency, spent, remaining }) {
  return `
    <li class="kpi-card">
      <span class="currency-pill ${CURRENCY_PILL_CLASS[currency] ?? ""}">${currency}</span>
      <div>
        <p class="kpi-card-label">Gastado / restante</p>
        <p class="kpi-card-value">${formatCurrency(spent, currency)} / ${formatCurrency(remaining, currency)}</p>
      </div>
    </li>
  `;
}

function renderCountKpiCard({ iconName, label, value }) {
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
      <a href="#/viaje/${trip.id}" class="trip-card-link">
        <div class="trip-card-photo"${safePhotoUrl ? ` style="background-image:url('${safePhotoUrl}')"` : ""}>
          ${!safePhotoUrl ? icon("plane", "trip-card-photo-placeholder") : ""}
        </div>
        <div class="trip-card-body">
          <p class="trip-card-name">${escapeHtml(trip.name)}</p>
          <p class="trip-card-budget">
            ${formatCurrency(spent, trip.currency)} / ${formatCurrency(trip.budgetLimit, trip.currency)}
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
  const kpisByCurrency = computeKpisByCurrency(trips);

  container.innerHTML = `
    <main class="page page-home">
      <header class="page-header">
        <h1>Inicio</h1>
        <a href="#/nuevo-viaje" class="button-primary">${icon("plus")}<span>Nuevo viaje</span></a>
      </header>

      <ul class="kpi-row">
        ${kpisByCurrency.map(renderCurrencyKpiCard).join("")}
        ${renderCountKpiCard({ iconName: "plane", label: "Viajes activos", value: trips.length })}
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
