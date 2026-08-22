// Página: login. Se muestra cuando no hay sesión activa;
// el router la fuerza sin importar qué ruta pidió el usuario.

import { signInWithGoogle } from "../data/auth.js";

export function render(container) {
  container.innerHTML = `
    <main class="page page-login">
      <h1>Tripflow</h1>
      <p>Controla el presupuesto de tus viajes.</p>
      <button id="google-signin" type="button">Continuar con Google</button>
      <p class="field-error" id="login-error" role="alert" hidden></p>
    </main>
  `;

  const button = container.querySelector("#google-signin");
  const errorBox = container.querySelector("#login-error");

  button.addEventListener("click", async () => {
    button.disabled = true;
    errorBox.hidden = true;
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error("[auth] signInWithGoogle falló:", err);
      errorBox.textContent = "No se pudo iniciar sesión. Intenta de nuevo.";
      errorBox.hidden = false;
    } finally {
      button.disabled = false;
    }
  });
}
