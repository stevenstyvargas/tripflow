# Design System — Tripflow

> Pensado para que un equipo de diseño/desarrollo pueda escalar la app
> a futuro (más divisas, perfil compartido, etc.) sin romper consistencia.

## Tokens

Todos los valores viven en `src/styles/tokens.css` como variables CSS.
Ningún componente debe usar un color, tamaño o radio "hardcodeado" —
siempre referencia al token. Ver `docs/branding.md` para la
justificación de cada color.

## Componentes

| Componente | Estados | Notas |
|---|---|---|
| Botón primario | default / hover / focus / disabled | `.button-primary`, navy sólido |
| Input de monto | default / focus / error | Debe soportar formato de las 3 divisas (`utils/currency.js`) |
| Card de viaje | default / cerca del límite / excedido | Foto de destino + badge de semáforo (`components/status-badge.js`) |
| Badge de divisa | — | Pendiente de componente propio; hoy el símbolo sale de `formatCurrency` |
| Sidebar / nav item | default / hover / activo | `components/sidebar.js`, activo = fondo navy |
| Badge de semáforo | ok / warning / danger | Ícono + texto + color, nunca solo color |
| KPI card | — | `.kpi-card`, ícono + label + valor |
| Gráfico de dona | con datos / vacío | SVG puro (`components/donut-chart.js`), sin librería de charting |
| Alert item | warning / danger | Borde izquierdo del color de severidad |
| History item | — | Nombre, fechas, presupuesto vs. gasto real |

## Alertas de presupuesto (semáforo)

Definido en `src/utils/status.js`, mismo criterio en toda la app:

- **Verde — "En control":** gasto < 80% del presupuesto límite
- **Naranja — "Al borde del límite":** gasto entre 80% y 100%
- **Rojo — "Límite superado":** gasto > 100%

Cada estado se calcula con `getBudgetStatus(spent, budgetLimit)` y se
renderiza siempre como ícono + texto + color (`statusBadge()`), nunca
solo color, por accesibilidad.

## Iconografía

Lucide Icons (`lucide-static`, SVG estáticos importados con `?raw`) —
nunca emojis como placeholder. El tamaño lo controla la clase `.icon`
y el color hereda de `currentColor` en el texto vecino.

## Roadmap de escalabilidad

- Perfil compartido / pareja con reparto de gastos
- Divisas adicionales (MXN, y otras de Latinoamérica)
- Escaneo de recibos con IA (ver `docs/ai-process.md`)
- Registro de gastos por categoría desde una pantalla dedicada (hoy
  `addExpense()` existe en el store pero aún no tiene UI propia)
- Subida real de foto de destino (hoy es una URL opcional en la
  creación del viaje; falta Firebase Storage o similar)
