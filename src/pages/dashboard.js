// Página: Inicio. KPIs del periodo activo (una sola divisa, COP — ver
// docs/product-decisions.md), un grid 50/50 con "Gasto por categoría"
// (dona, components/donut-chart.js) y "Gasto vs presupuesto" (anillo
// de semáforo, components/budget-ring.js) — ambos agregados de todos
// los viajes activos — y viajes activos como cards con foto de
// destino + semáforo de estado (components/trip-card.js, compartido
// con Mis viajes). El desglose por categoría de UN viaje (torre de
// barras) vive en trip-detail.js, no acá. Las acciones de editar/
// finalizar viaje viven en el Detalle de viaje, no en estas cards. En
// mobile, el buscador (siempre el mismo <input>, el filtrado no
// cambia) se colapsa a un ícono de lupa junto a "Nuevo viaje"; al
// tocarlo se expande a ancho completo debajo del header — ver
// .search-toggle/.page-home .search-field en base.css. Solo Inicio:
// Mis viajes usa el mismo components/search-field.js pero sin este
// comportamiento, no se tocó.

import { getActiveTrips, getTripTotal, getExpensesByTrip } from "../data/store.js";
import { formatCurrency } from "../utils/currency.js";
import { renderKpiCard } from "../components/kpi-card.js";
import { donutChart } from "../components/donut-chart.js";
import { budgetRing } from "../components/budget-ring.js";
import { accountMenu, bindAccountMenu } from "../components/account-menu.js";
import { searchField } from "../components/search-field.js";
import { renderTripCard } from "../components/trip-card.js";
import { EXPENSE_CATEGORIES } from "../utils/categories.js";
import { getCurrentUser } from "../data/auth.js";
import { icon } from "../utils/icons.js";
import { escapeHtml } from "../utils/dom.js";

// Mismo dato que usa el menú de cuenta (getCurrentUser()): preferimos
// el displayName de Google porque es un nombre real, no un
// identificador de cuenta; si no está disponible, la parte del email
// antes de la @ sigue siendo más personal que "Inicio" a secas. Solo
// el primer nombre, para que el saludo-título no se vea largo con
// nombres compuestos.
function getGreetingName(user) {
  if (user?.displayName) return user.displayName.trim().split(/\s+/)[0];
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
    totalBudget,
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

function renderTripsSection(trips, query) {
  const filtered = query ? trips.filter((trip) => trip.name.toLowerCase().includes(query)) : trips;

  if (trips.length === 0) {
    return `<p class="empty-state">Todavía no tienes viajes activos. Crea el primero para empezar a controlar tu presupuesto.</p>`;
  }
  if (filtered.length === 0) {
    return `<p class="empty-state">No se encontraron viajes con ese nombre.</p>`;
  }
  return `<ul class="trip-list">${filtered.map((trip) => renderTripCard(trip)).join("")}</ul>`;
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
        <h1>Hola, ${escapeHtml(greetingName)} 👋</h1>
        <div class="page-header-actions">
          ${searchField({ id: "trip-search" })}
          <button type="button" class="icon-button search-toggle" id="search-toggle" aria-label="Buscar" aria-expanded="false">
            ${icon("search")}
          </button>
          <a href="#/nuevo-viaje" class="button-primary">${icon("plus")}<span>Nuevo viaje</span></a>
          ${accountMenu(user)}
        </div>
      </header>

      <ul class="kpi-row">
        ${renderKpiCard({ iconName: "wallet", label: "Gastado en el periodo", value: formatCurrency(kpis.totalSpent) })}
        ${renderKpiCard({ iconName: "piggy-bank", label: "Presupuesto restante", value: formatCurrency(kpis.remaining) })}
        ${renderKpiCard({ iconName: "plane", label: "Viajes activos", value: kpis.activeCount })}
      </ul>

      <div class="dashboard-charts-grid">
        <section class="section">
          <h2>Gasto por categoría</h2>
          <p class="section-subtitle">Todos tus viajes activos</p>
          ${donutChart(categoryBreakdown)}
        </section>

        <section class="section">
          <h2>Gasto vs presupuesto</h2>
          <p class="section-subtitle">Todos tus viajes activos</p>
          ${budgetRing(kpis.totalSpent, kpis.totalBudget)}
        </section>
      </div>

      <section class="section">
        <h2>Tus viajes activos</h2>
        <div id="trips-section-body">${renderTripsSection(trips, "")}</div>
      </section>
    </main>
  `;

  bindAccountMenu(container);

  const sectionBody = container.querySelector("#trips-section-body");
  const searchInput = container.querySelector("#trip-search");
  const searchFieldEl = container.querySelector(".search-field");
  const searchToggle = container.querySelector("#search-toggle");

  // Solo relevante en mobile (el ícono es invisible en desktop, ver
  // .search-toggle en base.css): expande/colapsa el mismo <input> de
  // siempre, no crea uno nuevo — el filtrado de abajo sigue intacto.
  searchToggle.addEventListener("click", () => {
    const isExpanded = searchFieldEl.classList.toggle("is-expanded");
    searchToggle.setAttribute("aria-expanded", String(isExpanded));
    if (isExpanded) searchInput.focus();
  });

  searchInput.addEventListener("input", (event) => {
    const query = event.target.value.trim().toLowerCase();
    sectionBody.innerHTML = renderTripsSection(trips, query);
  });
}
