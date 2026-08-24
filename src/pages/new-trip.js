// Página: creación de un viaje nuevo.
// El formulario en sí (campos, validación, submit) vive en
// components/trip-form.js, compartido con la edición de viaje.

import { createTrip } from "../data/store.js";
import { mountTripForm } from "../components/trip-form.js";

export function render(container) {
  container.innerHTML = `
    <main class="page page-new-trip">
      <h1>Nuevo viaje</h1>
      <div id="trip-form-slot"></div>
    </main>
  `;

  mountTripForm(container.querySelector("#trip-form-slot"), {
    submitLabel: "Crear viaje",
    cancelHref: "#/",
    onSubmit: async (data) => {
      await createTrip(data);
      location.hash = "#/";
    },
  });
}
