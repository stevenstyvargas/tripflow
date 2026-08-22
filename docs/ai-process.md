# Proceso con IA — Tripflow

> El reto pide documentar qué se le pidió a la IA y qué se ajustó
> manualmente. Este archivo se va llenando durante el desarrollo,
> no se reconstruye al final.

## Registro

| Fecha | Qué le pedí | Qué ajusté yo | Por qué |
|---|---|---|---|
| 2026-08-20 | Leer CLAUDE.md, README.md y docs/, y armar la lógica base del store de datos y el flujo de creación de un viaje (nombre, presupuesto límite, divisa) | Revisé el `store.js` generado: validación de nombre/presupuesto/divisa en `createTrip`, y que `getTrip`/`getTrips` mantuvieran el shape ya pensado para migrar a backend. En `new-trip.js` confirmé que el error de validación se muestra en el formulario en vez de solo lanzar la excepción | El store es la base de todo lo demás (dashboard, gastos); prefiero que la validación viva ahí y no repetirla en cada página |
| 2026-08-21 | Instalar el SDK de Firebase, inicializarlo con mi config del proyecto (`tripflow-3d2ad`), e implementar login con Google (Fase 2) + persistencia en Firestore (Fase 3), reemplazando localStorage. Esto expande el alcance v1 original ("sin backend"), documentado en un prompt maestro externo al repo | Antes de tocar código, la IA señaló que este cambio contradice `CLAUDE.md` ("sin backend", "no expandir sin confirmar") y no encontró el prompt maestro en el repo — confirmé el cambio de alcance explícitamente. Pedí que la config de Firebase no quedara hardcodeada en el código versionado: se movió a `.env` (gitignorado) con `.env.example` como plantilla. Revisé el modelo de datos en Firestore (`users/{uid}/trips/{tripId}/expenses/{expenseId}`, con IDs autogenerados por Firestore en vez de `crypto.randomUUID()`) y agregué `firestore.rules` para que cada usuario solo pueda leer/escribir sus propios documentos | El SDK de Firebase es una dependencia externa real (no un UI kit visual, así que no choca con esa regla), pero sí es un cambio de arquitectura que requería mi confirmación explícita antes de ejecutarse |

## Herramientas usadas

- Claude Code — desarrollo del repo local, commits
- _(agregar otras si aplica)_
