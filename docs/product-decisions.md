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

<!--
Próxima decisión: agregar acá cuando surja, con el mismo formato:

## [Nombre de la decisión]
**Problema:** [qué situación o riesgo se detectó]
**Decisión:** [qué se implementó]
**Por qué:** [razonamiento de producto/UX]
-->
