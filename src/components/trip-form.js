// Formulario de viaje (nombre, presupuesto, fechas, foto), compartido
// entre "Nuevo viaje" y "Editar viaje" — mismos campos, misma
// validación (delegada al store), solo cambian los valores iniciales,
// el texto del botón y qué hace onSubmit con los datos. v1 es de una
// sola divisa (COP), así que no hay campo de divisa que elegir — ver
// docs/product-decisions.md.

import { formatStoredAmount } from "../utils/currency.js";
import { bindAmountInput, readAmountInput } from "../utils/amount-input.js";
import { escapeHtml } from "../utils/dom.js";
import { searchDestinationPhotos } from "../data/pexels.js";

const PHOTO_SEARCH_DEBOUNCE_MS = 600;
const MANUAL_URL_HINT = "También podés buscar la foto en Unsplash y pegar acá el link de la imagen.";

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
        <label for="trip-photo">Foto del destino (opcional)</label>
        <input id="trip-photo" name="photoUrl" type="url" placeholder="https://..." value="${escapeHtml(trip.photoUrl ?? "")}" />
        <div class="photo-helper" id="photo-helper">
          <span class="field-hint">${MANUAL_URL_HINT}</span>
        </div>
      </p>

      <p class="field-error" id="trip-form-error" role="alert" hidden></p>

      <button type="submit">${submitLabel}</button>
    </form>
  `;
}

function renderPhotoHint(photoHelper) {
  photoHelper.innerHTML = `<span class="field-hint">${MANUAL_URL_HINT}</span>`;
}

function renderPhotoLoading(photoHelper) {
  photoHelper.innerHTML = `<span class="field-hint photo-suggestions-loading">Buscando fotos sugeridas…</span>`;
}

function renderPhotoSuggestions(photoHelper, photos) {
  photoHelper.innerHTML = `
    <div class="photo-suggestions">
      ${photos
        .map(
          (photo) => `
        <button type="button" class="photo-suggestion" data-url="${escapeHtml(photo.url)}" aria-label="Usar esta foto como portada del viaje">
          <img src="${escapeHtml(photo.thumbnailUrl)}" alt="" loading="lazy" />
        </button>
      `
        )
        .join("")}
    </div>
  `;
}

/**
 * Fotos sugeridas del destino (Pexels, ver data/pexels.js), debajo del
 * input de URL manual — nunca lo reemplaza, ambos caminos guardan lo
 * mismo (`photoInput.value`). Si no hay key configurada, la búsqueda
 * falla o no hay resultados, `searchDestinationPhotos` devuelve `null`
 * y acá se degrada solo al texto de ayuda de siempre, sin bloquear el
 * formulario.
 * @param {{ nameInput: HTMLInputElement, photoInput: HTMLInputElement, photoHelper: HTMLElement }} refs
 */
function bindPhotoSuggestions({ nameInput, photoInput, photoHelper }) {
  let debounceTimer = null;
  // Se incrementa en cada búsqueda nueva — si el usuario sigue
  // escribiendo, una respuesta vieja que llega tarde ya no coincide
  // con el token actual y se descarta en vez de pisar el resultado
  // más reciente (o el estado de "escribiendo" que vino después).
  let requestToken = 0;

  function updateSelectionHighlight() {
    photoHelper.querySelectorAll(".photo-suggestion").forEach((button) => {
      button.classList.toggle("is-selected", button.dataset.url === photoInput.value);
    });
  }

  nameInput.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    const query = nameInput.value.trim();

    if (!query) {
      requestToken += 1;
      renderPhotoHint(photoHelper);
      return;
    }

    debounceTimer = setTimeout(async () => {
      renderPhotoLoading(photoHelper);
      const token = ++requestToken;
      const photos = await searchDestinationPhotos(query);
      if (token !== requestToken) return;

      if (photos) {
        renderPhotoSuggestions(photoHelper, photos);
        updateSelectionHighlight();
      } else {
        renderPhotoHint(photoHelper);
      }
    }, PHOTO_SEARCH_DEBOUNCE_MS);
  });

  photoHelper.addEventListener("click", (event) => {
    const button = event.target.closest(".photo-suggestion");
    if (!button) return;
    photoInput.value = button.dataset.url;
    updateSelectionHighlight();
  });

  // Si el usuario pega/edita la URL a mano después de elegir una
  // sugerencia (o al revés), la selección visual se recalcula sola en
  // vez de quedar desincronizada del valor real que se va a guardar.
  photoInput.addEventListener("input", updateSelectionHighlight);
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
  const nameInput = form.querySelector("#trip-name");
  const photoInput = form.querySelector("#trip-photo");
  const photoHelper = form.querySelector("#photo-helper");

  bindAmountInput(budgetInput);
  bindPhotoSuggestions({ nameInput, photoInput, photoHelper });

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
