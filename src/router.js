// Router minimalista basado en hash, sin dependencias externas.
// Cada página exporta una función render(container) que dibuja su vista.
//
// Gate de autenticación: mientras no hay sesión, se fuerza la página
// de login sin importar qué ruta pidió el usuario. Una vez autenticado,
// las rutas protegidas se renderizan dentro del app-shell (sidebar +
// contenido).

import { onAuthChange, getGoogleRedirectResult } from "./data/auth.js";
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

export async function initRouter(container) {
  let currentUser = null;
  let redirectError = null;

  // Captura el resultado de signInWithRedirect al volver de Google, antes
  // de que se muestre el login. Necesario porque signInWithPopup falla en
  // Vercel (auth/popup-blocked) por la política Cross-Origin-Opener-Policy
  // que aplica por defecto.
  try {
    await getGoogleRedirectResult();
  } catch (err) {
    console.error("[auth] getGoogleRedirectResult falló:", err);
    redirectError = "No se pudo iniciar sesión. Intenta de nuevo.";
  }

  async function render() {
    if (!currentUser) {
      const login = await import("./pages/login.js");
      login.render(container, { error: redirectError });
      redirectError = null;
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
