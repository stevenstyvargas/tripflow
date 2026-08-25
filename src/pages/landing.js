// Página pública: landing de Tripflow, se muestra a usuarios SIN sesión
// en vez de ir directo al login (router.js: solo "/login" muestra el
// login real; cualquier otro hash sin sesión cae acá). El login en sí
// no se toca ni se duplica — el CTA de acá es un <a href="#/login">
// plano, la lógica de signInWithGoogle() sigue viviendo solo en
// pages/login.js. Con sesión activa, el router nunca llega a esta
// página (va directo a Inicio).
//
// Capturas reales (src/assets/landing/*.webp): no son la app en vivo
// (requeriría una sesión de Google real, que este entorno no tiene) —
// son las mismas páginas/componentes reales de la app, renderizadas
// con datos de viaje de muestra vía un harness Playwright, con el
// semáforo en naranja/rojo a propósito para que se vea activo. Ver
// docs/ai-process.md para el detalle de cómo se generaron. Todas en
// WebP (antes PNG) — mismo motivo que las 4 de public/img/ de abajo,
// ver esa nota: reescaladas a su ancho de display real (no al 2880px
// nativo de la captura original) y reencodeadas, sin pérdida visible.
import "../styles/landing.css";
import { icon } from "../utils/icons.js";

import inicioImg from "../assets/landing/inicio.webp";
import detalleImg from "../assets/landing/detalle-viaje.webp";
import alertasImg from "../assets/landing/alertas.webp";
import nuevoViajeImg from "../assets/landing/nuevo-viaje.webp";
import whatsappImg from "../assets/landing/whatsapp.webp";
import calendarImg from "../assets/landing/google-calendar.webp";

// A diferencia de las capturas de arriba (src/assets/landing/, generadas
// por el harness Playwright de esta sesión e importadas como módulo para
// que Vite las hashee), estas son imágenes subidas directo por el
// usuario a public/img/ — mismo criterio que Imagen-inicio-sesion.jpg
// del login: se referencian como URL de archivo estático, sin pasar por
// el pipeline de assets. Las 3 de "Cómo funciona" reemplazan a las
// capturas reales que había antes (step-1/2/3, borradas de
// src/assets/landing/, ver docs/ai-process.md). Las 4 pasaron de PNG a
// WebP (auditoría de performance previa a la entrega, ver
// docs/ai-process.md): el usuario las subió a resolución nativa de
// cámara/generador de imagen (1.5-2.3MB cada una, mucho más grande de
// lo que se ve en pantalla — el slot más ancho de la página, el hero,
// nunca pasa de ~700px de ancho real), así que se reescalaron al
// tamaño real de despliegue (2x para pantallas retina) y se
// reencodearon a WebP calidad 78-82 — sin pérdida visible, confirmado
// visualmente antes de reemplazar los archivos.
const HERO_VISUAL_URL = "/img/Imagen-fondo-banner-principal.webp";
const STEP1_URL = "/img/1-imagen-crear-viaje.webp";
const STEP2_URL = "/img/2imagen-registrar-datos.webp";
const STEP3_URL = "/img/3-imagen-controlar-gastos.webp";

// Mismo SVG de marca oficial de GitHub, monocromo (currentColor) — no
// hay ícono de marca en Lucide (a propósito, no cubren logos), así que
// va escrito a mano acá en vez de en utils/icons.js, que es solo para
// el set de Lucide.
const GITHUB_MARK = `
  <svg class="icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.5 0-.24-.01-1.04-.01-1.89-2.78.62-3.37-1.21-3.37-1.21-.46-1.19-1.11-1.51-1.11-1.51-.9-.63.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.31.1-2.72 0 0 .84-.28 2.75 1.05a9.3 9.3 0 0 1 2.5-.35c.85 0 1.7.12 2.5.35 1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.46.1 2.72.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.8-4.57 5.06.36.32.68.95.68 1.92 0 1.39-.01 2.5-.01 2.85 0 .28.18.61.69.5A10.26 10.26 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z"/>
  </svg>
`;

// El número en sí ES la información acá (paso 1, 2, 3 en orden real,
// no una lista cualquiera con marcadores decorativos) — por eso el
// badge circular de cada tarjeta muestra el número, no un ícono
// genérico. Las 3 imágenes son capturas reales (mismo harness
// Playwright que ya generó el resto de src/assets/landing/, ver
// docs/ai-process.md), recortadas mucho más de cerca que las de
// "Funcionalidades" — acá el punto no es mostrar la pantalla
// completa, sino el gesto puntual de cada paso.
const STEPS = [
  {
    title: "Crea tu viaje y define tu presupuesto",
    text: "Define cuánto quieres gastar y agrega las fechas de tu viaje cuando quieras.",
    image: STEP1_URL,
  },
  {
    title: "Registra cada gasto y clasifícalo por categoría",
    text: "Añade cada gasto y clasifícalo para saber cómo usas tu presupuesto.",
    image: STEP2_URL,
  },
  {
    title: "Controla tu presupuesto y revisa cómo vas",
    text: "Consulta el semáforo para saber si estás en control o cerca del límite.",
    image: STEP3_URL,
  },
];

function stepCard({ title, text, image }, index) {
  return `
    <li class="step-card">
      <div class="step-card-image">
        <img src="${image}" width="900" height="600" alt="Paso ${index + 1}: ${title}" loading="lazy" />
      </div>
      <span class="step-card-number">${index + 1}</span>
      <div class="step-card-body">
        <h3>${title}</h3>
        <p>${text}</p>
      </div>
    </li>
  `;
}

// Las 6 tarjetas comparten EXACTAMENTE el mismo tratamiento visual
// (mismo marco de navegador, misma caja de imagen 16:10, mismo
// object-fit: cover). Cada captura se generó (o regeneró) para llenar
// esa caja con interfaz real, en vez de recortar/estirar una imagen
// chica: alertas.webp es la pantalla real de Alertas con 4 viajes de
// muestra (antes 2, dejaban medio contenedor vacío); whatsapp.webp y
// google-calendar.webp son mockups de la interfaz COMPLETA de cada app
// externa (header, fondo/grid, el mensaje o evento real, barra de
// input/badge de origen) construidos a mano en 1150×719 (16:10 exacto,
// sin necesidad de recorte) — ya no son solo el bubble o el botón
// sueltos flotando en espacio en blanco. width/height por imagen
// (dimensión real del .webp, ver docs/ai-process.md): no son un
// placeholder, es la reserva de espacio nativa del navegador (evita
// layout shift al cargar, mismo tamaño de caja que ya fija
// aspect-ratio:16/10 en CSS — Lighthouse pedía además los atributos
// HTML, no solo el aspect-ratio de CSS).
// object-position por imagen: con object-fit:cover, la caja 16:10
// recorta lo que sobre de cada captura según su proporción nativa
// (ver ancho/alto de cada una abajo). "center" (default del navegador,
// se omite) alcanza cuando el recorte es chico; las que se alejan
// más de 16:10 necesitan un ancla explícita para no comerse contenido
// clave — ver el detalle de cada una en su comentario.
const FEATURES = [
  {
    iconName: "layout-dashboard",
    title: "Dashboard de gastos",
    text: "Cuánto llevás gastado, cuántos viajes tenés en riesgo y en qué categorías se te va la plata — todo junto al abrir la app, no repartido en 3 pantallas.",
    image: inicioImg,
    width: 1150,
    height: 799,
  },
  {
    iconName: "plus",
    title: "Creación de viajes con presupuesto límite",
    text: "Definí un límite en pesos colombianos por viaje, con fechas opcionales. Con fotos sugeridas del destino (Pexels) en vez de tener que salir a buscar una URL a mano.",
    image: nuevoViajeImg,
    width: 1024,
    height: 1308,
    // Retrato angosto (0.78:1) contra caja 16:10: cover solo puede
    // mostrar ~49% del alto. "top" prioriza título + nombre del viaje
    // + presupuesto (el campo que le da nombre a esta tarjeta) sobre
    // fechas/fotos, que quedan fuera del recorte.
    position: "top",
  },
  {
    iconName: "wallet",
    title: "Registro de gastos",
    text: "Cargá cada gasto por categoría — transporte, comida, hotel y más — en segundos, y mirá cómo se actualiza tu presupuesto en tiempo real.",
    image: detalleImg,
    width: 1150,
    height: 799,
  },
  {
    iconName: "target",
    title: "Sistema de semáforo",
    text: "Verde mientras vas bien, naranja al 80% del límite, rojo al superarlo — el mismo criterio en Inicio, Alertas y cada viaje, siempre con ícono y texto, nunca solo color.",
    image: alertasImg,
    width: 1150,
    height: 540,
    // Más ancha que la caja: cover recorta de los costados. "right"
    // se come sobre todo el sidebar de navegación (repetido en las
    // otras 5 capturas, no es información nueva acá) y conserva
    // completo el borde de color + botón "Ver viaje" de cada alerta,
    // que es el contenido que ilustra el semáforo.
    position: "right",
  },
  {
    iconName: "message-circle",
    title: "Compartir por WhatsApp",
    text: "Mandá un resumen del estado de tu viaje — gastado, restante, semáforo — directo por WhatsApp, sin exportar nada.",
    image: whatsappImg,
    width: 1150,
    height: 719,
  },
  {
    iconName: "calendar",
    title: "Integración con Google Calendar",
    text: "Si tu viaje tiene fechas, agregalo a tu calendario con un click — un link directo, sin pedirte permisos de tu cuenta.",
    image: calendarImg,
    width: 1150,
    height: 719,
  },
];

function featureCard({ iconName, title, text, image, width, height, position }) {
  const style = position ? ` style="object-position: ${position}"` : "";
  return `
    <li class="feature-card">
      <div class="browser-frame">
        <div class="browser-frame-bar"><span></span><span></span><span></span></div>
        <div class="browser-frame-media">
          <img src="${image}" width="${width}" height="${height}" alt="Captura real de &quot;${title}&quot; en Tripflow" loading="lazy"${style} />
        </div>
      </div>
      <div class="feature-card-icon">${icon(iconName)}</div>
      <h3>${title}</h3>
      <p>${text}</p>
    </li>
  `;
}

// Mismo texto que ya usaba el roadmap (de README.md, ## Roadmap
// (próximas actualizaciones)) — no se redacta copy nuevo, solo se le
// suma un título corto + ícono a cada ítem para el nuevo formato de
// tarjeta. Los títulos son los mismos 3 que ya usa la tarjeta "Próximas
// actualizaciones" del sidebar (Multidivisa/Multilenguaje/Escaneo con
// IA, ver components/sidebar.js) extendidos a los 5 ítems del roadmap
// completo, para que ambos lugares nombren las mismas features igual.
// En "Viaje compartido" y "Multilenguaje" el texto original ya traía
// ese mismo título como prefijo ("Viaje compartido: ...", "Multi-
// idioma: ...") — se recorta ESE prefijo redundante nada más (no se
// reescribe ni se resume el resto de la oración); los otros 3 no
// tenían ese prefijo, así que quedan con el texto completo tal cual.
const ROADMAP = [
  {
    iconName: "banknote",
    title: "Multidivisa",
    text: "Reintroducir soporte multi-divisa (COP, USD, EUR y más) con una UX más simple y clara",
  },
  {
    iconName: "languages",
    title: "Multilenguaje",
    text: "español e inglés",
  },
  {
    iconName: "scan-line",
    title: "Escaneo con IA",
    text: "Escaneo de recibos con IA en el flujo de registro de gastos — los recibos escaneados vivirán en una nueva sección “Mis facturas”",
  },
  {
    iconName: "users",
    title: "Viaje compartido",
    text: "viaje en pareja con reparto de gastos",
  },
  {
    iconName: "bar-chart-3",
    title: "Estadísticas",
    text: "Estadísticas de gasto entre viajes a lo largo del tiempo — comparar tendencias, categorías con mayor gasto recurrente y evolución del presupuesto histórico",
  },
];

function roadmapCard({ iconName, title, text }) {
  return `
    <li class="roadmap-item">
      <div class="roadmap-item-header">
        <span class="roadmap-item-icon">${icon(iconName)}</span>
        <h3>${title}</h3>
        <span class="status-badge status-badge-ok">Próximamente</span>
      </div>
      <p>${text}</p>
    </li>
  `;
}

const GITHUB_URL = "https://github.com/stevenstyvargas/tripflow";

export function render(container) {
  container.innerHTML = `
    <div class="page-landing">
      <div class="landing-topbar">
        <nav class="landing-pill" aria-label="Navegación de la página">
          <a href="#/" class="landing-pill-logo" aria-label="Ir arriba">
            <img src="/img/Logotipo-fondo-claro.svg" width="487" height="115" alt="Tripflow" class="landing-nav-logo" />
          </a>
          <div class="landing-pill-links">
            <a class="landing-pill-link" href="#como-funciona">Cómo funciona</a>
            <a class="landing-pill-link" href="#funcionalidades">Funcionalidades</a>
            <a class="landing-pill-link" href="#proximamente">Próximamente</a>
          </div>
          <a class="landing-pill-login" href="#/login">${icon("arrow-up-right")}<span>Probar demo</span></a>
          <button type="button" class="landing-pill-toggle" id="landing-menu-toggle" aria-label="Abrir menú" aria-haspopup="true" aria-expanded="false" aria-controls="landing-mobile-menu">
            ${icon("menu")}
          </button>
        </nav>
        <div class="landing-mobile-menu" id="landing-mobile-menu" hidden>
          <a class="landing-mobile-menu-link" href="#como-funciona">Cómo funciona</a>
          <a class="landing-mobile-menu-link" href="#funcionalidades">Funcionalidades</a>
          <a class="landing-mobile-menu-link" href="#proximamente">Próximamente</a>
          <a class="landing-mobile-menu-cta" href="#/login">${icon("arrow-up-right")}<span>Probar demo</span></a>
        </div>
      </div>

      <main>
      <header class="landing-hero">
        <div>
          <span class="landing-eyebrow">Control de presupuesto de viaje</span>
          <h1>Tu presupuesto de viaje, <em>bajo control</em></h1>
          <p class="landing-subhead">
            Planeá cuánto querés gastar, registrá tus gastos y recibí
            alertas antes de pasarte del presupuesto. Así disfrutás tus
            vacaciones sin sorpresas al volver.
          </p>
          <div class="landing-cta-row">
            <a class="landing-cta-primary" href="#/login">${icon("arrow-up-right")}<span>Probar Demo</span></a>
            <a class="landing-cta-secondary" href="${GITHUB_URL}" target="_blank" rel="noopener noreferrer">
              ${GITHUB_MARK}<span>Ver en GitHub</span>
            </a>
          </div>
        </div>
        <img class="hero-visual" src="${HERO_VISUAL_URL}" width="1156" height="832" alt="Dashboard de Tripflow con el gasto por categoría, alertas de presupuesto y los viajes activos del usuario" fetchpriority="high" />
      </header>

      <section class="landing-section landing-section-white" id="como-funciona">
        <div class="landing-shell">
          <div class="landing-section-header">
            <h2>Cómo funciona</h2>
            <p>3 pasos, sin curva de aprendizaje.</p>
          </div>
          <ol class="steps-grid">
            ${STEPS.map(stepCard).join("")}
          </ol>
        </div>
      </section>

      <section class="landing-section" id="funcionalidades">
        <div class="landing-shell">
          <div class="landing-section-header">
            <h2>Todo lo que necesitás para no perder el control</h2>
            <p>6 funcionalidades reales, ya construidas — no un roadmap disfrazado de producto.</p>
          </div>
          <ul class="feature-grid">
            ${FEATURES.map(featureCard).join("")}
          </ul>
        </div>
      </section>

      <section class="landing-section landing-section-white" id="proximamente">
        <div class="landing-shell">
          <div class="landing-section-header">
            <h2>Lo que viene</h2>
            <p>Roadmap real, documentado en el repo — no promesas sueltas.</p>
          </div>
          <ul class="roadmap-list">
            ${ROADMAP.map(roadmapCard).join("")}
          </ul>
        </div>
      </section>
      </main>

      <footer class="landing-footer">
        <div class="landing-shell landing-footer-inner">
          <a class="landing-footer-github" href="${GITHUB_URL}" target="_blank" rel="noopener noreferrer">${GITHUB_MARK}<span>Código en GitHub</span></a>
          <span>Construido por <a class="landing-footer-author" href="https://stevenvargas.com.co/" target="_blank" rel="noopener noreferrer">Steven Vargas</a>, con colaboración de Claude Code — ver <a href="${GITHUB_URL}/blob/main/docs/ai-process.md" target="_blank" rel="noopener noreferrer">docs/ai-process.md</a></span>
        </div>
      </footer>
    </div>
  `;

  bindLandingNav(container);
}

// Mismo patrón de abrir/cerrar que components/account-menu.js (click
// afuera + Escape cierran, listeners de document solo mientras está
// abierto) — el menú mobile del pill flotante es conceptualmente el
// mismo tipo de dropdown, aunque viva en una página distinta.
function bindLandingNav(container) {
  const toggle = container.querySelector("#landing-menu-toggle");
  const menu = container.querySelector("#landing-mobile-menu");
  if (!toggle || !menu) return;

  function close() {
    menu.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
    document.removeEventListener("click", onDocumentClick);
    document.removeEventListener("keydown", onKeydown);
  }

  function open() {
    menu.hidden = false;
    toggle.setAttribute("aria-expanded", "true");
    document.addEventListener("click", onDocumentClick);
    document.addEventListener("keydown", onKeydown);
  }

  function onDocumentClick(event) {
    if (!menu.contains(event.target) && !toggle.contains(event.target)) close();
  }

  function onKeydown(event) {
    if (event.key === "Escape") close();
  }

  toggle.addEventListener("click", (event) => {
    event.stopPropagation();
    if (menu.hidden) open();
    else close();
  });

  // Un click en cualquier link del menú (ancla o "Iniciar sesión") ya
  // dispara la navegación/scroll solo — acá solo hace falta cerrar el
  // menú para que no tape la sección a la que se saltó.
  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", close);
  });
}
