// Navegación lateral fija: Inicio, Mis viajes, Alertas. En desktop es
// la barra vertical de siempre (logo + nav). En mobile (≤45rem) esa
// misma barra colapsa a solo hamburguesa + isotipo — la navegación y
// la sesión (antes expuestas sueltas: nav en fila de íconos, cuenta
// como chip aparte en cada página) se mueven a un drawer deslizante
// desde la izquierda, con el mismo fondo navy y el mismo estilo de
// item (franja verde en el activo) que el sidebar de desktop — los
// items de nav se generan una sola vez (renderNavItems) y se reusan
// en los dos lugares para no duplicar el markup ni arriesgar que se
// desincronicen. El bloque de sesión del drawer (foto/nombre/email +
// cerrar sesión) es la versión mobile de components/account-menu.js
// (que sigue siendo el dropdown de desktop, sin cambios) — ninguno de
// los dos reemplaza al otro, cada uno vive solo en su breakpoint (ver
// base.css). Historial se fusionó con Mis viajes (ver
// docs/product-decisions.md) — los viajes cerrados viven en su
// pestaña "Cerrados".

import { icon } from "../utils/icons.js";
import { getCurrentUser, signOutUser } from "../data/auth.js";
import { escapeHtml } from "../utils/dom.js";

const NAV_ITEMS = [
  { path: "/", label: "Inicio", icon: "home" },
  { path: "/viajes", label: "Mis viajes", icon: "map" },
  { path: "/alertas", label: "Alertas", icon: "bell" },
];

function renderNavItems(currentPath) {
  return NAV_ITEMS.map(
    (item) => `
    <a href="#${item.path}" class="sidebar-nav-item${item.path === currentPath ? " is-active" : ""}">
      ${icon(item.icon)}
      <span>${item.label}</span>
    </a>
  `
  ).join("");
}

function getInitial(name) {
  return (name || "?").trim().charAt(0).toUpperCase() || "?";
}

// Versión mobile (drawer) del bloque de cuenta: a diferencia de
// components/account-menu.js (dropdown de desktop), acá todo va
// siempre visible — foto/nombre/email + botón de cerrar sesión, sin
// desplegable — porque el drawer entero ya es la superficie que hay
// que abrir a propósito, no hace falta un segundo nivel de colapso.
function renderDrawerSession(user) {
  if (!user) return "";

  const name = user.displayName || user.email?.split("@")[0] || "";
  const safePhotoUrl = /^https:\/\//.test(user.photoURL || "") ? escapeHtml(user.photoURL) : "";

  return `
    <div class="drawer-session">
      ${
        safePhotoUrl
          ? `<img class="drawer-session-avatar" src="${safePhotoUrl}" alt="" referrerpolicy="no-referrer" />`
          : `<span class="drawer-session-avatar drawer-session-avatar-placeholder">${escapeHtml(getInitial(name))}</span>`
      }
      <div class="drawer-session-info">
        <p class="drawer-session-name">${escapeHtml(name)}</p>
        <p class="drawer-session-email">${escapeHtml(user.email ?? "")}</p>
      </div>
      <button type="button" class="icon-button drawer-session-signout" id="drawer-signout" aria-label="Cerrar sesión">
        ${icon("log-out")}
      </button>
    </div>
  `;
}

export function renderSidebar(currentPath) {
  return `
    <aside class="sidebar">
      <button type="button" class="hamburger-button" id="drawer-open" aria-label="Abrir menú" aria-haspopup="true" aria-expanded="false">
        ${icon("menu")}
      </button>
      <div class="sidebar-logo">
        <img src="/img/Logotipo-fondo-oscuro.svg" alt="Tripflow" class="sidebar-logo-full" />
        <img src="/img/Isotipo-fondo-oscuro.svg" alt="Tripflow" class="sidebar-logo-compact" />
      </div>

      <nav class="sidebar-nav">
        ${renderNavItems(currentPath)}
      </nav>
    </aside>

    <div class="drawer-overlay" id="drawer-overlay" hidden>
      <nav class="drawer-panel" role="dialog" aria-modal="true" aria-label="Menú de navegación">
        <button type="button" class="icon-button drawer-close" id="drawer-close" aria-label="Cerrar menú">
          ${icon("x")}
        </button>
        <div class="sidebar-nav drawer-nav">
          ${renderNavItems(currentPath)}
        </div>
        ${renderDrawerSession(getCurrentUser())}
      </nav>
    </div>
  `;
}

/** @param {HTMLElement} container */
export function bindSidebar(container) {
  const openButton = container.querySelector("#drawer-open");
  const closeButton = container.querySelector("#drawer-close");
  const overlay = container.querySelector("#drawer-overlay");
  if (!openButton || !overlay) return;

  function openDrawer() {
    overlay.hidden = false;
    // Un frame después de quitar `hidden`, para que el navegador ya
    // haya pintado el estado cerrado (opacidad 0, panel corrido a la
    // izquierda) antes de animar a abierto — si se agrega la clase en
    // el mismo tick, no hay transición, salta directo al estado final.
    requestAnimationFrame(() => overlay.classList.add("is-open"));
    openButton.setAttribute("aria-expanded", "true");
  }

  function closeDrawer() {
    overlay.classList.remove("is-open");
    openButton.setAttribute("aria-expanded", "false");
  }

  // El overlay se saca del DOM (`hidden`) recién cuando termina la
  // transición de cierre, para no dejarlo capturando clics mientras
  // todavía se ve deslizarse hacia afuera.
  overlay.addEventListener("transitionend", (event) => {
    if (event.target === overlay && !overlay.classList.contains("is-open")) {
      overlay.hidden = true;
    }
  });

  openButton.addEventListener("click", openDrawer);
  closeButton.addEventListener("click", closeDrawer);

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closeDrawer();
  });

  container.querySelectorAll(".drawer-nav .sidebar-nav-item").forEach((link) => {
    link.addEventListener("click", closeDrawer);
  });

  const signoutButton = container.querySelector("#drawer-signout");
  if (signoutButton) {
    signoutButton.addEventListener("click", () => {
      closeDrawer();
      signOutUser();
    });
  }
}
