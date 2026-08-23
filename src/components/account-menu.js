// Menú de cuenta (foto/inicial + nombre + email + chevron, con dropdown
// de "Cerrar sesión"), montado en el header de las 4 pantallas
// principales (Inicio, Alertas, Historial, detalle de viaje) — antes
// este bloque vivía fijo al final del sidebar (ver sidebar.js).

import { icon } from "../utils/icons.js";
import { signOutUser } from "../data/auth.js";
import { escapeHtml } from "../utils/dom.js";

function getInitial(name) {
  return (name || "?").trim().charAt(0).toUpperCase() || "?";
}

/**
 * @param {import("firebase/auth").User | null} user
 */
export function accountMenu(user) {
  if (!user) return "";

  const name = user.displayName || user.email?.split("@")[0] || "";
  // Firebase/Google siempre entrega photoURL como https, pero se valida
  // el esquema igual antes de insertarlo en el src, mismo criterio que
  // trip.photoUrl en trip-card.js.
  const safePhotoUrl = /^https:\/\//.test(user.photoURL || "") ? escapeHtml(user.photoURL) : "";

  return `
    <div class="account-menu">
      <button type="button" class="account-menu-trigger" id="account-menu-trigger" aria-haspopup="true" aria-expanded="false">
        ${
          safePhotoUrl
            ? `<img class="account-menu-avatar" src="${safePhotoUrl}" alt="" referrerpolicy="no-referrer" />`
            : `<span class="account-menu-avatar account-menu-avatar-placeholder">${escapeHtml(getInitial(name))}</span>`
        }
        <span class="account-menu-info">
          <span class="account-menu-name">${escapeHtml(name)}</span>
          <span class="account-menu-email">${escapeHtml(user.email ?? "")}</span>
        </span>
        ${icon("chevron-down", "account-menu-chevron")}
      </button>
      <ul class="account-menu-dropdown" id="account-menu-dropdown" hidden>
        <li>
          <button type="button" class="account-menu-item" id="account-menu-signout">
            ${icon("log-out")}<span>Cerrar sesión</span>
          </button>
        </li>
      </ul>
    </div>
  `;
}

/** @param {HTMLElement} container */
export function bindAccountMenu(container) {
  const root = container.querySelector(".account-menu");
  const trigger = container.querySelector("#account-menu-trigger");
  const dropdown = container.querySelector("#account-menu-dropdown");
  if (!root || !trigger || !dropdown) return;

  function close() {
    dropdown.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    document.removeEventListener("click", onDocumentClick);
    document.removeEventListener("keydown", onKeydown);
  }

  function open() {
    dropdown.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    document.addEventListener("click", onDocumentClick);
    document.addEventListener("keydown", onKeydown);
  }

  function onDocumentClick(event) {
    if (!root.contains(event.target)) close();
  }

  function onKeydown(event) {
    if (event.key === "Escape") close();
  }

  trigger.addEventListener("click", (event) => {
    event.stopPropagation();
    if (dropdown.hidden) open();
    else close();
  });

  container.querySelector("#account-menu-signout").addEventListener("click", () => {
    close();
    signOutUser();
  });
}
