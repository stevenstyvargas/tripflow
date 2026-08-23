// Página: Inicio. KPIs del periodo activo de UNA divisa a la vez,
// elegida con el selector del header (nunca sumados ni convertidos
// entre divisas — ver docs/product-decisions.md), y viajes activos
// como cards con foto de destino + semáforo de estado, sin filtrar por
// la divisa seleccionada. El desglose por categoría de un viaje vive en
// trip-detail.js, no acá.

import { getActiveTrips, getTripTotal, closeTrip } from "../data/store.js";
import { formatCurrency, SUPPORTED_CURRENCIES } from "../utils/currency.js";
import { getBudgetStatus } from "../utils/status.js";
import { statusBadge } from "../components/status-badge.js";
import { icon } from "../utils/icons.js";
import { escapeHtml } from "../utils/dom.js";

// Píldora navy/verde/gris (mismo estilo visual que .status-badge: fondo
// tintado + texto oscurecido del mismo tono, no color plano), reusada
// como botón del selector de divisa.
const CURRENCY_PILL_CLASS = {
  COP: "currency-pill-cop",
  USD: "currency-pill-usd",
  EUR: "currency-pill-eur",
};

// Divisa elegida en el selector de Inicio. Vive en memoria del módulo
// (no en Firestore): se mantiene mientras se navega dentro de la app y
// se resetea solo al recargar la página, tal como se pidió.
let selectedCurrency = null;

// Divisas que están REALMENTE en uso entre los viajes activos, en el
// orden fijo de SUPPORTED_CURRENCIES. Si no hay ningún viaje activo,
// igual se deja COP disponible para que el selector no quede vacío.
function getCurrenciesInUse(trips) {
  const inUse = SUPPORTED_CURRENCIES.filter((currency) => trips.some((t) => t.currency === currency));
  return inUse.length > 0 ? inUse : ["COP"];
}

// La divisa con más viajes activos; empate (incluido "nadie tiene
// viajes") se resuelve a favor de COP.
function getDefaultCurrency(trips) {
  const counts = {};
  for (const trip of trips) counts[trip.currency] = (counts[trip.currency] ?? 0) + 1;

  let best = "COP";
  let bestCount = counts.COP ?? 0;
  for (const currency of SUPPORTED_CURRENCIES) {
    const count = counts[currency] ?? 0;
    if (count > bestCount) {
      best = currency;
      bestCount = count;
    }
  }
  return best;
}

function computeKpiForCurrency(trips, currency) {
  let spent = 0;
  let budget = 0;
  for (const trip of trips) {
    if (trip.currency !== currency) continue;
    spent += getTripTotal(trip.id);
    budget += trip.budgetLimit;
  }
  return { spent, remaining: budget - spent };
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

function renderCurrencySelect(currenciesInUse, currency) {
  const options = currenciesInUse
    .map(
      (c) => `
      <li role="presentation">
        <button
          type="button"
          role="option"
          aria-selected="${c === currency}"
          class="currency-select-option"
          data-currency="${c}"
        >${c}</button>
      </li>
    `
    )
    .join("");

  return `
    <div class="currency-select">
      <button
        type="button"
        id="currency-select-toggle"
        class="currency-pill ${CURRENCY_PILL_CLASS[currency] ?? ""} currency-select-toggle"
        aria-haspopup="listbox"
        aria-expanded="false"
      >
        <span>${currency}</span>
        ${icon("chevron-down", "currency-select-caret")}
      </button>
      <ul class="currency-select-menu" role="listbox" hidden>${options}</ul>
    </div>
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
  const currenciesInUse = getCurrenciesInUse(trips);

  // Si nunca se eligió divisa, o la elegida ya no tiene ningún viaje
  // activo (se cerró/eliminó), se vuelve a calcular el default.
  if (!selectedCurrency || !currenciesInUse.includes(selectedCurrency)) {
    selectedCurrency = getDefaultCurrency(trips);
  }

  const kpi = computeKpiForCurrency(trips, selectedCurrency);

  container.innerHTML = `
    <main class="page page-home">
      <header class="page-header">
        <h1>Inicio</h1>
        <div class="page-header-actions">
          ${renderCurrencySelect(currenciesInUse, selectedCurrency)}
          <a href="#/nuevo-viaje" class="button-primary">${icon("plus")}<span>Nuevo viaje</span></a>
        </div>
      </header>

      <ul class="kpi-row">
        ${renderKpiCard({ iconName: "wallet", label: "Gastado en el periodo", value: formatCurrency(kpi.spent, selectedCurrency) })}
        ${renderKpiCard({ iconName: "piggy-bank", label: "Presupuesto restante", value: formatCurrency(kpi.remaining, selectedCurrency) })}
        ${renderKpiCard({ iconName: "plane", label: "Viajes activos", value: trips.length })}
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

  const currencySelect = container.querySelector(".currency-select");
  const currencyToggle = container.querySelector("#currency-select-toggle");
  const currencyMenu = container.querySelector(".currency-select-menu");

  function onDocumentClick(event) {
    if (!currencySelect.contains(event.target)) closeCurrencyMenu();
  }

  function onKeydown(event) {
    if (event.key === "Escape") closeCurrencyMenu();
  }

  function openCurrencyMenu() {
    currencyMenu.hidden = false;
    currencyToggle.setAttribute("aria-expanded", "true");
    document.addEventListener("click", onDocumentClick);
    document.addEventListener("keydown", onKeydown);
  }

  function closeCurrencyMenu() {
    currencyMenu.hidden = true;
    currencyToggle.setAttribute("aria-expanded", "false");
    document.removeEventListener("click", onDocumentClick);
    document.removeEventListener("keydown", onKeydown);
  }

  currencyToggle.addEventListener("click", (event) => {
    event.stopPropagation();
    if (currencyMenu.hidden) openCurrencyMenu();
    else closeCurrencyMenu();
  });

  container.querySelectorAll(".currency-select-option").forEach((button) => {
    button.addEventListener("click", () => {
      selectedCurrency = button.dataset.currency;
      closeCurrencyMenu();
      render(container);
    });
  });

  container.querySelectorAll(".trip-card-close").forEach((button) => {
    button.addEventListener("click", async () => {
      button.disabled = true;
      await closeTrip(button.dataset.tripId);
      render(container);
    });
  });
}
