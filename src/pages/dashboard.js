// Página: Inicio. KPIs del periodo activo (una sola divisa, COP — ver
// docs/product-decisions.md), dona de gasto por categoría agregada de
// todos los viajes activos, y viajes activos como cards con foto de
// destino + semáforo de estado. El desglose por categoría de UN viaje
// (torre de barras) vive en trip-detail.js, no acá.

import { getActiveTrips, getTripTotal, getExpensesByTrip, closeTrip } from "../data/store.js";
import { formatCurrency } from "../utils/currency.js";
import { getBudgetStatus } from "../utils/status.js";
import { statusBadge } from "../components/status-badge.js";
import { renderKpiCard } from "../components/kpi-card.js";
import { donutChart } from "../components/donut-chart.js";
import { accountMenu, bindAccountMenu } from "../components/account-menu.js";
import { EXPENSE_CATEGORIES } from "../utils/categories.js";
import { getCurrentUser } from "../data/auth.js";
import { icon } from "../utils/icons.js";
import { escapeHtml } from "../utils/dom.js";

// Mismo dato que usa el menú de cuenta (getCurrentUser()): preferimos
// el displayName de Google porque es un nombre real, no un
// identificador de cuenta; si no está disponible, la parte del email
// antes de la @ sigue siendo más personal que "Inicio" a secas.
function getGreetingName(user) {
  if (user?.displayName) return user.displayName;
  if (user?.email) return user.email.split("@")[0];
  return "";
}

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

// Suma el gasto por categoría de TODOS los viajes activos — válido
// porque la app usa una única divisa (COP), sin nada que convertir ni
// mezclar entre viajes. Mismos colores por categoría que el resto de
// la app (--color-category-* en tokens.css).
function computeCategoryBreakdown(trips) {
  const totals = Object.fromEntries(EXPENSE_CATEGORIES.map((c) => [c.id, 0]));

  for (const trip of trips) {
    for (const expense of getExpensesByTrip(trip.id)) {
      if (expense.category in totals) totals[expense.category] += expense.amount;
    }
  }

  return EXPENSE_CATEGORIES.map((c) => ({
    label: c.label,
    value: totals[c.id],
    color: `var(${c.colorVar})`,
  }));
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

function renderTripsSection(trips, query) {
  const filtered = query ? trips.filter((trip) => trip.name.toLowerCase().includes(query)) : trips;

  if (trips.length === 0) {
    return `<p class="empty-state">Todavía no tienes viajes activos. Crea el primero para empezar a controlar tu presupuesto.</p>`;
  }
  if (filtered.length === 0) {
    return `<p class="empty-state">No se encontraron viajes con ese nombre.</p>`;
  }
  return `<ul class="trip-list">${filtered.map(renderTripCard).join("")}</ul>`;
}

function bindTripsSection(sectionBody, trips, container) {
  sectionBody.querySelectorAll(".trip-card-close").forEach((button) => {
    button.addEventListener("click", async () => {
      button.disabled = true;
      await closeTrip(button.dataset.tripId);
      render(container);
    });
  });
}

export function render(container) {
  const trips = getActiveTrips();
  const kpis = computeKpis(trips);
  const categoryBreakdown = computeCategoryBreakdown(trips);
  const user = getCurrentUser();
  const greetingName = getGreetingName(user);

  container.innerHTML = `
    <main class="page page-home">
      <header class="page-header">
        <div>
          <p class="page-greeting">Hola, ${escapeHtml(greetingName)} 👋</p>
          <h1>Inicio</h1>
        </div>
        <div class="page-header-actions">
          <div class="search-field">
            ${icon("search", "search-field-icon")}
            <input type="search" id="trip-search" placeholder="Buscar destino o país..." aria-label="Buscar destino o país" />
          </div>
          <a href="#/nuevo-viaje" class="button-primary">${icon("plus")}<span>Nuevo viaje</span></a>
          ${accountMenu(user)}
        </div>
      </header>

      <ul class="kpi-row">
        ${renderKpiCard({ iconName: "wallet", label: "Gastado en el periodo", value: formatCurrency(kpis.totalSpent) })}
        ${renderKpiCard({ iconName: "piggy-bank", label: "Presupuesto restante", value: formatCurrency(kpis.remaining) })}
        ${renderKpiCard({ iconName: "plane", label: "Viajes activos", value: kpis.activeCount })}
      </ul>

      <section class="section">
        <h2>Gasto por categoría</h2>
        <p class="section-subtitle">Todos tus viajes activos</p>
        ${donutChart(categoryBreakdown)}
      </section>

      <section class="section">
        <h2>Tus viajes activos</h2>
        <div id="trips-section-body">${renderTripsSection(trips, "")}</div>
      </section>
    </main>
  `;

  bindAccountMenu(container);

  const sectionBody = container.querySelector("#trips-section-body");
  bindTripsSection(sectionBody, trips, container);

  container.querySelector("#trip-search").addEventListener("input", (event) => {
    const query = event.target.value.trim().toLowerCase();
    sectionBody.innerHTML = renderTripsSection(trips, query);
    bindTripsSection(sectionBody, trips, container);
  });
}
