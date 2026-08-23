# Decisiones de producto/UX — Tripflow

> Este archivo documenta decisiones de producto y UX que tomé de forma
> proactiva durante el desarrollo — situaciones que los criterios
> originales no cubrían y que resolví con criterio propio. Distinto de
> `docs/ai-process.md`, que documenta el proceso de colaboración con la
> IA (qué se le pidió, qué se ajustó). Se va llenando durante el
> desarrollo, no se reconstruye al final.

## Modal de confirmación antes de exceder presupuesto

**Problema:** si un gasto se guardaba directo, el usuario solo se enteraba
de que superó el presupuesto *después* del hecho, a través del semáforo o
de Alertas — para entonces el sobrecosto ya estaba consumado y no había
forma de dar marcha atrás desde el propio flujo de registro.

**Decisión:** antes de persistir el gasto, se calcula el nuevo total del
viaje y, si va a cruzar el 100% del presupuesto, se muestra un modal de
confirmación pidiendo continuar o cancelar. Solo se guarda si el usuario
confirma explícitamente.

**Por qué:** prevenir el error en el momento en que todavía se puede
evitar es mejor que solo reportarlo después de que ya ocurrió. Ver
`src/pages/trip-detail.js` (commit `c2c3723`) y el componente de modal
reutilizable en `src/components/confirm-modal.js` (commit `a1a6a7d`).

## Regla de accesibilidad del semáforo

**Problema:** un semáforo de presupuesto (verde/naranja/rojo) que
comunica el estado solo con color excluye a usuarios con daltonismo o baja
visión, y falla en pantallas con mal contraste o brillo reducido.

**Decisión:** cada estado del semáforo siempre se compone de ícono +
texto + color juntos, nunca color solo. Se centralizó en un componente
único (`statusBadge()` en `src/components/status-badge.js`) que arma esa
combinación a partir de `getStatusMeta()`, para que ningún lugar de la UI
(Inicio, Alertas, Historial, detalle de viaje) pueda mostrar el estado
saltándose la regla.

**Por qué:** no depender de la percepción de color del usuario para
transmitir información crítica del presupuesto (cuándo está cerca o
excedido).

## Estado vacío del placeholder de viaje

**Problema:** `photoUrl` es un campo opcional al crear un viaje (no hay
subida de imagen real todavía, ver roadmap en `docs/design-system.md`);
sin una foto, la card de Inicio quedaría con un espacio roto o un gris
genérico sin identidad.

**Decisión:** los viajes sin foto muestran un ícono de avión (Lucide
`plane`) centrado sobre el navy de marca (`var(--color-primary)`) en vez
de un placeholder gris. Ver `.trip-card-photo-placeholder` en
`src/styles/base.css` y su uso en `src/pages/dashboard.js`.

**Por qué:** mantener la identidad visual de la marca incluso en el
estado vacío, en vez de exponer una carencia de datos como un error
visual.

## Login resiliente a bloqueadores de anuncios

**Problema:** probando en un navegador con AdBlock activo, `signInWithPopup`
fallaba (`auth/popup-blocked`) incluso después de relajar la política COOP
de Vercel — el bloqueo lo hacía la extensión, no el sitio. Mostrar el
error de login tal cual ("no se pudo iniciar sesión") ahí sería confuso
para el usuario, que no hizo nada mal.

**Decisión:** `signInWithGoogle()` intenta primero `signInWithPopup`
(mejor experiencia cuando funciona) y, solo si falla con
`auth/popup-blocked` o `auth/popup-closed-by-user`, cae automáticamente a
`signInWithRedirect` con el mismo provider, sin mostrar ningún error —
debe sentirse como una transición normal, no como un fallo. Cualquier
otro código de error (red caída, cuenta inválida) sí sigue mostrando el
mensaje habitual. Ver `src/data/auth.js` (commit `c5a19ca`).

**Por qué:** este es el patrón recomendado oficialmente por Firebase para
navegadores con bloqueadores de popups o restricciones de terceros — el
usuario nunca debería ver el login fallar por algo fuera de su control
cuando hay una alternativa automática disponible.

## Formulario de viaje compartido entre crear y editar

**Problema:** el feedback de usuario pidió poder editar un viaje ya
creado (nombre, presupuesto, divisa, fechas, foto) — los mismos campos
que "Nuevo viaje". Construir un formulario de edición aparte hubiera
duplicado seis campos, su validación y su manejo de errores.

**Decisión:** el formulario (markup + submit + manejo de error) se
extrajo a `src/components/trip-form.js`, con una función `mountTripForm()`
que recibe los valores iniciales (vacíos para crear, precargados para
editar), el texto del botón y qué hacer con los datos. Tanto
`src/pages/new-trip.js` como el nuevo `src/pages/edit-trip.js` montan el
mismo componente; solo cambia si llaman a `createTrip()` o `updateTrip()`.
El único campo con comportamiento distinto entre los dos modos es la
divisa: si el viaje ya tiene gastos registrados, se bloquea (ver
siguiente decisión).

**Por qué:** un solo lugar con los campos y la validación evita que
crear y editar se desincronicen con el tiempo (ej. que alguien agregue
un campo nuevo a uno de los dos formularios y se olvide del otro).

## Bloquear la divisa al editar un viaje con gastos

**Problema:** cada gasto guarda su propia divisa, pero siempre hereda la
del viaje al crearse — no hay conversión entre divisas en el modelo de
datos. Si se permitiera cambiar la divisa de un viaje que ya tiene
gastos, `getTripTotal()` empezaría a sumar montos en divisas distintas
como si fueran la misma, rompiendo el total, el semáforo y la dona sin
ningún aviso.

**Decisión:** al editar un viaje, si ya tiene al menos un gasto
registrado, el campo de divisa queda bloqueado (las demás opciones se
deshabilitan en el `<select>`, dejando solo la actual seleccionable) con
un texto explicando por qué. `updateTrip()` además rechaza el cambio del
lado del store aunque alguien lograra saltarse el bloqueo visual.

**Por qué:** dos capas de protección (UI + validación en el store) para
un caso donde el costo de un error silencioso es alto: los totales de
un viaje quedarían mal calculados sin que nada lo señale.

## Un solo formulario de gasto, no dos, para agregar y editar

**Problema:** el feedback pidió poder editar un gasto ya registrado, con
los mismos campos que "Agregar gasto". A diferencia de "Editar viaje"
(que vive en su propia página), agregar/editar un gasto ocurre en la
misma pantalla de detalle de viaje — duplicar el formulario ahí habría
significado dos `<form>` casi idénticos compitiendo por el mismo espacio.

**Decisión:** se reusa el mismo `<form id="expense-form">` que ya existía
para "Agregar gasto". Un estado `editingExpenseId` (nulo cuando se está
agregando) decide si el submit llama a `addExpense()` o a
`updateExpense()`, y el botón de editar de cada gasto precarga ese mismo
formulario con los valores actuales en vez de abrir uno nuevo. El botón
"Cancelar" (visible solo en modo edición) y el botón "Agregar gasto" del
encabezado limpian ese estado al cerrar el formulario.

**Por qué:** es el mismo criterio que ya se aplicó para "eliminar gasto":
un solo patrón para una acción con variantes, en vez de dos flujos
paralelos que puedan desincronizarse.

## No repetir la confirmación de presupuesto al editar un gasto que ya lo excedía

**Problema:** el modal "Vas a superar el presupuesto" se reusa al editar
un gasto. Pero si un viaje ya estaba por encima del 100% *antes* de la
edición, seguir preguntando en cada edición (aunque sea para corregir
solo la fecha o la categoría) sería una fricción sin valor — el usuario
ya sabe que el viaje está excedido.

**Decisión:** el modal solo aparece si el cambio es lo que hace que el
viaje cruce el 100%, comparando el total *antes* de la edición (con el
monto original del gasto) contra el total proyectado *después* (con el
monto nuevo). Si el viaje ya estaba excedido antes del cambio, no se
vuelve a preguntar.

**Por qué:** la confirmación existe para prevenir un error evitable en
el momento en que ocurre, no para repetir una advertencia sobre un
estado que el usuario ya conoce y ya decidió aceptar.

## Formato en vivo de los campos de monto (sin decimales)

**Problema:** "Presupuesto límite" y "Monto" mostraban el número plano
mientras se escribía (ej. "4000000"), aunque el resto de la app siempre
formatea con separador de miles — inconsistente y difícil de leer para
montos grandes en COP, que es la divisa principal del producto.

**Decisión:** esos dos campos pasan de `type="number"` a `type="text"
inputmode="numeric"` (mismo teclado numérico en mobile) y se formatean
en vivo con separador de miles según la divisa del viaje, mientras se
mantiene el número real (sin separadores) como fuente de verdad para
guardar y calcular. La lógica vive en `utils/currency.js`
(`formatAmountInput`/`parseAmountInput`/`formatStoredAmount`, reusando
los mismos locales que `formatCurrency`) y `utils/amount-input.js`
(`bindAmountInput`), que sigue el cursor por *cantidad de dígitos
antes de él*, no por posición de caracter — necesario porque el
separador se inserta y corre en cada tecla. Ambos formularios (viaje y
gasto) usan el mismo helper.

Alcance explícito: estos campos ya no aceptan decimales (antes sí,
vía `step="any"`) — cualquier "." o "," que el usuario escriba se
descarta al quedarse solo con los dígitos. Es una simplificación
deliberada: la prueba de aceptación que motivó este cambio solo cubre
enteros, y formatear en vivo con separador de miles Y decimales a la
vez (dos símbolos distintos, uno de agrupación y otro decimal, en el
mismo campo) es sustancialmente más complejo de hacer bien con el
cursor. Si el producto necesita centavos en USD/EUR más adelante, hay
que revisarlo — por ahora los montos de viaje/gasto son enteros.

**Por qué:** la app es principalmente para COP (que ya no usa decimales
en `formatCurrency`), así que la pérdida de precisión práctica es baja;
priorizar que el caso común (COP, enteros) se vea bien mientras se
escribe, en vez de resolver un caso borde de centavos que ni siquiera
estaba explícitamente pedido.

## Torre de barras en Inicio, dona dentro de cada viaje: dos gráficos distintos a propósito

> **Superada por la siguiente decisión** ("Mismo gráfico de torres en las dos vistas") — se dejó este registro para que quede constancia de por qué se probó primero la variación de tipo de gráfico y por qué se revirtió.

**Problema:** feedback de usuario: la dona de "gasto por categoría" en
Inicio sumaba todos los viajes activos en un solo número por categoría,
pero el usuario quería ver cómo se reparte el gasto por categoría
*dentro de un viaje específico* — la vista agregada no respondía esa
pregunta, y no había ningún desglose por categoría a nivel de viaje.

**Decisión:** en vez de solo agregar la dona por viaje y dejar también
la dona agregada en Inicio, se cambió el tipo de gráfico de la vista
general a una torre de barras verticales (`components/bar-chart.js`),
una por categoría, siempre en el mismo orden fijo (el de
`EXPENSE_CATEGORIES`, nunca por monto) — y la dona (`donut-chart.js`,
ya existente) se reubicó exclusivamente al detalle de viaje, calculada
solo con los gastos de ese viaje. Ambos gráficos comparten la misma
paleta de colores por categoría (`--color-category-*` en `tokens.css`),
así que el color de "Transporte" es el mismo en las dos vistas.
Categorías sin gasto se muestran en gris (no en su color de marca) con
la torre en su altura mínima y el monto en `formatCurrency(0, ...)`.

**Por qué:** dos tipos de gráfico distintos (torre vs. dona) para dos
preguntas distintas ("¿cuánto llevo en cada categoría en total?" vs.
"¿cómo se reparte ESTE viaje?") ayuda a que el usuario no confunda una
vista con la otra de un vistazo, incluso antes de leer el título de la
sección — el tipo de gráfico ya comunica si está viendo un agregado o
el desglose de un viaje puntual.

## Mismo gráfico de torres en las dos vistas, tras probar la dona en detalle de viaje

**Problema:** en la práctica, la variación de tipo de gráfico (torre en
Inicio, dona en detalle de viaje) generaba más inconsistencia visual que
claridad: dos formas distintas de leer el mismo dato (gasto por
categoría) obligan al usuario a aprender dos lenguajes visuales en vez
de uno. El usuario pidió explícitamente volver a un solo tipo de
gráfico en las dos vistas.

**Decisión:** el detalle de viaje pasa de dona a la misma torre de
barras de Inicio (mismo componente `components/bar-chart.js`, mismos
colores por categoría), calculada solo con los gastos de ese viaje. Al
quedar el mismo tipo de gráfico en ambas vistas, la diferenciación pasa
a hacerla el título de cada sección en vez del tipo de gráfico: Inicio
dice "Gasto por categoría" con el subtítulo "Todos tus viajes activos",
y el detalle de viaje dice "Gasto por categoría de **[nombre del
viaje]**" con el nombre real insertado dinámicamente. Como la dona dejó
de usarse en cualquier lugar de la app, se eliminó `donut-chart.js` y su
CSS (`.donut-chart`, `.donut-legend*`) en vez de dejarlos sin usar.

**Por qué:** consistencia visual entre pantallas (un solo tipo de
gráfico para "gasto por categoría" en toda la app) es más valioso que
la señal adicional de "tipo de gráfico distinto = vista distinta"; el
título ya cumple ese rol de diferenciación sin pedirle al usuario que
aprenda a leer dos gráficos distintos para el mismo tipo de dato.

## KPIs de Inicio separados por divisa, no sumados

> **Superada por la siguiente decisión** ("Selector de divisa en vez de columnas separadas") — el problema de fondo (no sumar divisas distintas) sigue resuelto igual, pero la solución de UI cambió de "una columna de KPI por divisa" a "un selector que muestra una divisa a la vez", justo la migración que esta misma entrada ya anticipaba como roadmap.

**Problema:** "Gastado en el periodo" y "Presupuesto restante" sumaban
el gasto/presupuesto de TODOS los viajes activos normalizándolos a COP
con tasas fijas (`convert()`), aunque el usuario tuviera viajes en
distintas divisas. Eso inflaba artificialmente los totales (una tasa
fija de conversión no es el tipo de cambio real) y mezclaba números que
el usuario no puede gastar entre sí — nadie paga un hotel en Europa con
el "sobrante" de un viaje presupuestado en pesos colombianos.

**Decisión:** los dos KPIs se reemplazan por un bloque por cada divisa
que esté *realmente* en uso entre los viajes activos (nunca se muestran
bloques de divisas sin viajes) — cada bloque trae una píldora con el
código de divisa (mismo tratamiento visual que `.status-badge`: fondo
tintado + texto oscurecido del mismo tono, no color plano) y, debajo,
el gastado y el restante de esa divisa específica, sin convertir ni
sumar con las demás. "Viajes activos" (un conteo, no un monto) se
mantiene igual. Como consecuencia, el desglose "Gasto por categoría"
también se quitó por completo de Inicio: tenía el mismo problema de
mezclar divisas al sumar categorías entre viajes, y ya vive dentro de
cada viaje (donde todos los gastos comparten una sola divisa) desde una
decisión anterior en este mismo documento.

**Por qué (y limitación conocida):** mostrar números reales sin
convertir es más honesto que una suma que parece precisa pero no lo es.
Este patrón de columnas separadas funciona bien con 2-3 divisas (el
límite actual de v1: COP/USD/EUR) pero no escala a soportar "todas las
divisas del mundo" — con 8 o 10 divisas en uso, la fila de KPIs se
volvería ilegible. Queda como roadmap (ver `README.md`) diseñar un
patrón distinto (ej. selector de divisa, vista consolidada opcional
usando `convert()`, que se deja en el código sin uso actual justamente
para esto) cuando se amplíe el soporte de divisas más allá de v1.

## Selector de divisa en vez de columnas separadas

**Problema:** las columnas de KPI por divisa (decisión anterior)
resolvían el problema de no sumar divisas distintas, pero con 2+
divisas en uso la fila de KPIs se veía como una tabla comparativa en
vez de un resumen del periodo — y esa misma decisión ya anotaba que
las columnas no escalan bien más allá de 2-3 divisas.

**Decisión:** las columnas se reemplazan por un selector de divisa en
el header (patrón "cambiar idioma" tipo Amazon): una píldora con la
divisa activa y una flecha (reusa `.currency-pill`, ya existente) que
al hacer clic despliega un menú con las divisas *realmente* en uso
entre los viajes activos — dinámico, no una lista fija de 3. Los KPIs
"Gastado en el periodo" y "Presupuesto restante" vuelven a ser un solo
bloque limpio (como antes de separar por divisa), mostrando solo los
montos de la divisa seleccionada. Por defecto se selecciona la divisa
con más viajes activos (empate → COP). La selección vive en una
variable a nivel de módulo en `dashboard.js` (no en Firestore): se
mantiene mientras se navega dentro de la app y se resetea solo al
recargar la página, tal como se pidió. Si la divisa seleccionada deja
de tener viajes activos (se cerraron o eliminaron todos), se recalcula
el default automáticamente en el siguiente render. Las cards de "Tus
viajes activos" no se filtran por la divisa seleccionada — siguen
mostrando todos los viajes con su propia divisa nativa.

**Por qué:** un selector escala mejor que columnas de ancho variable a
medida que se agreguen más divisas (el problema de escalabilidad que
ya se había anotado como roadmap), y un solo bloque de KPI es más
fácil de leer de un vistazo que varias columnas — el usuario elige qué
divisa quiere ver en vez de tener que escanear todas a la vez.

<!--
Próxima decisión: agregar acá cuando surja, con el mismo formato:

## [Nombre de la decisión]
**Problema:** [qué situación o riesgo se detectó]
**Decisión:** [qué se implementó]
**Por qué:** [razonamiento de producto/UX]
-->
