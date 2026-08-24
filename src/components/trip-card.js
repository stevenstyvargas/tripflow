// Card de viaje (Inicio, Mis viajes): foto con badge de duración,
// nombre, presupuesto + barra de progreso, badge de semáforo y,
// opcionalmente, el badge de ESTADO (En curso/Finalizado — distinto del
// semáforo, que solo habla de presupuesto). En viajes finalizados, SOLO
// la foto (o el ícono+fondo placeholder) va en escala de grises — el
// resto de la card (texto, badges, barra de progreso) mantiene su
// color normal, porque el estado del presupuesto siempre se comunica
// con color, no solo ícono+texto. Las acciones (editar, finalizar)
// viven en el Detalle de viaje, no acá.

import { icon } from "../utils/icons.js";
import { formatCurrency } from "../utils/currency.js";
import { getTripTotal, TRIP_STATUS } from "../data/store.js";
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

// Badge de ESTADO del viaje (activo/cerrado) — a propósito en gris
// neutro, nunca verde/naranja/rojo, para no mezclarlo con el semáforo
// de presupuesto (que es .status-badge, siempre a su lado).
function tripStateBadge(trip) {
  const isClosed = trip.status === TRIP_STATUS.CLOSED;
  return `
    <span class="trip-state-badge">
      ${icon(isClosed ? "lock" : "plane", "trip-state-badge-icon")}
      <span>${isClosed ? "Finalizado" : "En curso"}</span>
    </span>
  `;
}

/**
 * @param {import("../data/store.js").Trip} trip
 * @param {{ showStateBadge?: boolean }} [options]
 */
export function renderTripCard(trip, { showStateBadge = false } = {}) {
  const spent = getTripTotal(trip.id);
  const status = getBudgetStatus(spent, trip.budgetLimit);
  const safePhotoUrl = /^https?:\/\//.test(trip.photoUrl || "") ? escapeHtml(trip.photoUrl) : "";
  const duration = computeDurationBadge(trip);
  const isClosed = trip.status === TRIP_STATUS.CLOSED;

  return `
    <li class="trip-card">
      <a href="#/viaje/${trip.id}" class="trip-card-link">
        <div class="trip-card-photo${isClosed ? " trip-card-photo-closed" : ""}"${safePhotoUrl ? ` style="background-image:url('${safePhotoUrl}')"` : ""}>
          ${!safePhotoUrl ? icon("plane", "trip-card-photo-placeholder") : ""}
          ${duration ? `<span class="duration-badge">${duration}</span>` : ""}
        </div>
        <div class="trip-card-body">
          <p class="trip-card-name" title="${escapeHtml(trip.name)}">${escapeHtml(trip.name)}</p>
          <p class="trip-card-budget">
            ${formatCurrency(spent)} / ${formatCurrency(trip.budgetLimit)}
          </p>
          ${budgetProgressBar(spent, trip.budgetLimit)}
          <div class="trip-card-badges">
            ${showStateBadge ? tripStateBadge(trip) : ""}
            ${statusBadge(status)}
          </div>
        </div>
      </a>
    </li>
  `;
}
