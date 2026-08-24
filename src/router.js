// Router minimalista basado en hash, sin dependencias externas.
// Cada página exporta una función render(container) que dibuja su vista.
//
// Gate de autenticación: mientras no hay sesión, solo 2 rutas existen —
// "/login" (pantalla de Google, sin cambios) y cualquier otra cosa cae
// en "/" (landing pública). Con sesión activa, "/" y "/login" pasan a
// significar Inicio (landing/login ya no aplican) y el resto de rutas
// protegidas se renderiza dentro del app-shell (sidebar + contenido)
// como antes.

import { onAuthChange, getGoogleRedirectResult } from "./data/auth.js";
import { initStore, clearStore } from "./data/store.js";
import { renderShell } from "./components/app-shell.js";

const routes = {
  "/": () => import("./pages/dashboard.js"),
  "/nuevo-viaje": () => import("./pages/new-trip.js"),
  "/viajes": () => import("./pages/my-trips.js"),
  "/alertas": () => import("./pages/alerts.js"),
};

// Historial se fusionó con Mis viajes (ver docs/product-decisions.md):
// mostraban lo mismo, viajes cerrados, en 2 lugares distintos. Un link
// o bookmark viejo a /historial cae acá en vez de a una página en
// blanco, y se redirige a la pestaña "Cerrados" de /viajes.
const REDIRECTS = {
  "/historial": "/viajes?tab=closed",
};

// "/viaje/{tripId}" y "/viaje/{tripId}/editar" no son rutas fijas: se
// resuelven aparte para extraer el id del viaje como parámetro en vez
// de listarlas una por una en routes.
function matchRoute(path) {
  if (path.startsWith("/viaje/")) {
    const [rawId, sub] = path.slice("/viaje/".length).split("/");
    const tripId = decodeURIComponent(rawId);

    if (sub === "editar") {
      return { loadPage: () => import("./pages/edit-trip.js"), params: { tripId } };
    }
    return { loadPage: () => import("./pages/trip-detail.js"), params: { tripId } };
  }

  const loadPage = routes[path];
  return loadPage ? { loadPage, params: {} } : null;
}

export async function initRouter(container) {
  let currentUser = null;
  let redirectError = null;

  // Captura el resultado de signInWithRedirect al volver de Google, antes
  // de que se muestre el login. Solo aplica cuando signInWithGoogle() cayó
  // a redirect por un popup bloqueado (ver auth.js); si ese redirect falla
  // por otra razón (red, cuenta inválida), sí se muestra el error normal.
  try {
    await getGoogleRedirectResult();
  } catch (err) {
    console.error("[auth] getGoogleRedirectResult falló:", err);
    redirectError = "No se pudo iniciar sesión. Intenta de nuevo.";
  }

  async function render() {
    const rawPath = location.hash.replace("#", "") || "/";
    const [path, queryString] = rawPath.split("?");

    if (!currentUser) {
      // redirectError fuerza el login aunque el hash no sea "/login": es
      // el resultado de un signInWithRedirect que acaba de fallar al
      // volver de Google (ver getGoogleRedirectResult() abajo) — con la
      // landing como default, ese error no debe perderse silenciosamente
      // solo porque el hash con el que Google redirige de vuelta no es
      // necesariamente "/login".
      if (path === "/login" || redirectError) {
        const login = await import("./pages/login.js");
        login.render(container, { error: redirectError });
        redirectError = null;
        return;
      }
      const landing = await import("./pages/landing.js");
      landing.render(container);
      return;
    }

    // Sesión activa: "/login" (y la propia landing, que solo vive en
    // "/" sin sesión) ya no tienen sentido — de vuelta a Inicio.
    if (path === "/login") {
      location.hash = "#/";
      return;
    }

    if (REDIRECTS[path]) {
      location.hash = `#${REDIRECTS[path]}`;
      return;
    }

    const match = matchRoute(path);
    const content = renderShell(container, path);

    if (!match) {
      content.innerHTML = `<p>Página no encontrada.</p>`;
      return;
    }

    const queryParams = Object.fromEntries(new URLSearchParams(queryString ?? ""));
    const page = await match.loadPage();
    page.render(content, { ...match.params, ...queryParams });
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
