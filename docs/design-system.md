# Design System — Tripflow

> Pensado para que un equipo de diseño/desarrollo pueda escalar la app
> a futuro (más divisas, perfil compartido, etc.) sin romper consistencia.

## Tokens

Todos los valores viven en `src/styles/tokens.css` como variables CSS.
Ningún componente debe usar un color, tamaño o radio "hardcodeado" —
siempre referencia al token.

## Componentes

| Componente | Estados | Notas |
|---|---|---|
| Botón primario | default / hover / focus / disabled | |
| Input de monto | default / focus / error | Debe soportar formato de las 3 divisas |
| Card de viaje | default / cerca del límite / excedido | Ligado a las alertas de presupuesto |
| Badge de divisa | — | |

## Alertas de presupuesto

_(Definir: a partir de qué % del límite se activa el estado "cerca del
límite" — ej. 80% — y qué cambia visualmente en cada estado)_

## Roadmap de escalabilidad

- Perfil compartido / pareja con reparto de gastos
- Divisas adicionales (MXN, y otras de Latinoamérica)
- Escaneo de recibos con IA (ver `docs/ai-process.md`)
