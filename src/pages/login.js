// Página: login. Se muestra cuando no hay sesión activa;
// el router la fuerza sin importar qué ruta pidió el usuario.
//
// Tarjeta flotante de 2 paneles (formulario + atmósfera de marca)
// sobre fondo navy — ver styles/login.css. Puramente visual/
// estructural: signInWithGoogle() y su manejo de error/disabled no
// cambiaron respecto a la versión anterior de esta página.

import "../styles/login.css";
import { signInWithGoogle } from "../data/auth.js";

export function render(container, { error } = {}) {
  container.innerHTML = `
    <main class="page-login">
      <div class="login-card">
        <div class="login-form-panel">
          <img src="/img/Logotipo-fondo-claro.svg" alt="Tripflow" class="login-logo" />
          <p class="login-tagline">Controla el presupuesto de tus viajes.</p>
          <button id="google-signin" type="button" class="login-button">Continuar con Google</button>
          <p class="field-error" id="login-error" role="alert" hidden></p>
        </div>
        <div class="login-art-panel" aria-hidden="true">
          <span class="login-art-orb login-art-orb-ok"></span>
          <span class="login-art-orb login-art-orb-warning"></span>
          <span class="login-art-orb login-art-orb-danger"></span>
        </div>
      </div>
    </main>
  `;

  const button = container.querySelector("#google-signin");
  const errorBox = container.querySelector("#login-error");

  if (error) {
    errorBox.textContent = error;
    errorBox.hidden = false;
  }

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
