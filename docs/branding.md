# Branding — Tripflow

> Documento vivo. Se completa en la fase de branding del proyecto.
> Cada decisión visual debe tener una justificación conectada al concepto
> de marca, no solo estética.

## Concepto de marca

Tripflow controla el *flujo* del dinero durante un viaje: cuánto entra
al presupuesto, cuánto sale en cada gasto, y qué tan cerca está el
límite. El navy transmite control/seriedad (es una app de plata), el
verde transmite "vas bien" — juntos arman el lenguaje de semáforo que
se usa en toda la app.

## Sistema de color

| Color | Hex | Rol | Por qué |
|---|---|---|---|
| Navy | `#001860` | Primario / marca | Nav activa, botones primarios, logo. Serio, de confianza — es plata. |
| Verde | `#A1D35B` | Acento / estado "en control" | Refuerza la idea de "vas bien" sin depender solo de color (siempre va con ícono + texto). |
| Naranja | `#F79711` | Estado "al borde del límite" (80–100%) | Advertencia, no alarma — todavía hay margen de acción. |
| Rojo | `#DC2E24` | Estado "límite superado" (>100%) | Alarma clara, reservado solo para excedidos. |
| `#F5F5F5` | — | Fondo | Neutro claro, deja que las cards (blancas) y el semáforo tengan protagonismo. |
| `#111111` | — | Texto | Casi negro, evita el negro puro para bajar el contraste duro. |

**Nota de accesibilidad:** el semáforo nunca se comunica solo con
color — siempre ícono (Lucide) + texto + color juntos. Los badges usan
un fondo tintado claro del color de estado con texto en un tono más
oscuro del mismo hue (`--color-status-*-text` en tokens.css), no el
color plano, para mantener contraste legible sobre fondo blanco.

La paleta de categorías de gasto (transporte/comida/hotel/imprevistos,
en el gráfico de dona) es intencionalmente distinta de la paleta del
semáforo — aunque reutiliza el navy y el verde, nunca se cruzan en el
mismo componente, para no hacerle pensar al usuario que una categoría
"está en alerta".

## Tipografía

- **Display y cuerpo:** Inter (Google Fonts) — legible en tamaños
  pequeños (montos, badges), con buen soporte de números tabulares
  para las cifras de presupuesto.

## Logo

Monograma "T" (navy, `--color-primary`) con un ícono de avión
(Lucide `plane`, en verde `--color-accent`) superpuesto en la esquina
superior derecha, rotado 45° simulando despegue. Implementado en CSS
puro (`.logo-mark` en `src/components/sidebar.js` + `base.css`), sin
depender de un archivo de imagen — es un primer paso razonable en
ausencia del archivo de Figma de referencia de Alegra; si aparece ese
archivo, se reemplaza aquí.

## Aplicación

- **Sidebar:** navegación fija (Inicio/Mis viajes/Alertas), solo logo y
  navegación — la cuenta (foto/nombre/email/cerrar sesión) vive en el
  menú de cuenta del header de cada página. Item activo con fondo navy.
- **Inicio:** KPIs arriba, dona de gasto por categoría, cards de viajes
  activos con foto de destino grande + badge de semáforo.
- **Alertas:** mismo semáforo que Inicio, listado de viajes que cruzaron
  80% o 100% del presupuesto.
- **Mis viajes:** todos los viajes del usuario, con KPIs de resumen y
  pestañas Todos/Activos/Cerrados (la pestaña Cerrados reemplaza a la
  antigua pantalla de Historial — ver `docs/product-decisions.md`).
