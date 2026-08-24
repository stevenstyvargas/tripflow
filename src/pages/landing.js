// Página pública: landing de Tripflow, se muestra a usuarios SIN sesión
// en vez de ir directo al login (router.js: solo "/login" muestra el
// login real; cualquier otro hash sin sesión cae acá). El login en sí
// no se toca ni se duplica — el CTA de acá es un <a href="#/login">
// plano, la lógica de signInWithGoogle() sigue viviendo solo en
// pages/login.js. Con sesión activa, el router nunca llega a esta
// página (va directo a Inicio).
//
// Capturas reales (src/assets/landing/*.png): no son la app en vivo
// (requeriría una sesión de Google real, que este entorno no tiene) —
// son las mismas páginas/componentes reales de la app, renderizadas
// con datos de viaje de muestra vía un harness Playwright, con el
// semáforo en naranja/rojo a propósito para que se vea activo. Ver
// docs/ai-process.md para el detalle de cómo se generaron.

import "../styles/landing.css";
import { icon } from "../utils/icons.js";

import inicioImg from "../assets/landing/inicio.png";
import detalleImg from "../assets/landing/detalle-viaje.png";
import alertasImg from "../assets/landing/alertas.png";
import nuevoViajeImg from "../assets/landing/nuevo-viaje.png";
import whatsappImg from "../assets/landing/whatsapp.png";
import calendarImg from "../assets/landing/google-calendar.png";

// Mismo SVG de marca oficial de GitHub, monocromo (currentColor) — no
// hay ícono de marca en Lucide (a propósito, no cubren logos), así que
// va escrito a mano acá en vez de en utils/icons.js, que es solo para
// el set de Lucide.
const GITHUB_MARK = `
  <svg class="icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.5 0-.24-.01-1.04-.01-1.89-2.78.62-3.37-1.21-3.37-1.21-.46-1.19-1.11-1.51-1.11-1.51-.9-.63.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.31.1-2.72 0 0 .84-.28 2.75 1.05a9.3 9.3 0 0 1 2.5-.35c.85 0 1.7.12 2.5.35 1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.46.1 2.72.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.8-4.57 5.06.36.32.68.95.68 1.92 0 1.39-.01 2.5-.01 2.85 0 .28.18.61.69.5A10.26 10.26 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z"/>
  </svg>
`;

function heroRoute() {
  return `
    <div class="hero-route">
      <svg class="hero-route-path" viewBox="0 0 400 400" preserveAspectRatio="none" aria-hidden="true">
        <path d="M 60 40 C 20 140, 90 160, 110 190 S 300 300, 340 360"
              fill="none" stroke="var(--color-primary)" stroke-width="2.5" stroke-dasharray="2 10"
              stroke-linecap="round" opacity="0.35" />
      </svg>
      <div class="hero-stage hero-stage-ok">
        ${icon("circle-check")}
        <span><span class="hero-stage-pct">62%</span><span class="hero-stage-label">En control</span></span>
      </div>
      <div class="hero-stage hero-stage-warning">
        ${icon("alert-triangle")}
        <span><span class="hero-stage-pct">88%</span><span class="hero-stage-label">Al borde del límite</span></span>
      </div>
      <div class="hero-stage hero-stage-danger">
        ${icon("alert-octagon")}
        <span><span class="hero-stage-pct">104%</span><span class="hero-stage-label">Límite superado</span></span>
      </div>
    </div>
  `;
}

const FEATURES = [
  {
    iconName: "layout-dashboard",
    title: "Dashboard de gastos",
    text: "Cuánto llevás gastado, cuántos viajes tenés en riesgo y en qué categorías se te va la plata — todo junto al abrir la app, no repartido en 3 pantallas.",
    image: inicioImg,
    frame: "browser",
  },
  {
    iconName: "plus",
    title: "Creación de viajes con presupuesto límite",
    text: "Definí un límite en pesos colombianos por viaje, con fechas opcionales. Con fotos sugeridas del destino (Pexels) en vez de tener que salir a buscar una URL a mano.",
    image: nuevoViajeImg,
    frame: "browser",
  },
  {
    iconName: "wallet",
    title: "Registro de gastos",
    text: "Cargá cada gasto por categoría — transporte, comida, hotel y más — en segundos, y mirá cómo se actualiza tu presupuesto en tiempo real.",
    image: detalleImg,
    frame: "browser",
  },
  {
    iconName: "target",
    title: "Sistema de semáforo",
    text: "Verde mientras vas bien, naranja al 80% del límite, rojo al superarlo — el mismo criterio en Inicio, Alertas y cada viaje, siempre con ícono y texto, nunca solo color.",
    image: alertasImg,
    frame: "browser",
  },
  {
    iconName: "message-circle",
    title: "Compartir por WhatsApp",
    text: "Mandá un resumen del estado de tu viaje — gastado, restante, semáforo — directo por WhatsApp, sin exportar nada.",
    image: whatsappImg,
    frame: "snippet",
  },
  {
    iconName: "calendar",
    title: "Integración con Google Calendar",
    text: "Si tu viaje tiene fechas, agregalo a tu calendario con un click — un link directo, sin pedirte permisos de tu cuenta.",
    image: calendarImg,
    frame: "snippet",
  },
];

function featureCard({ iconName, title, text, image, frame }) {
  const media =
    frame === "browser"
      ? `
        <div class="browser-frame">
          <div class="browser-frame-bar"><span></span><span></span><span></span></div>
          <img src="${image}" alt="Captura real de la pantalla &quot;${title}&quot; en Tripflow" loading="lazy" />
        </div>
      `
      : `
        <div class="feature-snippet">
          <img src="${image}" alt="Captura real del control &quot;${title}&quot; en Tripflow" loading="lazy" />
        </div>
      `;

  return `
    <li class="feature-card">
      ${media}
      <div class="feature-card-icon">${icon(iconName)}</div>
      <h3>${title}</h3>
      <p>${text}</p>
    </li>
  `;
}

// Texto exacto del roadmap de README.md (## Roadmap (próximas
// actualizaciones)) — no se redacta contenido nuevo acá, ver el pedido
// original de esta tarea. Solo se reusan los 5 ítems que ya nombra
// (se deja afuera "eliminar viaje de forma permanente": es una
// decisión de alcance interna, no una feature que alguien vendría a
// buscar en una landing).
const ROADMAP = [
  "Viaje compartido: viaje en pareja con reparto de gastos",
  "Reintroducir soporte multi-divisa (COP, USD, EUR y más) con una UX más simple y clara",
  "Escaneo de recibos con IA en el flujo de registro de gastos — los recibos escaneados vivirán en una nueva sección “Mis facturas”",
  "Multi-idioma: español e inglés",
  "Estadísticas de gasto entre viajes a lo largo del tiempo — comparar tendencias, categorías con mayor gasto recurrente y evolución del presupuesto histórico",
];

const GITHUB_URL = "https://github.com/stevenstyvargas/tripflow";

export function render(container) {
  container.innerHTML = `
    <div class="page-landing">
      <div class="landing-shell">
        <nav class="landing-nav">
          <img src="/img/Logotipo-fondo-claro.svg" alt="Tripflow" class="landing-nav-logo" />
          <a class="landing-cta-secondary landing-nav-cta" href="#/login">Iniciar sesión con Google</a>
        </nav>

        <header class="landing-hero">
          <div>
            <span class="landing-eyebrow">Control de presupuesto de viaje</span>
            <h1>Sabé si vas bien, <em>antes</em> de que sea tarde.</h1>
            <p class="landing-subhead">
              Tripflow convierte el presupuesto de cada viaje en un semáforo
              simple: verde mientras controlás el gasto, naranja cuando te
              acercás al límite, rojo cuando lo cruzás. Sin hojas de
              cálculo, sin sorpresas al volver.
            </p>
            <div class="landing-cta-row">
              <a class="landing-cta-primary" href="#/login">Iniciar sesión con Google</a>
              <a class="landing-cta-secondary" href="${GITHUB_URL}" target="_blank" rel="noopener noreferrer">
                ${GITHUB_MARK}<span>Ver en GitHub</span>
              </a>
            </div>
          </div>
          ${heroRoute()}
        </header>

        <section class="landing-section">
          <div class="landing-section-header">
            <h2>Todo lo que necesitás para no perder el control</h2>
            <p>6 funcionalidades reales, ya construidas — no un roadmap disfrazado de producto.</p>
          </div>
          <ul class="feature-grid">
            ${FEATURES.map(featureCard).join("")}
          </ul>
        </section>

        <section class="landing-section">
          <div class="landing-section-header">
            <h2>Lo que viene</h2>
            <p>Roadmap real, documentado en el repo — no promesas sueltas.</p>
          </div>
          <ul class="roadmap-list">
            ${ROADMAP.map((item) => `<li class="roadmap-item"><p>${item} <span class="roadmap-tag">Próximamente</span></p></li>`).join("")}
          </ul>
        </section>
      </div>

      <footer class="landing-footer">
        <div class="landing-shell landing-footer-inner">
          <a href="${GITHUB_URL}" target="_blank" rel="noopener noreferrer">${GITHUB_MARK}<span>Código en GitHub</span></a>
          <span>Construido por Steven Vargas, con colaboración de Claude Code — ver <a href="${GITHUB_URL}/blob/main/docs/ai-process.md" target="_blank" rel="noopener noreferrer">docs/ai-process.md</a></span>
        </div>
      </footer>
    </div>
  `;
}
