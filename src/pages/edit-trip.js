// Página: editar un viaje existente. Reutiliza el mismo formulario de
// "Nuevo viaje" (components/trip-form.js), precargado con los datos
// actuales del viaje.

import { getTrip, updateTrip } from "../data/store.js";
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

  container.innerHTML = `
    <main class="page page-new-trip">
      <h1>Editar viaje</h1>
      <div id="trip-form-slot"></div>
    </main>
  `;

  mountTripForm(container.querySelector("#trip-form-slot"), {
    trip,
    submitLabel: "Guardar cambios",
    onSubmit: async (data) => {
      await updateTrip(trip.id, data);
      location.hash = `#/viaje/${trip.id}`;
    },
  });
}
