// Modal de confirmación genérico (showConfirmModal) y su variante de
// éxito (showSuccessModal, mismo overlay/diálogo, ícono verde y un solo
// botón "Aceptar"): overlay oscuro + diálogo centrado, montado
// directamente en document.body (no en el árbol de la página) para no
// depender del stacking context de la página que lo abre. title/body ya
// deben venir escapados por quien llama si incluyen datos del usuario —
// este componente no vuelve a escaparlos.

import { icon } from "../utils/icons.js";

// Focus trap compartido por los 2 modales de acá: mientras el overlay
// está abierto, Tab/Shift+Tab deben ciclar solo entre los elementos
// focuseables del diálogo, nunca "escaparse" hacia la página de atrás
// (que sigue en el DOM, tapada por el overlay pero técnicamente
// alcanzable con teclado sin esto).
function trapFocus(overlay, onKeydown) {
  function onTab(event) {
    if (event.key !== "Tab") return;
    const focusable = overlay.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
  document.addEventListener("keydown", onTab);
  document.addEventListener("keydown", onKeydown);
  return () => {
    document.removeEventListener("keydown", onTab);
    document.removeEventListener("keydown", onKeydown);
  };
}

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

  function onKeydown(event) {
    if (event.key === "Escape") close();
  }

  const untrap = trapFocus(overlay, onKeydown);

  function close() {
    overlay.remove();
    untrap();
  }

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) close();
  });

  overlay.querySelector('[data-action="cancel"]').addEventListener("click", close);
  overlay.querySelector('[data-action="confirm"]').addEventListener("click", () => {
    close();
    onConfirm();
  });

  document.body.appendChild(overlay);
  overlay.querySelector('[data-action="cancel"]').focus();
}

/**
 * Modal de éxito: misma estructura visual que showConfirmModal() (overlay
 * + diálogo centrado, mismo tamaño/tipografía), pero con ícono de check
 * verde en vez de advertencia roja y un solo botón "Aceptar" que cierra
 * el modal — no hay nada que confirmar/cancelar, así que no hace falta
 * un segundo botón. `title` ya debe venir escapado por quien llama,
 * igual que showConfirmModal().
 * @param {{ title: string, onClose?: () => void }} options
 */
export function showSuccessModal({ title, onClose }) {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal" role="alertdialog" aria-modal="true" aria-labelledby="success-modal-title">
      ${icon("circle-check", "modal-icon modal-icon-success")}
      <h2 id="success-modal-title" class="modal-title modal-title-only">${title}</h2>
      <div class="modal-actions">
        <button type="button" class="button-primary" data-action="close">Aceptar</button>
      </div>
    </div>
  `;

  function onKeydown(event) {
    if (event.key === "Escape") close();
  }

  const untrap = trapFocus(overlay, onKeydown);

  function close() {
    overlay.remove();
    untrap();
    if (onClose) onClose();
  }

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) close();
  });

  overlay.querySelector('[data-action="close"]').addEventListener("click", close);

  document.body.appendChild(overlay);
  overlay.querySelector('[data-action="close"]').focus();
}
