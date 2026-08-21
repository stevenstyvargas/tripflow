# Tripflow

Controla tu presupuesto de viaje: crea viajes con un límite de gasto,
registra tus gastos en segundos y recibe alertas antes de excederte.

**Demo:** _(link público — se agrega al desplegar)_

Proyecto realizado para el reto técnico de Technical Product Designer en Alegra.

## Alcance de esta versión (v1)

- Dashboard de control de gastos
- Creación de viajes con presupuesto límite
- Registro de gastos
- Alertas de presupuesto
- 3 divisas: COP, USD, EUR
- Perfil individual (1 persona)
- Responsive: desktop y mobile
- PWA (instalable desde el navegador, sin tienda de apps)

**Fuera de alcance de v1** (roadmap, ver más abajo): perfil compartido/pareja
con reparto de gastos, divisas adicionales, escaneo de recibos con IA
(bonus, en evaluación según tiempo disponible).

## Stack

- JavaScript vanilla (sin frameworks ni UI kits) + Vite como herramienta de build
- CSS con variables/design tokens propios (ver `docs/design-system.md`)
- Persistencia local (localStorage) — sin backend para las funciones core
- Despliegue: Vercel, con dominio propio

## Cómo correr el proyecto localmente

```bash
git clone <url-del-repo>
cd tripflow
npm install
npm run dev
```

Esto levanta un servidor local (Vite) — la terminal mostrará la URL
(normalmente `http://localhost:5173`).

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
│   ├── data/             # Store central (estado + persistencia)
│   ├── pages/            # Vistas: dashboard, nuevo viaje, registrar gasto
│   ├── styles/           # tokens.css (design tokens) + base.css
│   ├── utils/            # Helpers (divisas, formato, etc.)
│   ├── main.js           # Punto de entrada
│   └── router.js         # Router simple basado en hash
├── index.html
└── vite.config.js
```

## Documentación del proceso

- [`docs/branding.md`](./docs/branding.md) — sistema de color, tipografía y logo, con justificación de cada decisión
- [`docs/design-system.md`](./docs/design-system.md) — tokens, componentes y estados
- [`docs/research.md`](./docs/research.md) — referencias revisadas (ej. Tickelia) y qué se aprendió de cada una
- [`docs/ai-process.md`](./docs/ai-process.md) — registro de qué se le pidió a la IA y qué se ajustó manualmente

## Roadmap (próximas actualizaciones)

- Perfil compartido: viaje en pareja con reparto de gastos
- Divisas adicionales (peso mexicano y otras de Latinoamérica)
- Escaneo de recibos con IA en el flujo de registro de gastos
