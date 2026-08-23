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
El único campo con comportamiento distinto entre los dos modos era la
divisa: si el viaje ya tenía gastos registrados, se bloqueaba (ver
siguiente decisión — hoy superada: v1 se simplificó a una sola divisa,
así que ese campo ya no existe en el formulario).

**Por qué:** un solo lugar con los campos y la validación evita que
crear y editar se desincronicen con el tiempo (ej. que alguien agregue
un campo nuevo a uno de los dos formularios y se olvide del otro).

## Bloquear la divisa al editar un viaje con gastos

> **Superada:** v1 se simplificó a una sola divisa (COP) — ver "Simplificación a una sola divisa (COP)" al final de este documento. Ya no existe un campo de divisa que bloquear.

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

> **Superada:** v1 se simplificó a una sola divisa (COP) — ver "Simplificación a una sola divisa (COP)" al final de este documento. Se deja este registro porque documenta el patrón de UI que se exploró antes de decidir simplificar, y es justo lo que el roadmap de `README.md` dice que habría que retomar si se reintroduce multi-divisa más adelante.

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

## "Agregar a Google Calendar" con link plano, sin OAuth ni API

**Problema:** se quería poder agregar un viaje al calendario del
usuario. Integrar la API de Google Calendar de verdad (crear el evento
del lado del servidor, o incluso solo leer/escribir en el calendario
del usuario) requiere OAuth — pantalla de consentimiento, tokens,
scopes, y para v1 ni siquiera hay backend propio que pueda guardar esos
tokens de forma segura.

**Decisión:** el botón abre, en pestaña nueva, la URL pública de Google
Calendar para "crear evento" con los parámetros ya prellenados
(`calendar.google.com/calendar/render?action=TEMPLATE&...`) — texto,
fechas y presupuesto en la URL, `url-encoded`. No hay llamada a ninguna
API, no hay token, no hay backend involucrado: es el mismo mecanismo
que usan los botones de "agregar al calendario" de sitios de eventos.
Google Calendar abre su propia pantalla de "guardar evento" ya con los
datos cargados, y el usuario decide si lo guarda tal cual, lo ajusta o
lo descarta — la app nunca escribe directamente en su calendario. El
botón solo aparece si el viaje tiene fecha de inicio Y fin (ambas son
opcionales al crear un viaje); sin las dos fechas no hay rango de
evento que armar.

Un detalle no obvio: Google Calendar trata el fin de un evento de día
completo como *exclusivo* (el evento termina al empezar ese día, no lo
incluye) — el link usa la fecha de fin del viaje **+1 día**, si no, el
último día del viaje quedaría fuera del evento creado.

**Por qué:** para el caso de uso ("que me quede el viaje marcado en mi
calendario") no hace falta escribir directamente en el calendario del
usuario ni pedirle permisos — un link prellenado resuelve el 90% del
valor con una fracción de la complejidad (sin secretos que gestionar,
sin flujo de consentimiento, sin scope de Calendar que pedir). Si más
adelante se necesita sincronización real (ej. que un gasto nuevo
actualice el evento automáticamente), eso sí requeriría OAuth y queda
fuera de este alcance.

## Simplificación a una sola divisa (COP)

**Problema:** se construyó soporte multi-divisa completo — selección de
divisa al crear/editar un viaje, bloqueo de divisa una vez el viaje
tenía gastos, KPIs de Inicio primero normalizados y luego separados por
divisa en columnas, y finalmente un selector de divisa estilo "cambiar
idioma" con dropdown dinámico. En la práctica, ese sistema generaba más
confusión de UX de la que resolvía para esta entrega: KPIs que
cambiaban de forma según cuántas divisas hubiera en uso, un gráfico de
categorías que en algún punto tuvo que quitarse de Inicio porque mezclar
divisas ahí no tenía una respuesta limpia, y una ambigüedad de fondo con
el símbolo "$" (que representa tanto COP como USD en sus locales
respectivos) que ningún tratamiento visual del selector terminaba de
resolver del todo. El costo de mantener y explicar ese sistema no se
justificaba para un producto que, en la práctica, la mayoría de usuarios
va a usar en una sola divisa.

**Decisión:** se retira todo el soporte multi-divisa y la app queda fija
en COP (peso colombiano) para v1:
- El campo "Divisa" desaparece de "Nuevo viaje"/"Editar viaje"
  (`components/trip-form.js`) — todo viaje se crea en COP, sin selección
  ni bloqueo condicional que explicar.
- El selector de divisa del header de Inicio (píldora + dropdown) se
  elimina por completo, junto con su CSS (`.currency-pill*`,
  `.currency-select*`) y el ícono `chevron-down`, que quedó sin otro uso.
- `formatCurrency()` (`utils/currency.js`) deja de recibir una divisa
  como parámetro — siempre formatea en COP — y ahora agrega el texto
  "COP" al final de cada monto (ej. "$190.000 COP"), para que quede
  explícito y sin ambigüedad en absolutamente todos los lugares donde se
  muestra dinero (KPIs, cards de viaje, detalle de viaje, gastos,
  Alertas, Historial) con un solo cambio, sin tocar cada pantalla una
  por una.
- Se elimina `convert()`/`FIXED_RATES_TO_COP` (tasas fijas de
  conversión) de `utils/currency.js`: ya no hay nada que convertir entre
  divisas.
- Los viajes de prueba que ya existían en USD/EUR (creados mientras se
  probaba el sistema multi-divisa) **no se migran ni se convierten** —
  sus montos van a mostrarse con el texto "COP" igual, aunque el número
  no represente pesos colombianos reales. Es una decisión consciente:
  esos registros de prueba se van a borrar manualmente y reemplazar por
  viajes nuevos ya en COP.

**Por qué:** esto es una decisión consciente de alcance para esta
entrega, no una limitación técnica — el sistema multi-divisa funcionaba
y está documentado en las tres decisiones anteriores de este archivo
(quedan marcadas como superadas, no borradas, porque documentan el
camino ya explorado). Simplificar a una sola divisa elimina de raíz los
casos de confusión que esas decisiones fueron parchando una por una
(KPIs mezclados, gráfico de categorías mezclado, ambigüedad del símbolo
"$") en vez de seguir agregando UI para manejarlos. Si el producto
necesita multi-divisa más adelante, el roadmap (`README.md`) ya apunta
a que hay que diseñar el patrón desde otro ángulo, no simplemente
reactivar lo que se retiró acá.

## Rediseño de Historial, reconstruido con nuestro propio sistema de diseño

**Problema:** Historial se sentía la pantalla más vacía de la app —
solo una lista de texto (nombre, fechas, badge, un monto) sin ningún
resumen ni identidad visual, mientras que Inicio ya tenía KPIs y cards
con foto. El layout se pensó mirando un patrón de referencia externo
(lista de tarjetas con foto + resumen numérico arriba), pero ese
patrón no trae consigo su paleta de colores ni su iconografía — la
referencia es solo de estructura, no de estilo.

**Decisión:** Historial se reconstruye íntegramente con componentes y
tokens que ya existían en la app, sin introducir ningún color o ícono
nuevo fuera del sistema:
- Una fila de KPIs arriba (`components/kpi-card.js`, extraído de
  Inicio para poder reusarlo acá — mismo componente visual `.kpi-card`
  en las dos pantallas): "Viajes realizados" (ícono `plane`, mismo que
  "Viajes activos" en Inicio), "Gasto total" (`wallet`, igual que
  "Gastado en el periodo"), "Promedio por viaje" (`calculator`) y
  "Presupuesto cumplido" (`circle-check`, mismo ícono que el badge "En
  control" del semáforo) — el % de viajes cerrados cuyo badge final fue
  "En control", sobre el total.
- Cada card gana una foto (o el mismo placeholder de avión sobre navy
  que ya usa Inicio — `icon("plane", "trip-card-photo-placeholder")`
  reutilizado tal cual, no un ícono nuevo) y pasa de layout vertical a
  horizontal: foto | nombre + fechas | badge + montos + `chevron-right`
  (Lucide) que señala que la card es clickeable.
- Cada card navega a `/viaje/:id` (la misma pantalla de detalle que ya
  existe). Ahí, el botón "Agregar gasto" no se muestra si el viaje está
  cerrado (`trip.status === TRIP_STATUS.CLOSED`) — el formulario sigue
  en el DOM oculto porque editar/eliminar un gasto puntual de un viaje
  cerrado no se pidió bloquear, solo agregar gastos nuevos no tiene
  sentido en un viaje que ya terminó.
- El badge de semáforo se deja exactamente igual ("En control"/"Límite
  superado", `components/status-badge.js` sin tocar) — no se introduce
  terminología nueva.

**Por qué:** un patrón de referencia externo es útil para pensar la
*estructura* de una pantalla (qué información va dónde), pero copiar
también su paleta o iconografía rompería la identidad visual ya
definida en `docs/branding.md`. Reconstruir con los componentes propios
(`kpi-card`, `trip-card-photo-placeholder`, `status-badge`) en vez de
crear piezas nuevas desde cero también evita que Historial e Inicio se
desincronicen visualmente con el tiempo.

## Vuelve la dona de "Gasto por categoría" a Inicio, ahora que es matemáticamente válida

**Contexto:** la dona de categorías (`components/donut-chart.js`) vivió
originalmente en Inicio, sumando el gasto por categoría de todos los
viajes activos. Se quitó de ahí dos veces, por dos razones distintas
(ver "Torre de barras en Inicio, dona dentro de cada viaje" y "KPIs de
Inicio separados por divisa" más arriba en este documento):
1. Primero se cambió por una torre de barras para diferenciar
   visualmente la vista agregada (Inicio) del detalle de un viaje.
2. Después, al construirse el sistema multi-divisa, sumar categorías
   entre viajes en distintas divisas dejó de ser una operación válida
   — normalizar con `convert()` mezclaba montos que el usuario no
   podía gastar entre sí (el mismo problema que afectó a los KPIs de
   "Gastado en el periodo"/"Presupuesto restante" en su momento). El
   gráfico se eliminó de Inicio por completo en ese punto, y
   `donut-chart.js` se borró del proyecto al no tener ya ningún uso.

**Decisión:** con la simplificación a una sola divisa (COP — ver
"Simplificación a una sola divisa (COP)" en este mismo documento), el
problema de fondo desaparece: todos los montos de todos los viajes
activos están en la misma unidad, así que sumarlos por categoría vuelve
a ser una operación matemáticamente correcta, no solo visualmente
plausible. Se restaura `donut-chart.js` (SVG puro, sin librerías,
idéntico al original) y se agrega de nuevo a Inicio bajo "Gasto por
categoría" / "Todos tus viajes activos", calculado sobre
`getExpensesByTrip()` de cada viaje activo. La torre de barras
(`components/bar-chart.js`) se mantiene sin cambios en el detalle de
cada viaje ("Gasto por categoría de [nombre del viaje]") — ambos
gráficos conviven, cada uno respondiendo una pregunta distinta: la
dona da la proporción del total agregado, la torre da el detalle con
montos de un viaje puntual. Mismos colores por categoría
(`--color-category-*`) y mismo estado vacío (`.donut-chart-empty`) que
ya usaba el componente antes de eliminarse.

**Por qué:** la razón original para sacar la dona de Inicio (mezcla de
divisas) ya no aplica — mantenerla afuera por la razón de
diferenciación visual (torre vs. dona) tampoco se sostenía sola, según
quedó documentado en "Mismo gráfico de torres en las dos vistas": dos
tipos de gráfico para el mismo dato generaba más inconsistencia que
claridad. Ahora que Inicio agrega TODOS los viajes y el detalle de
viaje muestra solo UNO, el título de cada sección ya comunica esa
diferencia sin necesitar dos lenguajes visuales — la dona en Inicio no
reintroduce la confusión que motivó cambiarla por la torre en su
momento, porque esa decisión fue sobre uniformar el tipo de gráfico
entre pantallas, no sobre preferir la torre en sí.

## Historial se fusiona con Mis viajes: eliminaba la redundancia de mostrar viajes cerrados en 2 pantallas

**Problema:** al agregar "Mis viajes" (con sus pestañas Todos/Activos/
Cerrados) quedaron dos pantallas mostrando lo mismo: la pestaña
"Cerrados" de Mis viajes y la pantalla de Historial eran, en esencia,
la misma lista de viajes cerrados con el mismo componente de card,
solo que Historial además traía 4 KPIs de resumen (Viajes realizados,
Gasto total, Promedio por viaje, Presupuesto cumplido) que "Cerrados"
no tenía. Dos entradas de sidebar para llegar al mismo tipo de dato es
justo la clase de redundancia que confunde más de lo que ayuda.

**Decisión:** se elimina la pantalla de Historial (ruta, ítem de
sidebar, componente) y sus 4 KPIs se mueven a Mis viajes, debajo del
buscador y arriba de las pestañas — pero ya no fijos a "cerrados": se
recalculan sobre el subconjunto de viajes de la pestaña activa
(Todos/Activos/Cerrados). La pestaña "Cerrados" reproduce exactamente
lo que Historial mostraba antes (mismos viajes, mismas 4 KPIs con los
mismos valores), así que no se pierde ninguna vista que existiera
antes — se llega a ella por pestaña en vez de por otra pantalla. El
label de la primera KPI se ajusta según la pestaña ("Viajes
realizados" solo en Cerrados, "Viajes" en Todos/Activos, porque
"realizados" no tiene sentido para un viaje que sigue activo). Un link
o bookmark viejo a `/historial` redirige automáticamente a
`/viajes?tab=closed` (`router.js`), en vez de dar página en blanco.

**Por qué:** menos pantallas para el mismo dato reduce la carga
cognitiva de navegación sin quitarle nada al usuario — toda la
información que tenía Historial sigue disponible, solo que accesible
por pestaña en el mismo lugar donde ya puede ver todos sus viajes.
Recalcular los KPIs por pestaña (en vez de dejarlos fijos a
"cerrados") es más útil que el comportamiento anterior: ahora el
usuario también puede ver "¿cuánto gasté en promedio en mis viajes
activos?" sin tener que hacer la cuenta a mano.

## Compartir viaje por WhatsApp en vez de exportar PDF

**Problema:** "Exportar PDF por viaje" estaba planeado como funcionalidad
pendiente, pero implementarla bien requiere una librería de generación
de PDF en el cliente (o un endpoint serverless que arme el documento) y
definir desde cero un layout de impresión — presupuesto de tiempo real
antes de la entrega del martes, para un caso de uso (guardar/imprimir
un PDF) que no es el más natural: cuando alguien quiere avisarle a un
acompañante de viaje cómo va el presupuesto, lo típico no es enviarle
un archivo adjunto, es escribirle.

**Decisión:** se descarta el PDF y se reemplaza por un botón "Compartir
por WhatsApp" en el detalle de viaje, junto al de Google Calendar y con
el mismo tratamiento visual (`.button-outline`). Abre
`https://wa.me/?text=` con un mensaje de texto plano armado con
`encodeURIComponent()` — nombre del viaje y rango de fechas,
presupuesto/gastado/restante en COP, el estado del semáforo **en texto
explícito** ("En rango"/"Cerca del límite"/"Presupuesto excedido", nunca
solo un emoji de color — misma regla de accesibilidad que ya aplica en
toda la app) y las 3 categorías con más gasto. Sin librerías nuevas, sin
backend: reusa `formatCurrency()` y el mismo `status` que ya calcula
`getBudgetStatus()` para el modal de "vas a superar el presupuesto",
nada de esa lógica se duplica.

**Por qué:** un link `wa.me` con texto prellenado resuelve el 90% del
valor de "compartir el estado del viaje con alguien" con una fracción
de la complejidad de generar y renderizar un PDF — mismo criterio que
ya se usó para "Agregar a Google Calendar" (link plano en vez de
integrar la API completa). Si más adelante hace falta un documento
formal descargable (ej. para un reembolso corporativo), ese es un caso
de uso distinto y más específico que sí justificaría volver a evaluar
un export a PDF — no es que la idea esté descartada para siempre, es
que no es la prioridad para esta entrega.

<!--
Próxima decisión: agregar acá cuando surja, con el mismo formato:

## [Nombre de la decisión]
**Problema:** [qué situación o riesgo se detectó]
**Decisión:** [qué se implementó]
**Por qué:** [razonamiento de producto/UX]
-->
