// Router minimalista basado en hash, sin dependencias externas.
// Cada página exporta una función render(container) que dibuja su vista.

const routes = {
  // "/": () => import("./pages/dashboard.js"),
  // "/nuevo-viaje": () => import("./pages/new-trip.js"),
  // "/registrar-gasto": () => import("./pages/add-expense.js"),
};

export function initRouter(container) {
  async function render() {
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
  render();
}
