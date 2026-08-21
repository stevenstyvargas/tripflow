import { initRouter } from "./router.js";
import "./styles/tokens.css";
import "./styles/base.css";

// Punto de entrada. El router decide qué página montar en #app
// según la ruta (dashboard, nuevo viaje, registrar gasto, etc.)
initRouter(document.getElementById("app"));
