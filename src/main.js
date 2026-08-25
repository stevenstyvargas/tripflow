import { initRouter } from "./router.js";
import { firebaseConfigError } from "./data/firebase.js";
import { renderFirebaseConfigError } from "./components/firebase-error.js";
import "./styles/tokens.css";
import "./styles/base.css";

const app = document.getElementById("app");

// Sin variables VITE_FIREBASE_* (detectado en data/firebase.js, antes
// de tocar el SDK), ni el router ni ninguna página llegan a montarse —
// antes esto era una pantalla en blanco (hallazgo de la auditoría
// integral pre-entrega, ver docs/ai-process.md). El caso de variables
// presentes pero inválidas se maneja aparte, en router.js (Firebase
// recién lo reporta en la primera llamada real de auth).
if (firebaseConfigError) {
  renderFirebaseConfigError(app);
} else {
  // Punto de entrada normal. El router decide qué página montar en
  // #app según la ruta (dashboard, nuevo viaje, registrar gasto, etc.)
  initRouter(app);
}
