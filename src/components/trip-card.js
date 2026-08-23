// Card de viaje (Inicio, Mis viajes): foto con badge de duración,
// nombre, presupuesto + barra de progreso, badge de semáforo y,
// opcionalmente, el botón "Finalizar viaje".

import { icon } from "../utils/icons.js";
import { formatCurrency } from "../utils/currency.js";
import { getTripTotal } from "../data/store.js";
import { getBudgetStatus, getStatusMeta } from "../utils/status.js";
import { statusBadge } from "./status-badge.js";
import { escapeHtml } from "../utils/dom.js";

/**
 * "N noches" si el viaje tiene fecha de inicio Y fin con un rango
 * válido (fin > inicio); si falta alguna fecha, no se fuerza el badge.
 * @param {{ startDate?: string, endDate?: string }} trip
 */
function computeDurationBadge(trip) {
  if (!trip.startDate || !trip.endDate) return "";
  const start = new Date(`${trip.startDate}T00:00:00Z`);
  const end = new Date(`${trip.endDate}T00:00:00Z`);
  const nights = Math.round((end - start) / 86400000);
  if (nights <= 0) return "";
  return `${nights} noche${nights === 1 ? "" : "s"}`;
}

/**
 * Barra delgada de % de presupuesto usado, color del semáforo (mismo
 * criterio que statusBadge). El ancho se topa al 100% aunque el gasto
 * real supere el presupuesto, para no desbordar el contenedor.
 */
function budgetProgressBar(spent, budgetLimit) {
  const status = getBudgetStatus(spent, budgetLimit);
  const ratio = budgetLimit > 0 ? spent / budgetLimit : 0;
  const widthPercent = Math.min(Math.max(ratio, 0), 1) * 100;
  const colorVar = getStatusMeta(status).colorVar;

  return `
    <div class="budget-progress">
      <div class="budget-progress-fill" style="width:${widthPercent}%;background:var(${colorVar})"></div>
    </div>
  `;
}

/**
 * @param {import("../data/store.js").Trip} trip
 * @param {{ showCloseButton?: boolean }} [options]
 */
export function renderTripCard(trip, { showCloseButton = false } = {}) {
  const spent = getTripTotal(trip.id);
  const status = getBudgetStatus(spent, trip.budgetLimit);
  const safePhotoUrl = /^https?:\/\//.test(trip.photoUrl || "") ? escapeHtml(trip.photoUrl) : "";
  const duration = computeDurationBadge(trip);

  return `
    <li class="trip-card">
      <a href="#/viaje/${trip.id}" class="trip-card-link">
        <div class="trip-card-photo"${safePhotoUrl ? ` style="background-image:url('${safePhotoUrl}')"` : ""}>
          ${!safePhotoUrl ? icon("plane", "trip-card-photo-placeholder") : ""}
          ${duration ? `<span class="duration-badge">${duration}</span>` : ""}
        </div>
        <div class="trip-card-body">
          <p class="trip-card-name" title="${escapeHtml(trip.name)}">${escapeHtml(trip.name)}</p>
          <p class="trip-card-budget">
            ${formatCurrency(spent)} / ${formatCurrency(trip.budgetLimit)}
          </p>
          ${budgetProgressBar(spent, trip.budgetLimit)}
          ${statusBadge(status)}
        </div>
      </a>
      ${
        showCloseButton
          ? `
        <button type="button" class="trip-card-close button-danger-outline" data-trip-id="${trip.id}">
          ${icon("trash-2")}<span>Finalizar viaje</span>
        </button>
      `
          : ""
      }
    </li>
  `;
}
