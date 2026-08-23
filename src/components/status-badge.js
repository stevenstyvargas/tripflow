import { icon } from "../utils/icons.js";
import { getStatusMeta } from "../utils/status.js";

/**
 * Ícono + texto + color para un estado del semáforo. Nunca solo color.
 * @param {"ok" | "warning" | "danger"} status
 * @param {string} [extraClass] ej. "status-badge-sm" para la barra de 40px del detalle de viaje
 */
export function statusBadge(status, extraClass = "") {
  const meta = getStatusMeta(status);
  return `
    <span class="status-badge status-badge-${status}${extraClass ? ` ${extraClass}` : ""}">
      ${icon(meta.icon)}
      <span>${meta.label}</span>
    </span>
  `;
}
