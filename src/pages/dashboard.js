// Página: Inicio. 2 KPIs arriba — "Viajes activos" y "Viajes en
// riesgo" (viajes en alerta, warning o danger: mismo conteo que ya usa
// el badge de la campana de "Alertas", getTripAlerts() en
// data/store.js, no un cálculo propio — antes acá había 2 KPIs de
// dinero, "Gastado en el periodo"/"Presupuesto restante", quitados por
// menos accionables que saber CUÁNTOS viajes necesitan atención; ver
// docs/product-decisions.md). Debajo, "Gasto por categoría"
// (components/category-chart.js: torres en desktop, dona en mobile —
// mismo componente que usa trip-detail.js, unificado por breakpoint,
// no por pantalla; acá con el agregado de todos los viajes activos, a
// todo el ancho — el bloque "Gasto vs presupuesto" que compartía la
// fila con este bloque se eliminó por redundante con el KPI
// "Presupuesto restante" que existía antes, ver
// docs/product-decisions.md) y viajes activos como cards con foto de
// destino + semáforo de estado (components/trip-card.js, compartido
// con Mis viajes). Las acciones de editar/
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

import { getActiveTrips, getExpensesByTrip, getTripAlerts } from "../data/store.js";
import { renderKpiCard } from "../components/kpi-card.js";
import { categoryChart } from "../components/category-chart.js";
import { accountMenu, bindAccountMenu } from "../components/account-menu.js";
import { searchField } from "../components/search-field.js";
import { alertsBell } from "../components/alerts-bell.js";
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
  const atRiskCount = getTripAlerts().length;
  const categoryBreakdown = computeCategoryBreakdown(trips);
  const user = getCurrentUser();
  const greetingName = getGreetingName(user);

  container.innerHTML = `
    <main class="page page-home">
      <header class="page-header">
        <h1 id="home-greeting">Hola, ${escapeHtml(greetingName)} 👋</h1>
        <div class="page-header-actions">
          ${alertsBell()}
          ${searchField({ id: "trip-search" })}
          <a href="#/nuevo-viaje" class="button-primary">${icon("plus")}<span>Nuevo viaje</span></a>
          ${accountMenu(user)}
        </div>
      </header>

      <ul class="kpi-row" id="home-kpi-row">
        ${renderKpiCard({ iconName: "plane", label: "Viajes activos", value: trips.length })}
        ${renderKpiCard({ iconName: "alert-triangle", label: "Viajes en riesgo", value: atRiskCount })}
      </ul>

      <section class="section" id="home-category-section">
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

  const pageEl = container.querySelector(".page-home");
  const sectionBody = container.querySelector("#trips-section-body");

  function handleSearchInput(event) {
    const query = event.target.value.trim().toLowerCase();
    sectionBody.innerHTML = renderTripsSection(trips, query);
  }

  container.querySelector("#trip-search").addEventListener("input", handleSearchInput);

  // #trip-search-mobile vive fuera de `container` (lo renderiza
  // components/sidebar.js, en el header compartido, no esta página) —
  // solo existe en mobile y solo en Inicio/Mis viajes. Con texto activo
  // ahí (no en el buscador de escritorio, que no toca .is-mobile-search-
  // active), se oculta el saludo/KPIs/dona (ver [.page-home.is-mobile-
  // search-active ...] en base.css) para que los resultados queden
  // debajo del buscador sin scroll; al vaciar el input (o cerrarlo con
  // la X, que ya limpia el valor y dispara "input", ver sidebar.js)
  // vuelven a aparecer solos.
  const mobileSearchInput = document.querySelector("#trip-search-mobile");
  if (mobileSearchInput) {
    mobileSearchInput.addEventListener("input", (event) => {
      handleSearchInput(event);
      pageEl.classList.toggle("is-mobile-search-active", event.target.value.trim().length > 0);
    });
  }
}
