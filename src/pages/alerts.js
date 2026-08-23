// Página: Alertas. Viajes activos que cruzaron el umbral naranja (80%)
// o rojo (100%) del presupuesto — mismo semáforo que Inicio/Historial.
// Cards con foto de destino (mismo patrón visual que Historial): borde
// completo del color de severidad, ícono+texto de alerta, y botón
// "Ver viaje" hacia el detalle de ese viaje.

import { getActiveTrips, getTripTotal } from "../data/store.js";
import { formatCurrency } from "../utils/currency.js";
import { getBudgetStatus, getStatusMeta, STATUS } from "../utils/status.js";
import { accountMenu, bindAccountMenu } from "../components/account-menu.js";
import { getCurrentUser } from "../data/auth.js";
import { icon } from "../utils/icons.js";
import { escapeHtml } from "../utils/dom.js";

function describeAlert(trip, spent, status) {
  const ratio = trip.budgetLimit > 0 ? spent / trip.budgetLimit : 0;
  const percent = Math.round(ratio * 100);

  if (status === STATUS.DANGER) {
    return `Superó el presupuesto: ${percent}% usado (${formatCurrency(spent)} de ${formatCurrency(trip.budgetLimit)}).`;
  }
  return `Al borde del límite: ${percent}% del presupuesto usado (${formatCurrency(spent)} de ${formatCurrency(trip.budgetLimit)}).`;
}

function renderAlert(trip) {
  const spent = getTripTotal(trip.id);
  const status = getBudgetStatus(spent, trip.budgetLimit);
  const meta = getStatusMeta(status);
  const safePhotoUrl = /^https?:\/\//.test(trip.photoUrl || "") ? escapeHtml(trip.photoUrl) : "";

  return `
    <li class="alert-item alert-item-${status}">
      <div class="alert-item-photo"${safePhotoUrl ? ` style="background-image:url('${safePhotoUrl}')"` : ""}>
        ${!safePhotoUrl ? icon("plane", "trip-card-photo-placeholder") : ""}
      </div>
      ${icon(meta.icon, "alert-item-icon")}
      <div class="alert-item-body">
        <p class="alert-item-title">${escapeHtml(trip.name)}</p>
        <p class="alert-item-text">${describeAlert(trip, spent, status)}</p>
      </div>
      <a href="#/viaje/${trip.id}" class="button-outline alert-item-action">
        <span>Ver viaje</span>${icon("arrow-right")}
      </a>
    </li>
  `;
}

export function render(container) {
  const alerts = getActiveTrips()
    .map((trip) => ({ trip, status: getBudgetStatus(getTripTotal(trip.id), trip.budgetLimit) }))
    .filter(({ status }) => status !== STATUS.OK)
    .sort((a, b) => (a.status === b.status ? 0 : a.status === STATUS.DANGER ? -1 : 1))
    .map(({ trip }) => trip);

  container.innerHTML = `
    <main class="page page-alerts">
      <header class="page-header">
        <h1>Alertas</h1>
        <div class="page-header-actions">
          ${accountMenu(getCurrentUser())}
        </div>
      </header>

      ${
        alerts.length === 0
          ? `<p class="empty-state">${icon("circle-check")} Ningún viaje activo está cerca o por encima de su presupuesto.</p>`
          : `<ul class="alert-list">${alerts.map(renderAlert).join("")}</ul>`
      }
    </main>
  `;

  bindAccountMenu(container);
}
