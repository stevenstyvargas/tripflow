// Página: Mis viajes (/viajes). Todos los viajes del usuario (activos
// y cerrados) en un grid de cards (components/trip-card.js, mismo
// componente que Inicio), con 3 pestañas de filtro (Todos/Activos/
// Cerrados) y el mismo buscador por nombre que Inicio/Historial. Cada
// card navega al detalle de viaje, que ya decide solo (según
// trip.status) si se ve editable o de solo lectura — no se duplica
// esa lógica acá.

import { getAllTrips, closeTrip, TRIP_STATUS } from "../data/store.js";
import { getCurrentUser } from "../data/auth.js";
import { accountMenu, bindAccountMenu } from "../components/account-menu.js";
import { searchField } from "../components/search-field.js";
import { renderTripCard } from "../components/trip-card.js";

const FILTERS = [
  { id: "all", label: "Todos" },
  { id: "active", label: "Activos" },
  { id: "closed", label: "Cerrados" },
];

function filterByStatus(trips, filter) {
  if (filter === "active") return trips.filter((t) => t.status !== TRIP_STATUS.CLOSED);
  if (filter === "closed") return trips.filter((t) => t.status === TRIP_STATUS.CLOSED);
  return trips;
}

function emptyMessage(filter) {
  if (filter === "active") return "No tienes viajes activos todavía.";
  if (filter === "closed") return "No tienes viajes cerrados todavía.";
  return "Todavía no has creado ningún viaje.";
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
  return `<ul class="trip-list">${filtered
    .map((trip) => renderTripCard(trip, { showCloseButton: trip.status !== TRIP_STATUS.CLOSED }))
    .join("")}</ul>`;
}

export function render(container) {
  const trips = getAllTrips();
  let activeFilter = "all";

  container.innerHTML = `
    <main class="page page-my-trips">
      <header class="page-header">
        <h1>Mis viajes</h1>
        <div class="page-header-actions">
          ${searchField({ id: "trip-search" })}
          ${accountMenu(getCurrentUser())}
        </div>
      </header>

      <div class="tab-list" role="tablist">
        ${FILTERS.map(
          (f) => `
          <button type="button" class="tab-item${f.id === "all" ? " is-active" : ""}" role="tab" aria-selected="${f.id === "all"}" data-filter="${f.id}">
            ${f.label}
          </button>
        `
        ).join("")}
      </div>

      <div id="trips-section-body">${renderTripsSection(trips, activeFilter, "")}</div>
    </main>
  `;

  bindAccountMenu(container);

  const sectionBody = container.querySelector("#trips-section-body");
  const searchInput = container.querySelector("#trip-search");
  const tabButtons = container.querySelectorAll(".tab-item");

  function bindCloseButtons() {
    sectionBody.querySelectorAll(".trip-card-close").forEach((button) => {
      button.addEventListener("click", async () => {
        button.disabled = true;
        await closeTrip(button.dataset.tripId);
        render(container);
      });
    });
  }

  function update() {
    const query = searchInput.value.trim().toLowerCase();
    sectionBody.innerHTML = renderTripsSection(trips, activeFilter, query);
    bindCloseButtons();
  }

  bindCloseButtons();

  searchInput.addEventListener("input", update);

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.filter;
      tabButtons.forEach((b) => {
        const isActive = b === button;
        b.classList.toggle("is-active", isActive);
        b.setAttribute("aria-selected", String(isActive));
      });
      update();
    });
  });
}
