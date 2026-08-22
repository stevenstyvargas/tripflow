// Página: creación de un viaje nuevo.
// Pide nombre, presupuesto límite y divisa; delega la validación real
// al store (createTrip) y solo se encarga de mostrar el error si falla.

import { createTrip } from "../data/store.js";
import { SUPPORTED_CURRENCIES } from "../utils/currency.js";

export function render(container) {
  container.innerHTML = `
    <main class="page page-new-trip">
      <h1>Nuevo viaje</h1>
      <form id="new-trip-form" novalidate>
        <p class="field">
          <label for="trip-name">Nombre del viaje</label>
          <input id="trip-name" name="name" type="text" placeholder="Ej. Vacaciones en Cartagena" required />
        </p>

        <p class="field">
          <label for="trip-budget">Presupuesto límite</label>
          <input id="trip-budget" name="budgetLimit" type="number" inputmode="decimal" min="1" step="any" placeholder="0" required />
        </p>

        <p class="field">
          <label for="trip-currency">Divisa</label>
          <select id="trip-currency" name="currency" required>
            ${SUPPORTED_CURRENCIES.map((c) => `<option value="${c}">${c}</option>`).join("")}
          </select>
        </p>

        <p class="field-error" id="new-trip-error" role="alert" hidden></p>

        <button type="submit">Crear viaje</button>
      </form>
    </main>
  `;

  const form = container.querySelector("#new-trip-form");
  const errorBox = container.querySelector("#new-trip-error");
  const submitButton = form.querySelector("button[type=submit]");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorBox.hidden = true;
    submitButton.disabled = true;

    const formData = new FormData(form);
    try {
      await createTrip({
        name: formData.get("name"),
        budgetLimit: Number(formData.get("budgetLimit")),
        currency: formData.get("currency"),
      });
      location.hash = "#/";
    } catch (err) {
      errorBox.textContent = err.message;
      errorBox.hidden = false;
    } finally {
      submitButton.disabled = false;
    }
  });
}
