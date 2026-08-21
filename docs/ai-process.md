# Proceso con IA — Tripflow

> El reto pide documentar qué se le pidió a la IA y qué se ajustó
> manualmente. Este archivo se va llenando durante el desarrollo,
> no se reconstruye al final.

## Registro

| Fecha | Qué le pedí | Qué ajusté yo | Por qué |
|---|---|---|---|
| 2026-08-20 | Leer CLAUDE.md, README.md y docs/, y armar la lógica base del store de datos y el flujo de creación de un viaje (nombre, presupuesto límite, divisa) | Revisé el `store.js` generado: validación de nombre/presupuesto/divisa en `createTrip`, y que `getTrip`/`getTrips` mantuvieran el shape ya pensado para migrar a backend. En `new-trip.js` confirmé que el error de validación se muestra en el formulario en vez de solo lanzar la excepción | El store es la base de todo lo demás (dashboard, gastos); prefiero que la validación viva ahí y no repetirla en cada página |

## Herramientas usadas

- Claude Code — desarrollo del repo local, commits
- _(agregar otras si aplica)_
