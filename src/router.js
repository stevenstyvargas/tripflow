// Router minimalista basado en hash, sin dependencias externas.
// Cada página exporta una función render(container) que dibuja su vista.
//
// Gate de autenticación: mientras no haya sesión, se fuerza la página
// de login sin importar qué ruta pidió el usuario (Fase 2 del prompt
// maestro). Al autenticarse, se carga el store desde Firestore antes
// de renderizar cualquier ruta protegida.

import { onAuthChange } from "./data/auth.js";
import { initStore, clearStore } from "./data/store.js";

const routes = {
  "/": () => import("./pages/dashboard.js"),
  "/nuevo-viaje": () => import("./pages/new-trip.js"),
  // "/registrar-gasto": () => import("./pages/add-expense.js"),
};

export function initRouter(container) {
  let currentUser = null;

  async function render() {
    if (!currentUser) {
      const login = await import("./pages/login.js");
      login.render(container);
      return;
    }

    const path = location.hash.replace("#", "") || "/";
    const loadPage = routes[path];

    if (!loadPage) {
      container.innerHTML = `<p>Página no encontrada.</p>`;
      return;
    }

    const page = await loadPage();
    page.render(container);
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
