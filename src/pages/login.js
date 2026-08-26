// Página: login. Se muestra cuando no hay sesión activa;
// el router la fuerza sin importar qué ruta pidió el usuario.
//
// Tarjeta flotante de 2 paneles (formulario + atmósfera de marca)
// sobre fondo navy — ver styles/login.css. Puramente visual/
// estructural: signInWithGoogle() y su manejo de error/disabled no
// cambiaron respecto a la versión anterior de esta página.

import "../styles/login.css";
import { signInWithGoogle } from "../data/auth.js";
import { icon } from "../utils/icons.js";

export function render(container, { error } = {}) {
  container.innerHTML = `
    <main class="page-login">
      <div class="login-card">
        <div class="login-form-panel">
          <img src="/img/Logotipo-fondo-claro.svg" alt="Tripflow" class="login-logo" />
          <p class="login-tagline">Controla el presupuesto de tus viajes.</p>
          <button id="google-signin" type="button" class="login-button">
            <span class="login-button-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
              </svg>
            </span>
            Continuar con Google
          </button>
          <div class="login-hint">
            <span class="login-hint-icon" aria-hidden="true">${icon("monitor-smartphone")}</span>
            <p>Sincroniza tu planeación entre todos tus dispositivos con una sola cuenta de Google.</p>
          </div>
          <p class="field-error" id="login-error" role="alert" hidden></p>
        </div>
        <div class="login-art-panel" aria-hidden="true"></div>
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
