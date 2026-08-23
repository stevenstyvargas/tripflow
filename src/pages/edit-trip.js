// Página: editar un viaje existente. Reutiliza el mismo formulario de
// "Nuevo viaje" (components/trip-form.js), precargado con los datos
// actuales del viaje.

import { getTrip, getExpensesByTrip, updateTrip } from "../data/store.js";
import { mountTripForm } from "../components/trip-form.js";
import { icon } from "../utils/icons.js";

export function render(container, { tripId } = {}) {
  const trip = getTrip(tripId);

  if (!trip) {
    container.innerHTML = `
      <main class="page page-new-trip">
        <p class="empty-state">Este viaje no existe o fue cerrado.</p>
        <a href="#/" class="button-primary">${icon("home")}<span>Volver a Inicio</span></a>
      </main>
    `;
    return;
  }

  // Si el viaje ya tiene gastos, no se permite cambiar de divisa: todos
  // los gastos heredan la divisa del viaje al crearse, y getTripTotal()
  // suma montos sin convertir — cambiarla después dejaría gastos viejos
  // y nuevos en divisas distintas sumándose como si fueran la misma.
  const lockCurrency = getExpensesByTrip(trip.id).length > 0;

  container.innerHTML = `
    <main class="page page-new-trip">
      <h1>Editar viaje</h1>
      <div id="trip-form-slot"></div>
    </main>
  `;

  mountTripForm(container.querySelector("#trip-form-slot"), {
    trip,
    submitLabel: "Guardar cambios",
    lockCurrency,
    onSubmit: async (data) => {
      await updateTrip(trip.id, data);
      location.hash = `#/viaje/${trip.id}`;
    },
  });
}
