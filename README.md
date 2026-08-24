# Tripflow

Controla tu presupuesto de viaje: crea viajes con un límite de gasto,
registra tus gastos en segundos y recibe alertas antes de excederte.

**Demo:** [tripflow-ashen-chi.vercel.app](https://tripflow-ashen-chi.vercel.app)

Proyecto realizado para el reto técnico de Technical Product Designer en Alegra.

## Alcance de esta versión (v1)

- Autenticación con Google (Firebase Auth) — sin contraseñas propias que gestionar
- Dashboard de control de gastos
- Creación de viajes con presupuesto límite
- Registro de gastos
- Alertas de presupuesto
- Compartir viaje por WhatsApp (resumen de presupuesto y estado)
- 1 divisa: COP (peso colombiano)
- Perfil individual (1 persona)
- Responsive: desktop y mobile
- PWA (instalable desde el navegador, sin tienda de apps)

**Fuera de alcance de v1** (roadmap, ver más abajo): perfil compartido/pareja
con reparto de gastos, soporte multi-divisa (USD, EUR y más — se exploró y
se decidió simplificar a solo COP para esta entrega, ver
`docs/product-decisions.md`), escaneo de recibos con IA (bonus, en
evaluación según tiempo disponible).

## Stack

- JavaScript vanilla (sin frameworks ni UI kits) + Vite como herramienta de build
- CSS con variables/design tokens propios (ver `docs/design-system.md`)
- Autenticación: Firebase Auth con Google — sin contraseñas propias que gestionar
- Persistencia: Firestore, un documento por usuario autenticado
  (`users/{uid}/trips/{tripId}/expenses/{expenseId}`), con reglas de
  seguridad en `firestore.rules` para que cada usuario solo pueda leer
  y escribir sus propios datos
- Despliegue: Vercel

## Cómo correr el proyecto localmente

```bash
git clone <url-del-repo>
cd tripflow
npm install
cp .env.example .env   # completar con las credenciales de tu proyecto Firebase
npm run dev
```

Esto levanta un servidor local (Vite) — la terminal mostrará la URL
(normalmente `http://localhost:5173`).

### Variables de entorno

La app necesita un proyecto de Firebase propio (Authentication con el
proveedor de Google habilitado + Firestore) y sus credenciales en
`.env` (no versionado — ver `.env.example` como plantilla):

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Sin estas variables, Firebase no se inicializa y la app no llega ni a
mostrar la pantalla de login. Al desplegar en Vercel, las mismas
variables deben configurarse ahí (Project Settings → Environment
Variables).

Para generar la build de producción:

```bash
npm run build
npm run preview
```

## Estructura del proyecto

```
tripflow/
├── api/                  # Funciones serverless (bonus: escaneo de recibos)
├── docs/                 # Branding, design system, research, proceso con IA
├── public/               # Assets estáticos, íconos
├── src/
│   ├── components/       # Componentes de UI reutilizables
│   ├── data/             # Firebase (auth.js, firebase.js) + store central en memoria
│   ├── pages/            # Vistas: Inicio, Mis viajes, Alertas, detalle de
│   │                     # viaje (registro de gastos), nuevo/editar viaje, login
│   ├── styles/           # tokens.css (design tokens) + base.css
│   ├── utils/            # Helpers (formato de moneda, íconos, categorías, etc.)
│   ├── main.js           # Punto de entrada
│   └── router.js         # Router simple basado en hash
├── firestore.rules       # Reglas de seguridad de Firestore
├── .env.example          # Plantilla de variables de entorno (ver más abajo)
├── index.html
└── vite.config.js
```

## Documentación del proceso

- [`docs/branding.md`](./docs/branding.md) — sistema de color, tipografía y logo, con justificación de cada decisión
- [`docs/design-system.md`](./docs/design-system.md) — tokens, componentes y estados
- [`docs/research.md`](./docs/research.md) — referencias revisadas (ej. Tickelia) y qué se aprendió de cada una
- [`docs/product-decisions.md`](./docs/product-decisions.md) — decisiones de producto/UX tomadas durante el desarrollo, con el problema y el porqué de cada una
- [`docs/ai-process.md`](./docs/ai-process.md) — registro de qué se le pidió a la IA y qué se ajustó manualmente

## Roadmap (próximas actualizaciones)

- Perfil compartido: viaje en pareja con reparto de gastos
- Reintroducir soporte multi-divisa (COP, USD, EUR y más) con una UX más
  simple y clara. Ya se exploró y se construyó una vez (selector de
  divisa en Inicio, tasas de conversión) pero se retiró por la
  complejidad y las confusiones de UX que generaba — KPIs mezclados,
  gráfico de categorías mezclado, ambigüedad de qué representaba el
  símbolo "$". La próxima versión necesita un patrón de diseño distinto
  desde el principio, no solo agregar divisas al que ya existía. Ver
  `docs/product-decisions.md`
- Escaneo de recibos con IA en el flujo de registro de gastos — los
  recibos escaneados vivirán en una nueva sección "Mis facturas"
- Vista de calendario dentro de la app, con todos los viajes del
  usuario en un solo lugar (distinta del botón "Agregar a Google
  Calendar" que ya existe por viaje individual, que se mantiene igual)
- Multi-idioma: español e inglés
- Eliminar viaje de forma permanente (hoy solo existe "finalizar
  viaje", que cambia el estado sin borrar datos; se evaluó agregar
  eliminación definitiva pero se decidió postergarla por el riesgo de
  manejar borrado en cascada de gastos asociados a dos días de la
  entrega, ver `docs/product-decisions.md`)
