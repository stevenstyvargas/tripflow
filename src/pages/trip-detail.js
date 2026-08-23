// Página: detalle de viaje. Muestra el estado del presupuesto, la torre
// de gasto por categoría de ESTE viaje, el historial de gastos y el
// formulario para registrar uno nuevo. El semáforo de Inicio y las
// alertas de Alertas se recalculan solos la próxima vez que se
// rendericen: leen siempre el estado en memoria de store.js, así que un
// gasto nuevo ya persistido ahí se refleja sin código adicional.

import { getTrip, getTripTotal, getExpensesByTrip, addExpense, updateExpense, deleteExpense, TRIP_STATUS } from "../data/store.js";
import { formatCurrency, formatStoredAmount } from "../utils/currency.js";
import { bindAmountInput, readAmountInput } from "../utils/amount-input.js";
import { getBudgetStatus } from "../utils/status.js";
import { statusBadge } from "../components/status-badge.js";
import { showConfirmModal } from "../components/confirm-modal.js";
import { barChart } from "../components/bar-chart.js";
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

function renderExpenseForm() {
  const today = new Date().toISOString().slice(0, 10);

  return `
    <form id="expense-form" class="expense-form" novalidate hidden>
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
        <button type="button" class="button-outline" id="expense-form-cancel" hidden>Cancelar</button>
      </div>
    </form>
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

  container.innerHTML = `
    <main class="page page-trip-detail">
      <header class="page-header">
        <div>
          <div class="trip-detail-title">
            <h1>${escapeHtml(trip.name)}</h1>
            <a href="#/viaje/${trip.id}/editar" class="icon-button" aria-label="Editar viaje">${icon("edit-2")}</a>
          </div>
          <p class="trip-detail-budget">
            ${formatCurrency(spent)} / ${formatCurrency(trip.budgetLimit)}
          </p>
          ${statusBadge(status)}
        </div>
        <div class="page-header-actions">
          ${
            trip.startDate && trip.endDate
              ? `
            <a href="${buildGoogleCalendarUrl(trip)}" target="_blank" rel="noopener noreferrer" class="button-outline">
              ${icon("calendar")}<span>Agregar a Google Calendar</span>
            </a>
          `
              : ""
          }
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

      ${renderExpenseForm()}

      <section class="section">
        <h2>Gasto por categoría de ${escapeHtml(trip.name)}</h2>
        ${barChart(computeCategoryBreakdown(expenses))}
      </section>

      <section class="section">
        <h2>Gastos registrados</h2>
        ${
          expenses.length === 0
            ? `<p class="empty-state">Todavía no has registrado gastos en este viaje.</p>`
            : `<ul class="expense-list">${expenses.map(renderExpenseItem).join("")}</ul>`
        }
      </section>
    </main>
  `;

  bindAccountMenu(container);

  const toggleButton = container.querySelector("#toggle-expense-form");
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

  function exitEditMode() {
    editingExpenseId = null;
    form.reset();
    submitButton.textContent = "Guardar gasto";
    cancelButton.hidden = true;
  }

  function enterEditMode(expense) {
    editingExpenseId = expense.id;
    form.hidden = false;
    amountInput.value = formatStoredAmount(expense.amount);
    form.querySelector("#expense-category").value = expense.category;
    form.querySelector("#expense-date").value = expense.date;
    form.querySelector("#expense-note").value = expense.note ?? "";
    submitButton.textContent = "Guardar cambios";
    cancelButton.hidden = false;
    errorBox.hidden = true;
    amountInput.focus();
  }

  if (toggleButton) {
    toggleButton.addEventListener("click", () => {
      if (!form.hidden) {
        form.hidden = true;
        exitEditMode();
        return;
      }
      exitEditMode();
      form.hidden = false;
      amountInput.focus();
    });
  }

  cancelButton.addEventListener("click", () => {
    exitEditMode();
    form.hidden = true;
  });

  container.querySelectorAll(".expense-item-edit").forEach((button) => {
    button.addEventListener("click", () => {
      const expense = expenses.find((e) => e.id === button.dataset.expenseId);
      if (expense) enterEditMode(expense);
    });
  });

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
