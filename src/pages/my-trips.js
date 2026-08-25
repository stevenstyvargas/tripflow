// Página: Mis viajes (/viajes). Todos los viajes del usuario (activos
// y cerrados) en un grid de cards (components/trip-card.js, mismo
// componente que Inicio), con buscador, KPIs de resumen y 3 pestañas
// de filtro (Todos/Activos/Cerrados). Reemplaza a la antigua pantalla
// de Historial — ver docs/product-decisions.md: ambas mostraban los
// viajes cerrados por separado, ahora es la pestaña "Cerrados" de acá,
// con las mismas 4 KPIs que Historial ya traía, recalculadas según la
// pestaña activa en vez de fijas a "cerrados". Cada card navega al
// detalle de viaje, que ya decide solo (según trip.status) si se ve
// editable o de solo lectura — no se duplica esa lógica acá; ahí
// también viven las acciones de editar/finalizar viaje, no en las
// cards. Solo en "Todos" las cards muestran además el badge de ESTADO
// (En curso/Finalizado) — en "Activos"/"Cerrados" ya está implícito
// por el filtro y sumaría ruido visual. También solo en "Todos" el
// orden agrupa primero los activos y después los finalizados (dentro
// de cada grupo se mantiene el orden que ya traían). En mobile, el
// buscador inline de acá se oculta (ver .search-field en base.css) —
// la lupa y el input equivalente viven en el header compartido
// (components/sidebar.js, #trip-search-mobile); acá solo se bindea el
// mismo filtro sobre ESE input además del de siempre.

import { getAllTrips, getTripTotal, TRIP_STATUS } from "../data/store.js";
import { formatCurrency } from "../utils/currency.js";
import { getBudgetStatus, STATUS } from "../utils/status.js";
import { getCurrentUser } from "../data/auth.js";
import { accountMenu, bindAccountMenu } from "../components/account-menu.js";
import { searchField } from "../components/search-field.js";
import { alertsBell } from "../components/alerts-bell.js";
import { renderKpiCard } from "../components/kpi-card.js";
import { renderTripCard } from "../components/trip-card.js";

const FILTERS = [
  { id: "all", label: "Todos" },
  { id: "active", label: "Activos" },
  { id: "closed", label: "Cerrados" },
];

// "Todos": activos primero, cerrados después — Array.prototype.sort es
// estable (garantizado desde ES2019), así que el orden dentro de cada
// grupo no cambia, solo se reagrupan por estado.
function filterByStatus(trips, filter) {
  if (filter === "active") return trips.filter((t) => t.status !== TRIP_STATUS.CLOSED);
  if (filter === "closed") return trips.filter((t) => t.status === TRIP_STATUS.CLOSED);
  return trips.slice().sort((a, b) => Number(a.status === TRIP_STATUS.CLOSED) - Number(b.status === TRIP_STATUS.CLOSED));
}

function emptyMessage(filter) {
  if (filter === "active") return "No tienes viajes activos todavía.";
  if (filter === "closed") return "No tienes viajes cerrados todavía.";
  return "Todavía no has creado ningún viaje.";
}

// "Viajes realizados" solo tiene sentido para la pestaña de cerrados
// (mismo texto que ya usaba Historial); en Todos/Activos el label
// genérico "Viajes" es el único que no suena raro.
function countLabel(filter) {
  return filter === "closed" ? "Viajes realizados" : "Viajes";
}

// Mismas 4 KPIs que Historial mostraba antes de fusionarse acá, ahora
// calculadas sobre el subconjunto de viajes de la pestaña activa (ver
// docs/product-decisions.md).
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

function renderKpis(tripsInFilter, filter) {
  const kpis = computeKpis(tripsInFilter);

  return `
    <ul class="kpi-row">
      ${renderKpiCard({ iconName: "plane", label: countLabel(filter), value: kpis.count })}
      ${renderKpiCard({ iconName: "wallet", label: "Gasto total", value: formatCurrency(kpis.spentTotal) })}
      ${renderKpiCard({ iconName: "calculator", label: "Promedio por viaje", value: formatCurrency(kpis.average) })}
      ${renderKpiCard({ iconName: "circle-check", label: "Presupuesto cumplido", value: `${kpis.fulfilledPercent}%` })}
    </ul>
  `;
}

function renderTripsSection(trips, filter, query) {
  const byFilter = filterByStatus(trips, filter);
  const filtered = query ? byFilter.filter((trip) => trip.name.toLowerCase().includes(query)) : byFilter;

  if (byFilter.length === 0) {
    return `<p class="empty-state">${emptyMessage(filter)}</p>`;
  }
  if (filtered.length === 0) {
    return `<p class="empty-state">No se encontraron viajes con ese nombre.</p>`;
  }
  // El badge de estado (En curso/Finalizado) solo aporta algo en "Todos",
  // donde conviven activos y cerrados — en "Activos"/"Cerrados" ya está
  // implícito por el filtro y solo sumaría ruido visual.
  const showStateBadge = filter === "all";

  return `<ul class="trip-list">${filtered.map((trip) => renderTripCard(trip, { showStateBadge })).join("")}</ul>`;
}

/**
 * @param {HTMLElement} container
 * @param {{ tab?: string }} [params] "tab" preselecciona una pestaña —
 *   usado por el redirect de la antigua ruta /historial (ver router.js).
 */
export function render(container, { tab } = {}) {
  const trips = getAllTrips();
  let activeFilter = FILTERS.some((f) => f.id === tab) ? tab : "all";

  container.innerHTML = `
    <main class="page page-my-trips">
      <header class="page-header">
        <h1>Mis viajes</h1>
        <div class="page-header-actions">
          ${alertsBell()}
          ${searchField({ id: "trip-search" })}
          ${accountMenu(getCurrentUser())}
        </div>
      </header>

      <div id="my-trips-kpis">${renderKpis(filterByStatus(trips, activeFilter), activeFilter)}</div>

      <div class="tab-list" role="tablist">
        ${FILTERS.map(
          (f) => `
          <button type="button" class="tab-item${f.id === activeFilter ? " is-active" : ""}" role="tab" aria-selected="${f.id === activeFilter}" data-filter="${f.id}">
            ${f.label}
          </button>
        `
        ).join("")}
      </div>

      <div id="trips-section-body">${renderTripsSection(trips, activeFilter, "")}</div>
    </main>
  `;

  bindAccountMenu(container);

  const pageEl = container.querySelector(".page-my-trips");
  const kpisBody = container.querySelector("#my-trips-kpis");
  const sectionBody = container.querySelector("#trips-section-body");
  const tabButtons = container.querySelectorAll(".tab-item");

  // El query "actual" se guarda aparte (no se relee del input en cada
  // update): puede venir de #trip-search (desktop) o de
  // #trip-search-mobile (header compartido, ver sidebar.js), y update()
  // también se llama desde el click de pestaña, sin ningún evento de
  // input de por medio.
  let currentQuery = "";

  function update() {
    sectionBody.innerHTML = renderTripsSection(trips, activeFilter, currentQuery);
  }

  function handleSearchInput(event) {
    currentQuery = event.target.value.trim().toLowerCase();
    update();
  }

  container.querySelector("#trip-search").addEventListener("input", handleSearchInput);

  // Con texto activo en el buscador MOBILE (no el de escritorio, que
  // arriba solo llama a handleSearchInput) se ocultan los KPIs y las
  // pestañas Todos/Activos/Cerrados — mismo empuje hacia abajo de los
  // resultados que ya se resolvió en dashboard.js (ver [.page-my-trips.
  // is-mobile-search-active ...] en base.css). El filtro por pestaña
  // sigue aplicando igual mientras están ocultas, solo cambia qué se ve.
  const mobileSearchInput = document.querySelector("#trip-search-mobile");
  if (mobileSearchInput) {
    mobileSearchInput.addEventListener("input", (event) => {
      handleSearchInput(event);
      pageEl.classList.toggle("is-mobile-search-active", event.target.value.trim().length > 0);
    });
  }

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.filter;
      tabButtons.forEach((b) => {
        const isActive = b === button;
        b.classList.toggle("is-active", isActive);
        b.setAttribute("aria-selected", String(isActive));
      });
      kpisBody.innerHTML = renderKpis(filterByStatus(trips, activeFilter), activeFilter);
      update();
    });
  });
}
