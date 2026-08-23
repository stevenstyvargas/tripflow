// Formulario de viaje (nombre, presupuesto, fechas, foto), compartido
// entre "Nuevo viaje" y "Editar viaje" — mismos campos, misma
// validación (delegada al store), solo cambian los valores iniciales,
// el texto del botón y qué hace onSubmit con los datos. v1 es de una
// sola divisa (COP), así que no hay campo de divisa que elegir — ver
// docs/product-decisions.md.

import { formatStoredAmount } from "../utils/currency.js";
import { bindAmountInput, readAmountInput } from "../utils/amount-input.js";
import { escapeHtml } from "../utils/dom.js";

function tripFormMarkup({ trip, submitLabel }) {
  return `
    <form id="trip-form" novalidate>
      <p class="field">
        <label for="trip-name">Nombre del viaje</label>
        <input id="trip-name" name="name" type="text" placeholder="Ej. Vacaciones en Cartagena" value="${escapeHtml(trip.name ?? "")}" required />
      </p>

      <p class="field">
        <label for="trip-budget">Presupuesto límite (COP)</label>
        <input id="trip-budget" name="budgetLimit" type="text" inputmode="numeric" placeholder="0" value="${formatStoredAmount(trip.budgetLimit)}" required />
      </p>

      <p class="field">
        <label for="trip-start">Fecha de inicio (opcional)</label>
        <input id="trip-start" name="startDate" type="date" value="${trip.startDate ?? ""}" />
      </p>

      <p class="field">
        <label for="trip-end">Fecha de fin (opcional)</label>
        <input id="trip-end" name="endDate" type="date" value="${trip.endDate ?? ""}" />
      </p>

      <p class="field">
        <label for="trip-photo">URL de foto del destino (opcional)</label>
        <input id="trip-photo" name="photoUrl" type="url" placeholder="https://..." value="${escapeHtml(trip.photoUrl ?? "")}" />
      </p>

      <p class="field-error" id="trip-form-error" role="alert" hidden></p>

      <button type="submit">${submitLabel}</button>
    </form>
  `;
}

/**
 * Monta el formulario de viaje en `container` y conecta el submit.
 * @param {{
 *   trip?: { name?, budgetLimit?, startDate?, endDate?, photoUrl? },
 *   submitLabel: string,
 *   onSubmit: (data: { name, budgetLimit, startDate, endDate, photoUrl }) => Promise<void>,
 * }} options
 */
export function mountTripForm(container, { trip = {}, submitLabel, onSubmit }) {
  container.innerHTML = tripFormMarkup({ trip, submitLabel });

  const form = container.querySelector("#trip-form");
  const errorBox = container.querySelector("#trip-form-error");
  const submitButton = form.querySelector("button[type=submit]");
  const budgetInput = form.querySelector("#trip-budget");

  bindAmountInput(budgetInput);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorBox.hidden = true;
    submitButton.disabled = true;

    const formData = new FormData(form);
    try {
      await onSubmit({
        name: formData.get("name"),
        budgetLimit: readAmountInput(budgetInput),
        startDate: formData.get("startDate"),
        endDate: formData.get("endDate"),
        photoUrl: formData.get("photoUrl"),
      });
    } catch (err) {
      errorBox.textContent = err.message;
      errorBox.hidden = false;
      submitButton.disabled = false;
    }
  });
}
