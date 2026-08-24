// Navegación lateral fija: Inicio, Mis viajes, Alertas. En desktop es
// la barra vertical de siempre (logo + nav). En mobile (≤45rem) esa
// misma barra colapsa a: logotipo completo a la izquierda (mismo
// asset que desktop, sin recorte ni swap a isotipo) y, a la derecha,
// lupa (solo en Inicio/Mis viajes, únicas pantallas con algo que
// buscar) + hamburguesa, siempre la última — la navegación y la
// sesión (antes expuestas sueltas: nav en fila de íconos, cuenta como
// chip aparte en cada página) se mueven a un drawer deslizante desde
// la izquierda, con el mismo fondo navy y el mismo estilo de item
// (franja verde en el activo) que el sidebar de desktop — los items
// de nav se generan una sola vez (renderNavItems) y se reusan en los
// dos lugares para no duplicar el markup ni arriesgar que se
// desincronicen. El bloque de sesión del drawer (foto/nombre/email +
// cerrar sesión) es la versión mobile de components/account-menu.js
// (que sigue siendo el dropdown de desktop, sin cambios) — ninguno de
// los dos reemplaza al otro, cada uno vive solo en su breakpoint. La
// fila de búsqueda mobile (lupa → input a ancho completo debajo del
// header) vive acá, no en dashboard.js/my-trips.js, porque el ícono
// que la abre está en esta barra compartida — cada página solo bindea
// su propio filtro sobre el <input> que esta fila ya renderiza (ver
// dashboard.js/my-trips.js), reusando el input desktop (inline, sin
// tocar) más este nuevo #trip-search-mobile. El logo (`.sidebar-logo`)
// es un link a "/" en desktop y mobile por igual — mismo elemento,
// ningún CSS de breakpoint de por medio. El ícono de "Alertas" lleva
// un badge con el número de viajes activos en alerta (getTripAlerts()
// de data/store.js — misma lista/cálculo que usa la propia pantalla de
// Alertas, no una copia), oculto si el conteo es 0. Historial se
// fusionó con Mis viajes (ver docs/product-decisions.md) — los viajes
// cerrados viven en su pestaña "Cerrados".

import { icon } from "../utils/icons.js";
import { getCurrentUser, signOutUser } from "../data/auth.js";
import { getTripAlerts } from "../data/store.js";
import { escapeHtml } from "../utils/dom.js";
import { searchField } from "./search-field.js";

const NAV_ITEMS = [
  { path: "/", label: "Inicio", icon: "home" },
  { path: "/viajes", label: "Mis viajes", icon: "map" },
  { path: "/alertas", label: "Alertas", icon: "bell" },
];

// Únicas 2 pantallas con una lista de viajes que buscar por
// destino/país (igual que en desktop) — el resto (Alertas, detalle de
// viaje) no muestra la lupa en el header mobile.
const SEARCHABLE_PATHS = new Set(["/", "/viajes"]);

// "9+" en vez de desbordar el círculo con 2+ dígitos.
function renderNavBadge(count) {
  if (count <= 0) return "";
  return `<span class="nav-badge">${count > 9 ? "9+" : count}</span>`;
}

// El badge solo aplica al ícono de "Alertas" — los otros 2 items
// quedan con el mismo markup de siempre (ícono suelto, sin wrapper),
// para no arriesgar su estilo actual por un cambio que no les aplica.
function renderNavItems(currentPath) {
  const alertsCount = getTripAlerts().length;

  return NAV_ITEMS.map((item) => {
    const isAlerts = item.path === "/alertas";
    const iconMarkup = isAlerts
      ? `<span class="sidebar-nav-icon">${icon(item.icon)}${renderNavBadge(alertsCount)}</span>`
      : icon(item.icon);

    return `
      <a href="#${item.path}" class="sidebar-nav-item${item.path === currentPath ? " is-active" : ""}">
        ${iconMarkup}
        <span>${item.label}</span>
      </a>
    `;
  }).join("");
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
  const hasSearch = SEARCHABLE_PATHS.has(currentPath);

  return `
    <aside class="sidebar">
      <a href="#/" class="sidebar-logo" aria-label="Ir a Inicio">
        <img src="/img/Logotipo-fondo-oscuro.svg" alt="Tripflow" class="sidebar-logo-full" />
      </a>

      <nav class="sidebar-nav">
        ${renderNavItems(currentPath)}
      </nav>

      <div class="sidebar-mobile-actions">
        ${
          hasSearch
            ? `
          <button type="button" class="icon-button sidebar-icon-button" id="mobile-search-toggle" aria-label="Buscar" aria-expanded="false">
            ${icon("search")}
          </button>
        `
            : ""
        }
        <button type="button" class="icon-button sidebar-icon-button" id="drawer-open" aria-label="Abrir menú" aria-haspopup="true" aria-expanded="false">
          ${icon("menu")}
        </button>
      </div>
    </aside>

    ${
      hasSearch
        ? `
      <div class="mobile-search-row" id="mobile-search-row" hidden>
        ${searchField({ id: "trip-search-mobile" })}
        <button type="button" class="icon-button mobile-search-close" id="mobile-search-close" aria-label="Cerrar búsqueda">
          ${icon("x")}
        </button>
      </div>
    `
        : ""
    }

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

  // Lupa del header mobile (solo Inicio/Mis viajes, ver SEARCHABLE_PATHS):
  // expande/colapsa la misma fila con #trip-search-mobile, que cada
  // página bindea aparte a su propio filtro (esto solo abre/cierra y
  // limpia, no filtra nada — ver dashboard.js/my-trips.js).
  const searchToggle = container.querySelector("#mobile-search-toggle");
  const searchRow = container.querySelector("#mobile-search-row");
  const searchClose = container.querySelector("#mobile-search-close");
  const searchInput = container.querySelector("#trip-search-mobile");

  if (searchToggle && searchRow) {
    function openMobileSearch() {
      searchRow.hidden = false;
      searchToggle.setAttribute("aria-expanded", "true");
      searchInput.focus();
    }

    // Vuelve al estado original: colapsa Y limpia el término buscado,
    // disparando un "input" sintético para que el filtro de la página
    // (bindeado aparte) recalcule la lista sin filtro — mismo efecto
    // que si el usuario hubiera borrado el texto a mano.
    function closeMobileSearch() {
      searchRow.hidden = true;
      searchToggle.setAttribute("aria-expanded", "false");
      searchInput.value = "";
      searchInput.dispatchEvent(new Event("input", { bubbles: true }));
    }

    searchToggle.addEventListener("click", () => {
      if (searchRow.hidden) openMobileSearch();
      else closeMobileSearch();
    });

    searchClose.addEventListener("click", closeMobileSearch);
  }
}
