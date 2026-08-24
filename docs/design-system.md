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
| Card de viaje | default / hover (elevación) | `components/trip-card.js`, compartido por Inicio y Mis viajes: foto (con badge de duración si hay fechas) + barra de progreso de presupuesto + badge de semáforo |
| Badge de divisa | — | Pendiente de componente propio; hoy el símbolo sale de `formatCurrency` |
| Sidebar / nav item | default / hover / activo | `components/sidebar.js`, fondo navy — solo navegación (Inicio/Mis viajes/Alertas), la cuenta vive en el menú de cuenta. Activo = franja verde (`--color-accent`) pegada al borde izquierdo + texto blanco/bold (ya no fondo, navy sobre navy no contrasta); hover = overlay blanco sutil |
| Drawer mobile (≤45rem) | cerrado / abriendo / abierto | `components/sidebar.js` (`bindSidebar`), solo en el breakpoint mobile — reemplaza a la fila de íconos de nav y al chip de cuenta que en desktop viven sueltos en el header. Overlay + panel deslizante desde la izquierda (mismo fondo navy y estilo de item que el sidebar desktop, franja verde incluida), gatillado por un botón de hamburguesa; nav arriba, bloque de sesión (foto+nombre+email+cerrar sesión, siempre visible, sin colapsar) al fondo |
| Badge de semáforo | ok / warning / danger | Ícono + texto + color, nunca solo color |
| Badge de estado | en curso / finalizado | `.trip-state-badge`, siempre gris neutro (nunca verde/naranja/rojo) para no mezclarse con el semáforo. Va junto a `.status-badge` en la card de viaje; solo se muestra en la pestaña "Todos" de Mis viajes |
| KPI card | — | `components/kpi-card.js`, ícono + label + valor. Usada en Inicio, Mis viajes (recalculada según la pestaña activa), y apiladas en columna fija ("Presupuesto"/"Gastado"/"Restante") en el detalle de viaje |
| Menú de cuenta | cerrado / abierto | `components/account-menu.js`, foto (o inicial en placeholder navy) + nombre + email + chevron; dropdown con "Cerrar sesión". Se monta en el header de las 4 pantallas principales |
| Campo de búsqueda | default / focus | `components/search-field.js`, ícono de lupa + input; filtra viajes por nombre en vivo. Usado en Inicio y Mis viajes |
| Pestañas de filtro | default / hover / activa | `.tab-list`/`.tab-item`, subrayado navy en la activa. Usadas en Mis viajes (Todos/Activos/Cerrados) |
| Gráfico de dona | con datos / vacío | SVG puro (`components/donut-chart.js`), sin librería de charting. Centro con el total gastado; leyenda con % y monto por categoría, calculados sobre ese total |
| Anillo de progreso | ok / warning / danger | SVG puro (`components/budget-ring.js`), mismo radio/grosor que la dona. % real del presupuesto gastado (across viajes activos) en el centro, con ícono+texto+color del semáforo debajo (mismo criterio que `.status-badge`, nunca solo color); leyenda Gastado (navy)/Restante (verde), Restante en rojo si el gasto excede el presupuesto |
| Alert item | warning / danger | Borde completo (1px) del color de severidad |

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
