// Router minimalista basado en hash, sin dependencias externas.
// Cada página exporta una función render(container) que dibuja su vista.
//
// Gate de autenticación: mientras no hay sesión, se fuerza la página
// de login sin importar qué ruta pidió el usuario. Una vez autenticado,
// las rutas protegidas se renderizan dentro del app-shell (sidebar +
// contenido).

import { onAuthChange } from "./data/auth.js";
import { initStore, clearStore } from "./data/store.js";
import { renderShell } from "./components/app-shell.js";

const routes = {
  "/": () => import("./pages/dashboard.js"),
  "/nuevo-viaje": () => import("./pages/new-trip.js"),
  "/alertas": () => import("./pages/alerts.js"),
  "/historial": () => import("./pages/history.js"),
};

// "/viaje/{tripId}" no es una ruta fija: se resuelve aparte para extraer
// el id del viaje como parámetro en vez de listarla una por una en routes.
function matchRoute(path) {
  if (path.startsWith("/viaje/")) {
    return {
      loadPage: () => import("./pages/trip-detail.js"),
      params: { tripId: decodeURIComponent(path.slice("/viaje/".length)) },
    };
  }

  const loadPage = routes[path];
  return loadPage ? { loadPage, params: {} } : null;
}

export function initRouter(container) {
  let currentUser = null;

  async function render() {
    if (!currentUser) {
      const login = await import("./pages/login.js");
      login.render(container);
      return;
    }

    const path = location.hash.replace("#", "") || "/";
    const match = matchRoute(path);
    const content = renderShell(container, path);

    if (!match) {
      content.innerHTML = `<p>Página no encontrada.</p>`;
      return;
    }

    const page = await match.loadPage();
    page.render(content, match.params);
  }

  window.addEventListener("hashchange", render);

  onAuthChange(async (user) => {
    currentUser = user;
    if (user) {
      await initStore(user.uid);
    } else {
      clearStore();
    }
    render();
  });
}
