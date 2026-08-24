// Página: detalle de viaje. Barra de 40px (igual que las demás
// pantallas) con foto miniatura + nombre (truncado con "...", mismo
// criterio que las cards) + badge de semáforo compacto a la izquierda,
// y las acciones (Google Calendar/Compartir por WhatsApp — link wa.me
// con texto plano, sin backend ni PDF, ver docs/product-decisions.md —
// /Agregar gasto/menú de cuenta) a la derecha. Debajo, 2 columnas: KPIs
// "Presupuesto"/"Gastado"/"Restante" apiladas en un ancho fijo (mismo
// components/kpi-card.js que Inicio) y, a la derecha, "Gasto por
// categoría" de ESTE viaje (components/category-chart.js: torres en
// desktop, dona en mobile — mismo componente que usa dashboard.js,
// unificado por breakpoint, no por pantalla). "Gastos registrados" va
// debajo, a
// todo el ancho — "Agregar gasto"/editar un gasto abren el mismo
// formulario en un modal (mismo overlay/tarjeta que "¿Eliminar este
// viaje?"), ya no como bloque inline en el flujo de la página.
// Editar/finalizar viaje (antes en el header y en las cards de Mis
// viajes) viven en una fila de botones al final de esta sección, tras
// el último gasto de la lista. En viajes ya "Finalizado", "Finalizar
// viaje" se reemplaza por "Eliminar viaje" (borrado PERMANENTE, con
// confirmación y borrado en cascada de sus gastos — ver
// docs/product-decisions.md): nunca conviven ambos botones. El
// semáforo de Inicio y las alertas de Alertas se recalculan solos la
// próxima vez que se rendericen: leen siempre el estado en memoria de
// store.js, así que un gasto nuevo ya persistido ahí se refleja sin
// código adicional.

import {
  getTrip,
  getTripTotal,
  getExpensesByTrip,
  addExpense,
  updateExpense,
  deleteExpense,
  closeTrip,
  deleteTrip,
  TRIP_STATUS,
} from "../data/store.js";
import { formatCurrency, formatStoredAmount } from "../utils/currency.js";
import { bindAmountInput, readAmountInput } from "../utils/amount-input.js";
import { getBudgetStatus } from "../utils/status.js";
import { statusBadge } from "../components/status-badge.js";
import { renderKpiCard } from "../components/kpi-card.js";
import { showConfirmModal, showSuccessModal } from "../components/confirm-modal.js";
import { categoryChart } from "../components/category-chart.js";
import { accountMenu, bindAccountMenu } from "../components/account-menu.js";
import { getCurrentUser } from "../data/auth.js";
import { EXPENSE_CATEGORIES } from "../utils/categories.js";
import { icon } from "../utils/icons.js";
import { escapeHtml } from "../utils/dom.js";

function renderExpenseItem(expense) {
  const category = EXPENSE_CATEGORIES.find((c) => c.id === expense.category);

  return `
    <li class="expense-item">
      ${icon(category?.icon ?? "receipt", "expense-item-icon")}
      <div class="expense-item-body">
        <p class="expense-item-category">${escapeHtml(category?.label ?? expense.category)}</p>
        ${expense.note ? `<p class="expense-item-note">${escapeHtml(expense.note)}</p>` : ""}
      </div>
      <div class="expense-item-meta">
        <p class="expense-item-amount">${formatCurrency(expense.amount)}</p>
        <p class="expense-item-date">${escapeHtml(expense.date)}</p>
      </div>
      <div class="expense-item-actions">
        <button type="button" class="icon-button expense-item-edit" data-expense-id="${expense.id}" aria-label="Editar gasto">
          ${icon("edit-2")}
        </button>
        <button type="button" class="button-danger-outline expense-item-delete" data-expense-id="${expense.id}">
          ${icon("trash-2")}<span>Eliminar</span>
        </button>
      </div>
    </li>
  `;
}

// Mismos colores por categoría que el resto de la app
// (--color-category-* en tokens.css), calculado solo con los gastos de
// ESTE viaje.
function computeCategoryBreakdown(expenses) {
  const totals = Object.fromEntries(EXPENSE_CATEGORIES.map((c) => [c.id, 0]));

  for (const expense of expenses) {
    if (expense.category in totals) totals[expense.category] += expense.amount;
  }

  return EXPENSE_CATEGORIES.map((c) => ({
    id: c.id,
    label: c.label,
    icon: c.icon,
    value: totals[c.id],
    color: `var(${c.colorVar})`,
  }));
}

// Suma un día en UTC a una fecha "YYYY-MM-DD" y devuelve "YYYYMMDD".
// Se usa para el fin de un evento de día completo en Google Calendar,
// que trata `dates=inicio/fin` como un rango con el fin EXCLUSIVO — sin
// sumar el día, el último día del viaje quedaría fuera del evento.
function toGoogleCalendarEndDate(dateStr) {
  const date = new Date(`${dateStr}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10).replaceAll("-", "");
}

// Link con parámetros en la URL (sin OAuth ni API de Google Calendar,
// ver docs/product-decisions.md): basta con abrir la pantalla de
// "crear evento" ya prellenada, el usuario la confirma o ajusta en
// Google Calendar directamente.
function buildGoogleCalendarUrl(trip) {
  const start = trip.startDate.replaceAll("-", "");
  const end = toGoogleCalendarEndDate(trip.endDate);
  const text = encodeURIComponent(trip.name);
  const details = encodeURIComponent(`Presupuesto: ${formatCurrency(trip.budgetLimit)}`);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${start}/${end}&details=${details}`;
}

// Texto explícito del estado del semáforo para el mensaje de WhatsApp,
// con la primera letra en mayúscula porque acá va como una oración,
// no como una etiqueta chica junto a un ícono (mismas 3 frases que
// usaba el bloque "Gasto vs presupuesto" de Inicio, eliminado por
// redundante con el KPI "Presupuesto restante" — ver
// docs/product-decisions.md).
const STATUS_SHARE_LABELS = {
  ok: "En rango",
  warning: "Cerca del límite",
  danger: "Presupuesto excedido",
};

const MONTHS_SHORT_ES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

// "12-16 nov" si el rango cae en el mismo mes/año, o "28 oct - 3 nov"
// si cruza de mes — mismo parseo en UTC que toGoogleCalendarEndDate(),
// para no repetir el bug de zona horaria que esa función ya evita.
function formatShareDateRange(startDate, endDate) {
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  const startMonth = MONTHS_SHORT_ES[start.getUTCMonth()];
  const endMonth = MONTHS_SHORT_ES[end.getUTCMonth()];

  if (start.getUTCFullYear() === end.getUTCFullYear() && start.getUTCMonth() === end.getUTCMonth()) {
    return `${start.getUTCDate()}-${end.getUTCDate()} ${endMonth}`;
  }
  return `${start.getUTCDate()} ${startMonth} - ${end.getUTCDate()} ${endMonth}`;
}

// Texto plano para compartir por WhatsApp — mismo cálculo de estado
// (status, ya calculado en render() con getBudgetStatus(), el mismo
// que usa el modal de "vas a superar el presupuesto") y las mismas
// categorías con gasto real de computeCategoryBreakdown(), sin volver
// a calcular nada de eso acá.
function buildShareMessage(trip, spent, status, expenses) {
  const remaining = trip.budgetLimit - spent;
  const dateRange = trip.startDate && trip.endDate ? ` (${formatShareDateRange(trip.startDate, trip.endDate)})` : "";

  const topCategories = computeCategoryBreakdown(expenses)
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 3)
    .map((c) => `${c.label} ${formatCurrency(c.value)}`)
    .join(", ");

  const lines = [
    `Viaje: ${trip.name}${dateRange}`,
    `Presupuesto: ${formatCurrency(trip.budgetLimit)} | Gastado: ${formatCurrency(spent)} | Restante: ${formatCurrency(remaining)}`,
    `Estado: ${STATUS_SHARE_LABELS[status]}`,
  ];

  if (topCategories) {
    lines.push(`Top gastos: ${topCategories}`);
  }

  return lines.join("\n");
}

function buildWhatsAppShareUrl(trip, spent, status, expenses) {
  return `https://wa.me/?text=${encodeURIComponent(buildShareMessage(trip, spent, status, expenses))}`;
}

function renderExpenseForm() {
  const today = new Date().toISOString().slice(0, 10);

  return `
    <form id="expense-form" class="expense-form" novalidate>
      <p class="field">
        <label for="expense-amount">Monto (COP)</label>
        <input id="expense-amount" name="amount" type="text" inputmode="numeric" placeholder="0" required />
      </p>

      <p class="field">
        <label for="expense-category">Categoría</label>
        <select id="expense-category" name="category" required>
          ${EXPENSE_CATEGORIES.map((c) => `<option value="${c.id}">${c.label}</option>`).join("")}
        </select>
      </p>

      <p class="field">
        <label for="expense-date">Fecha</label>
        <input id="expense-date" name="date" type="date" value="${today}" required />
      </p>

      <p class="field">
        <label for="expense-note">Descripción (opcional)</label>
        <input id="expense-note" name="note" type="text" placeholder="Ej. Taxi al aeropuerto" />
      </p>

      <p class="field-error" id="expense-form-error" role="alert" hidden></p>

      <div class="expense-form-actions">
        <button type="submit">Guardar gasto</button>
        <button type="button" class="button-outline" id="expense-form-cancel">Cancelar</button>
      </div>
    </form>
  `;
}

// Modal de "Agregar gasto"/"Editar gasto": mismo overlay+tarjeta que
// showConfirmModal() ("¿Eliminar este viaje?" — .modal-overlay/.modal),
// pero embebido en el propio markup de la página (no creado con JS al
// vuelo) porque necesita bindings de formulario (submit, cancelar,
// precarga en modo edición) que los modales de un solo botón no tienen.
// Empieza oculto (hidden); #toggle-expense-form y el lápiz de cada gasto
// lo abren, "Cancelar" y un click en el overlay lo cierran sin guardar.
function renderExpenseModal() {
  return `
    <div class="modal-overlay" id="expense-modal" hidden>
      <div class="modal expense-modal-card" role="dialog" aria-modal="true" aria-labelledby="expense-modal-title">
        <h2 id="expense-modal-title" class="modal-title">Agregar gasto</h2>
        ${renderExpenseForm()}
      </div>
    </div>
  `;
}

export function render(container, { tripId } = {}) {
  const trip = getTrip(tripId);

  if (!trip) {
    container.innerHTML = `
      <main class="page page-trip-detail">
        <p class="empty-state">Este viaje no existe o fue cerrado.</p>
        <a href="#/" class="button-primary">${icon("home")}<span>Volver a Inicio</span></a>
      </main>
    `;
    return;
  }

  const spent = getTripTotal(trip.id);
  const status = getBudgetStatus(spent, trip.budgetLimit);
  const expenses = getExpensesByTrip(trip.id)
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date));
  // Un viaje cerrado se ve en modo solo lectura desde Historial: ya
  // pasó, no tiene sentido seguir agregando gastos. El botón "Agregar
  // gasto" no se muestra, pero el formulario sigue en el DOM (oculto)
  // porque editar/eliminar un gasto puntual de un viaje cerrado sigue
  // permitido — no se pidió bloquear eso.
  const isClosed = trip.status === TRIP_STATUS.CLOSED;
  const safePhotoUrl = /^https?:\/\//.test(trip.photoUrl || "") ? escapeHtml(trip.photoUrl) : "";

  container.innerHTML = `
    <main class="page page-trip-detail">
      <header class="page-header">
        <div class="trip-detail-title">
          <div class="trip-detail-photo-mini"${safePhotoUrl ? ` style="background-image:url('${safePhotoUrl}')"` : ""}>
            ${!safePhotoUrl ? icon("plane", "trip-card-photo-placeholder") : ""}
          </div>
          <h1 title="${escapeHtml(trip.name)}">${escapeHtml(trip.name)}</h1>
          ${statusBadge(status, "status-badge-sm")}
        </div>
        <div class="page-header-actions">
          ${
            trip.startDate && trip.endDate
              ? `
            <a href="${buildGoogleCalendarUrl(trip)}" target="_blank" rel="noopener noreferrer" class="button-outline" aria-label="Agregar a Google Calendar" title="Agregar a Google Calendar">
              ${icon("calendar")}<span>Agregar a Google Calendar</span>
            </a>
          `
              : ""
          }
          <a href="${buildWhatsAppShareUrl(trip, spent, status, expenses)}" target="_blank" rel="noopener noreferrer" class="button-outline" aria-label="Compartir por WhatsApp" title="Compartir por WhatsApp">
            ${icon("message-circle")}<span>Compartir por WhatsApp</span>
          </a>
          ${
            !isClosed
              ? `
            <button type="button" id="toggle-expense-form" class="button-primary">
              ${icon("plus")}<span>Agregar gasto</span>
            </button>
          `
              : ""
          }
          ${accountMenu(getCurrentUser())}
        </div>
      </header>

      <div class="trip-detail-body">
        <div class="trip-detail-kpis">
          <ul class="kpi-row">
            ${renderKpiCard({ iconName: "target", label: "Presupuesto", value: formatCurrency(trip.budgetLimit) })}
            ${renderKpiCard({ iconName: "wallet", label: "Gastado", value: formatCurrency(spent) })}
            ${renderKpiCard({ iconName: "piggy-bank", label: "Restante", value: formatCurrency(trip.budgetLimit - spent) })}
          </ul>
        </div>
        <div class="trip-detail-content">
          <section class="section">
            <h2>Gasto por categoría</h2>
            ${categoryChart(computeCategoryBreakdown(expenses))}
          </section>
        </div>
      </div>

      ${renderExpenseModal()}

      <section class="section">
        <h2>Gastos registrados</h2>
        ${
          expenses.length === 0
            ? `<div class="expense-list-empty"><p class="empty-state">Todavía no has registrado gastos en este viaje.</p></div>`
            : `<ul class="expense-list">${expenses.map(renderExpenseItem).join("")}</ul>`
        }
        <div class="trip-detail-footer-actions">
          <a href="#/viaje/${trip.id}/editar" class="button-outline">
            ${icon("edit-2")}<span>Editar viaje</span>
          </a>
          ${
            !isClosed
              ? `
            <button type="button" id="close-trip" class="button-danger-outline">
              ${icon("trash-2")}<span>Finalizar viaje</span>
            </button>
          `
              : `
            <button type="button" id="delete-trip" class="button-danger-outline">
              ${icon("trash-2")}<span>Eliminar viaje</span>
            </button>
          `
          }
        </div>
      </section>
    </main>
  `;

  bindAccountMenu(container);

  const toggleButton = container.querySelector("#toggle-expense-form");
  const modalOverlay = container.querySelector("#expense-modal");
  const modalTitle = container.querySelector("#expense-modal-title");
  const form = container.querySelector("#expense-form");
  const errorBox = container.querySelector("#expense-form-error");
  const submitButton = form.querySelector("button[type=submit]");
  const cancelButton = container.querySelector("#expense-form-cancel");
  const amountInput = form.querySelector("#expense-amount");

  bindAmountInput(amountInput);

  // Un solo formulario para agregar y editar: editingExpenseId distingue
  // qué hace el submit. Reutiliza el mismo <form>, no uno nuevo, siguiendo
  // el mismo criterio que el punto de "eliminar gasto" (un solo patrón,
  // no dos comportamientos distintos para casos similares).
  let editingExpenseId = null;

  function closeExpenseModal() {
    modalOverlay.hidden = true;
    editingExpenseId = null;
    form.reset();
    submitButton.textContent = "Guardar gasto";
    modalTitle.textContent = "Agregar gasto";
    errorBox.hidden = true;
  }

  function openAddModal() {
    editingExpenseId = null;
    form.reset();
    submitButton.textContent = "Guardar gasto";
    modalTitle.textContent = "Agregar gasto";
    errorBox.hidden = true;
    modalOverlay.hidden = false;
    amountInput.focus();
  }

  function openEditModal(expense) {
    editingExpenseId = expense.id;
    amountInput.value = formatStoredAmount(expense.amount);
    form.querySelector("#expense-category").value = expense.category;
    form.querySelector("#expense-date").value = expense.date;
    form.querySelector("#expense-note").value = expense.note ?? "";
    submitButton.textContent = "Guardar cambios";
    modalTitle.textContent = "Editar gasto";
    errorBox.hidden = true;
    modalOverlay.hidden = false;
    amountInput.focus();
  }

  if (toggleButton) {
    toggleButton.addEventListener("click", openAddModal);
  }

  cancelButton.addEventListener("click", closeExpenseModal);

  // Cerrar solo si el click fue en el overlay mismo (fondo oscuro), no
  // en la tarjeta del modal — mismo criterio que showConfirmModal().
  modalOverlay.addEventListener("click", (event) => {
    if (event.target === modalOverlay) closeExpenseModal();
  });

  container.querySelectorAll(".expense-item-edit").forEach((button) => {
    button.addEventListener("click", () => {
      const expense = expenses.find((e) => e.id === button.dataset.expenseId);
      if (expense) openEditModal(expense);
    });
  });

  const closeTripButton = container.querySelector("#close-trip");
  if (closeTripButton) {
    closeTripButton.addEventListener("click", async () => {
      closeTripButton.disabled = true;
      await closeTrip(trip.id);
      showSuccessModal({
        title: "El viaje ha sido finalizado",
        onClose: () => render(container, { tripId: trip.id }),
      });
    });
  }

  const deleteTripButton = container.querySelector("#delete-trip");
  if (deleteTripButton) {
    deleteTripButton.addEventListener("click", () => {
      showConfirmModal({
        title: "¿Eliminar este viaje?",
        body: `
          Esta acción no se puede deshacer. Se eliminarán permanentemente
          el viaje <strong>${escapeHtml(trip.name)}</strong> y sus
          ${expenses.length} gasto${expenses.length === 1 ? "" : "s"}
          registrado${expenses.length === 1 ? "" : "s"}.
        `,
        confirmLabel: "Eliminar permanentemente",
        cancelLabel: "Cancelar",
        onConfirm: async () => {
          deleteTripButton.disabled = true;
          await deleteTrip(trip.id);
          showSuccessModal({
            title: "El viaje ha sido eliminado",
            onClose: () => {
              window.location.hash = "#/viajes";
            },
          });
        },
      });
    });
  }

  container.querySelectorAll(".expense-item-delete").forEach((button) => {
    button.addEventListener("click", () => {
      const expense = expenses.find((e) => e.id === button.dataset.expenseId);
      if (!expense) return;

      showConfirmModal({
        title: "Eliminar gasto",
        body: `¿Eliminar este gasto de ${formatCurrency(expense.amount)}?`,
        confirmLabel: "Eliminar",
        cancelLabel: "Cancelar",
        onConfirm: async () => {
          button.disabled = true;
          await deleteExpense(expense.id);
          render(container, { tripId: trip.id });
        },
      });
    });
  });

  async function persistExpense(expenseData, expenseId) {
    submitButton.disabled = true;
    try {
      if (expenseId) {
        await updateExpense(expenseId, expenseData);
      } else {
        await addExpense(expenseData);
      }
      render(container, { tripId: trip.id });
    } catch (err) {
      errorBox.textContent = err.message;
      errorBox.hidden = false;
      submitButton.disabled = false;
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    errorBox.hidden = true;

    const formData = new FormData(form);
    const amount = readAmountInput(amountInput);
    const expenseData = {
      tripId: trip.id,
      category: formData.get("category"),
      amount,
      currency: trip.currency,
      date: formData.get("date"),
      note: formData.get("note").trim(),
    };

    // spent ya incluye el monto viejo del gasto en edición (si lo hay);
    // el total proyectado le quita ese monto viejo y suma el nuevo.
    const original = editingExpenseId ? expenses.find((e) => e.id === editingExpenseId) : null;
    const newTotal = spent - (original?.amount ?? 0) + amount;

    // Chequeo previo al guardado: si el monto es válido y hace que el
    // total supere el presupuesto, se confirma antes de persistir en vez
    // de guardar y avisar después — prevenir el error, no solo reportarlo.
    // Al editar, solo se pregunta si el cambio es lo que hace cruzar el
    // límite (si el viaje ya estaba excedido antes de este cambio, no
    // se vuelve a preguntar por lo mismo).
    const alreadyExceeded = trip.budgetLimit > 0 && spent > trip.budgetLimit;
    const willExceed = trip.budgetLimit > 0 && amount > 0 && newTotal > trip.budgetLimit;
    const needsConfirmation = willExceed && !(editingExpenseId && alreadyExceeded);

    if (!needsConfirmation) {
      persistExpense(expenseData, editingExpenseId);
      return;
    }

    const percent = Math.round((newTotal / trip.budgetLimit) * 100);
    showConfirmModal({
      title: "Vas a superar el presupuesto",
      body: `
        <strong>${escapeHtml(trip.name)}</strong> lleva ${formatCurrency(spent)}
        gastados. Con este ${editingExpenseId ? "cambio" : "gasto nuevo"}, el total sería
        ${formatCurrency(newTotal)} de un presupuesto de
        ${formatCurrency(trip.budgetLimit)} (${percent}%).
      `,
      confirmLabel: editingExpenseId ? "Guardar de todas formas" : "Registrar de todas formas",
      cancelLabel: "Cancelar",
      onConfirm: () => persistExpense(expenseData, editingExpenseId),
    });
  });
}
