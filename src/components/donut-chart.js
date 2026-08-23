// Gráfico de dona en SVG puro (stroke-dasharray por segmento) — sin
// librerías de charting, siguiendo la regla de diseñar todo desde cero.
// Usado en Inicio para el gasto por categoría de TODOS los viajes
// activos: solo es matemáticamente válido sumar montos entre viajes
// porque la app usa una única divisa (COP) — ver
// docs/product-decisions.md.

const RADIUS = 60;
const STROKE = 24;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * @param {{ label: string, value: number, color: string }[]} segments
 */
export function donutChart(segments) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  if (total <= 0) {
    return `
      <div class="donut-chart donut-chart-empty">
        <svg viewBox="0 0 160 160" width="160" height="160" role="img" aria-label="Sin gastos registrados todavía">
          <circle cx="80" cy="80" r="${RADIUS}" fill="none" stroke="var(--color-text-muted)" stroke-width="${STROKE}" opacity="0.15" />
        </svg>
        <p class="empty-state">Aún no hay gastos registrados en esta categoría.</p>
      </div>
    `;
  }

  let offset = 0;
  const visibleSegments = segments.filter((s) => s.value > 0);

  const arcs = visibleSegments
    .map((s) => {
      const dash = (s.value / total) * CIRCUMFERENCE;
      const arc = `<circle
        cx="80" cy="80" r="${RADIUS}" fill="none"
        stroke="${s.color}" stroke-width="${STROKE}"
        stroke-dasharray="${dash} ${CIRCUMFERENCE - dash}"
        stroke-dashoffset="${-offset}"
        transform="rotate(-90 80 80)"
      />`;
      offset += dash;
      return arc;
    })
    .join("");

  const legend = visibleSegments
    .map(
      (s) => `
      <li class="donut-legend-item">
        <span class="donut-legend-swatch" style="background:${s.color}"></span>
        <span>${s.label}</span>
      </li>
    `
    )
    .join("");

  return `
    <div class="donut-chart">
      <svg viewBox="0 0 160 160" width="160" height="160" role="img" aria-label="Gasto por categoría">
        ${arcs}
      </svg>
      <ul class="donut-legend">${legend}</ul>
    </div>
  `;
}
