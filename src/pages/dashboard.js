// Página: Inicio. KPIs del periodo activo (una sola divisa, COP — ver
// docs/product-decisions.md), "Gasto por categoría" (components/
// category-chart.js: torres en desktop, dona en mobile — mismo
// componente que usa trip-detail.js, unificado por breakpoint, no por
// pantalla; acá con el agregado de todos los viajes activos, a todo el
// ancho — el bloque "Gasto vs presupuesto" que compartía la fila con
// este bloque se eliminó por redundante con el KPI "Presupuesto
// restante" de arriba, ver docs/product-decisions.md) y viajes activos
// como cards con foto de destino + semáforo de estado (components/
// trip-card.js, compartido con Mis viajes). Las acciones de editar/
// finalizar viaje viven en el Detalle de viaje, no en estas cards. En
// mobile, el buscador inline de acá se oculta (ver .search-field en
// base.css) — la lupa y el input equivalente viven en el header
// compartido (components/sidebar.js, #trip-search-mobile); acá solo se
// bindea el mismo filtro sobre ESE input además del de siempre.
// "Nuevo viaje" también se oculta en mobile (mismo botón, ver
// .page-home .page-header-actions .button-primary en base.css) y se
// reemplaza por un FAB fijo en la esquina inferior derecha (.fab,
// misma ruta #/nuevo-viaje) — desktop sigue mostrando el botón de
// siempre, sin FAB (oculto salvo en mobile).

import { getActiveTrips, getTripTotal, getExpensesByTrip } from "../data/store.js";
import { formatCurrency } from "../utils/currency.js";
import { renderKpiCard } from "../components/kpi-card.js";
import { categoryChart } from "../components/category-chart.js";
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
    id: c.id,
    label: c.label,
    icon: c.icon,
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
        ${categoryChart(categoryBreakdown)}
      </section>

      <section class="section">
        <h2>Tus viajes activos</h2>
        <div id="trips-section-body">${renderTripsSection(trips, "")}</div>
      </section>

      <a href="#/nuevo-viaje" class="fab" aria-label="Nuevo viaje">
        ${icon("plus")}
      </a>
    </main>
  `;

  bindAccountMenu(container);

  const sectionBody = container.querySelector("#trips-section-body");

  function handleSearchInput(event) {
    const query = event.target.value.trim().toLowerCase();
    sectionBody.innerHTML = renderTripsSection(trips, query);
  }

  container.querySelector("#trip-search").addEventListener("input", handleSearchInput);

  // #trip-search-mobile vive fuera de `container` (lo renderiza
  // components/sidebar.js, en el header compartido, no esta página) —
  // solo existe en mobile y solo en Inicio/Mis viajes.
  const mobileSearchInput = document.querySelector("#trip-search-mobile");
  if (mobileSearchInput) mobileSearchInput.addEventListener("input", handleSearchInput);
}
