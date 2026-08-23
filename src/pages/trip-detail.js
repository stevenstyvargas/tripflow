// Página: detalle de viaje. Muestra el estado del presupuesto, el
// historial de gastos y el formulario para registrar uno nuevo.
// La dona y el semáforo de Inicio, y las alertas de Alertas, se
// recalculan solos la próxima vez que se rendericen: leen siempre el
// estado en memoria de store.js, así que un gasto nuevo ya persistido
// ahí se refleja sin código adicional.

import { getTrip, getTripTotal, getExpensesByTrip, addExpense, deleteExpense } from "../data/store.js";
import { formatCurrency } from "../utils/currency.js";
import { getBudgetStatus } from "../utils/status.js";
import { statusBadge } from "../components/status-badge.js";
import { showConfirmModal } from "../components/confirm-modal.js";
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
        <p class="expense-item-amount">${formatCurrency(expense.amount, expense.currency)}</p>
        <p class="expense-item-date">${escapeHtml(expense.date)}</p>
      </div>
      <button type="button" class="button-danger-outline expense-item-delete" data-expense-id="${expense.id}">
        ${icon("trash-2")}<span>Eliminar</span>
      </button>
    </li>
  `;
}

function renderExpenseForm() {
  const today = new Date().toISOString().slice(0, 10);

  return `
    <form id="expense-form" class="expense-form" novalidate hidden>
      <p class="field">
        <label for="expense-amount">Monto</label>
        <input id="expense-amount" name="amount" type="number" inputmode="decimal" min="0.01" step="any" placeholder="0" required />
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

      <button type="submit">Guardar gasto</button>
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

  container.innerHTML = `
    <main class="page page-trip-detail">
      <header class="page-header">
        <div>
          <div class="trip-detail-title">
            <h1>${escapeHtml(trip.name)}</h1>
            <a href="#/viaje/${trip.id}/editar" class="icon-button" aria-label="Editar viaje">${icon("edit-2")}</a>
          </div>
          <p class="trip-detail-budget">
            ${formatCurrency(spent, trip.currency)} / ${formatCurrency(trip.budgetLimit, trip.currency)}
          </p>
          ${statusBadge(status)}
        </div>
        <button type="button" id="toggle-expense-form" class="button-primary">
          ${icon("plus")}<span>Agregar gasto</span>
        </button>
      </header>

      ${renderExpenseForm()}

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

  const toggleButton = container.querySelector("#toggle-expense-form");
  const form = container.querySelector("#expense-form");
  const errorBox = container.querySelector("#expense-form-error");
  const submitButton = form.querySelector("button[type=submit]");

  toggleButton.addEventListener("click", () => {
    form.hidden = !form.hidden;
    if (!form.hidden) form.querySelector("#expense-amount").focus();
  });

  container.querySelectorAll(".expense-item-delete").forEach((button) => {
    button.addEventListener("click", () => {
      const expense = expenses.find((e) => e.id === button.dataset.expenseId);
      if (!expense) return;

      showConfirmModal({
        title: "Eliminar gasto",
        body: `¿Eliminar este gasto de ${formatCurrency(expense.amount, expense.currency)}?`,
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

  async function saveExpense(expenseData) {
    submitButton.disabled = true;
    try {
      await addExpense(expenseData);
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
    const amount = Number(formData.get("amount"));
    const expenseData = {
      tripId: trip.id,
      category: formData.get("category"),
      amount,
      currency: trip.currency,
      date: formData.get("date"),
      note: formData.get("note").trim(),
    };

    // Chequeo previo al guardado: si el monto es válido y hace que el
    // total supere el presupuesto, se confirma antes de persistir en vez
    // de guardar y avisar después — prevenir el error, no solo reportarlo.
    const newTotal = spent + amount;
    const exceedsBudget = trip.budgetLimit > 0 && amount > 0 && newTotal > trip.budgetLimit;

    if (!exceedsBudget) {
      saveExpense(expenseData);
      return;
    }

    const percent = Math.round((newTotal / trip.budgetLimit) * 100);
    showConfirmModal({
      title: "Vas a superar el presupuesto",
      body: `
        <strong>${escapeHtml(trip.name)}</strong> lleva ${formatCurrency(spent, trip.currency)}
        gastados. Con este gasto nuevo, el total sería
        ${formatCurrency(newTotal, trip.currency)} de un presupuesto de
        ${formatCurrency(trip.budgetLimit, trip.currency)} (${percent}%).
      `,
      confirmLabel: "Registrar de todas formas",
      cancelLabel: "Cancelar",
      onConfirm: () => saveExpense(expenseData),
    });
  });
}
