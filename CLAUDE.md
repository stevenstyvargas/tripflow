# Tripflow — Contexto del proyecto

Webapp para controlar presupuesto de viaje. Reto técnico para el proceso
de Technical Product Designer en Alegra.

## Stack
- JS vanilla (ES modules) + Vite como build tool — sin frameworks, sin UI kits
- CSS con design tokens propios en `src/styles/tokens.css`
- Autenticación: Firebase Auth con Google (`src/data/auth.js`) — sin
  contraseñas propias que gestionar
- Persistencia: Firestore, un documento por usuario autenticado
  (`users/{uid}/trips/{tripId}/expenses/{expenseId}`, ver `src/data/store.js`)
- Config de Firebase vía variables de entorno `VITE_FIREBASE_*`
  (`.env`, no versionado — ver `.env.example`); reglas de seguridad en
  `firestore.rules`
- Deploy: Vercel, con dominio propio (DNS apuntando desde Namecheap) —
  las mismas variables `VITE_FIREBASE_*` deben configurarse ahí

## Alcance v1 (no expandir sin confirmar conmigo)
- 1 perfil (individual) autenticado con Google — el perfil
  compartido/pareja va a roadmap, NO a v1
- 3 divisas: COP, USD, EUR — otras divisas van a roadmap
- 3 funcionalidades core: dashboard de gastos, creación de viaje con
  presupuesto límite, registro de gastos
- Alertas cuando el gasto se acerca/excede el límite
- Responsive real (desktop + mobile), PWA instalable
- Bonus opcional (solo si sobra tiempo): escaneo de recibos con IA vía
  función serverless en `api/scan-receipt.js` — el usuario SIEMPRE
  confirma/edita antes de guardar, nunca se guarda automático

> Actualizado 2026-08-21: se agregó Firebase Auth (Google) + Firestore
> como backend real, reemplazando el localStorage-only planteado
> originalmente. Decisión confirmada explícitamente, ver `docs/ai-process.md`.

## Reglas de trabajo
- Haz commits pequeños y frecuentes que reflejen el proceso real
  (el reto evalúa el historial de commits, no solo el resultado final)
- No introduzcas UI kits genéricos ni componentes prefabricados —
  todo se diseña desde cero usando los tokens de `src/styles/tokens.css`
- Cada vez que uses IA para generar algo, anota en `docs/ai-process.md`
  qué se pidió y qué se ajustó manualmente

## Documentación de referencia (leer antes de tocar UI o branding)
- `docs/branding.md` — sistema de color, tipografía y logo con su justificación
- `docs/design-system.md` — tokens, componentes, estados
- `docs/research.md` — referencias revisadas (ej. Tickelia)
- `README.md` — visión general, estructura, cómo correr el proyecto

Responde siempre en español.