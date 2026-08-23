// Formulario de viaje (nombre, presupuesto, divisa, fechas, foto),
// compartido entre "Nuevo viaje" y "Editar viaje" — mismos campos, misma
// validación (delegada al store), solo cambian los valores iniciales,
// el texto del botón y qué hace onSubmit con los datos.

import { SUPPORTED_CURRENCIES } from "../utils/currency.js";
import { escapeHtml } from "../utils/dom.js";

function tripFormMarkup({ trip, submitLabel, lockCurrency }) {
  return `
    <form id="trip-form" novalidate>
      <p class="field">
        <label for="trip-name">Nombre del viaje</label>
        <input id="trip-name" name="name" type="text" placeholder="Ej. Vacaciones en Cartagena" value="${escapeHtml(trip.name ?? "")}" required />
      </p>

      <p class="field">
        <label for="trip-budget">Presupuesto límite</label>
        <input id="trip-budget" name="budgetLimit" type="number" inputmode="decimal" min="1" step="any" placeholder="0" value="${trip.budgetLimit ?? ""}" required />
      </p>

      <p class="field">
        <label for="trip-currency">Divisa</label>
        <select id="trip-currency" name="currency" required>
          ${SUPPORTED_CURRENCIES.map(
            (c) =>
              `<option value="${c}" ${c === trip.currency ? "selected" : ""} ${lockCurrency && c !== trip.currency ? "disabled" : ""}>${c}</option>`
          ).join("")}
        </select>
        ${
          lockCurrency
            ? `<span class="field-hint">Este viaje ya tiene gastos registrados en ${escapeHtml(trip.currency ?? "")}; cambiar la divisa rompería los totales ya calculados.</span>`
            : ""
        }
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
 *   container: HTMLElement,
 *   trip?: { name?, budgetLimit?, currency?, startDate?, endDate?, photoUrl? },
 *   submitLabel: string,
 *   lockCurrency?: boolean,
 *   onSubmit: (data: { name, budgetLimit, currency, startDate, endDate, photoUrl }) => Promise<void>,
 * }} options
 */
export function mountTripForm(container, { trip = {}, submitLabel, lockCurrency = false, onSubmit }) {
  container.innerHTML = tripFormMarkup({ trip, submitLabel, lockCurrency });

  const form = container.querySelector("#trip-form");
  const errorBox = container.querySelector("#trip-form-error");
  const submitButton = form.querySelector("button[type=submit]");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorBox.hidden = true;
    submitButton.disabled = true;

    const formData = new FormData(form);
    try {
      await onSubmit({
        name: formData.get("name"),
        budgetLimit: Number(formData.get("budgetLimit")),
        currency: formData.get("currency"),
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
