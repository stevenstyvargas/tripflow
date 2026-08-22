// Modal de confirmación genérico: overlay oscuro + diálogo centrado.
// Se monta directamente en document.body (no en el árbol de la página)
// para no depender del stacking context de la página que lo abre.
// title/body ya deben venir escapados por quien llama si incluyen datos
// del usuario — este componente no vuelve a escaparlos.

import { icon } from "../utils/icons.js";

/**
 * @param {{ title: string, body: string, confirmLabel?: string, cancelLabel?: string, onConfirm: () => void }} options
 */
export function showConfirmModal({ title, body, confirmLabel = "Confirmar", cancelLabel = "Cancelar", onConfirm }) {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal" role="alertdialog" aria-modal="true" aria-labelledby="confirm-modal-title">
      ${icon("alert-octagon", "modal-icon")}
      <h2 id="confirm-modal-title" class="modal-title">${title}</h2>
      <p class="modal-body">${body}</p>
      <div class="modal-actions">
        <button type="button" class="button-outline" data-action="cancel">${cancelLabel}</button>
        <button type="button" class="button-danger" data-action="confirm">${confirmLabel}</button>
      </div>
    </div>
  `;

  function close() {
    overlay.remove();
    document.removeEventListener("keydown", onKeydown);
  }

  function onKeydown(event) {
    if (event.key === "Escape") close();
  }

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) close();
  });

  overlay.querySelector('[data-action="cancel"]').addEventListener("click", close);
  overlay.querySelector('[data-action="confirm"]').addEventListener("click", () => {
    close();
    onConfirm();
  });

  document.addEventListener("keydown", onKeydown);
  document.body.appendChild(overlay);
  overlay.querySelector('[data-action="cancel"]').focus();
}
