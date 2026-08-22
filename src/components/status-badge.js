import { icon } from "../utils/icons.js";
import { getStatusMeta } from "../utils/status.js";

/**
 * Ícono + texto + color para un estado del semáforo. Nunca solo color.
 * @param {"ok" | "warning" | "danger"} status
 */
export function statusBadge(status) {
  const meta = getStatusMeta(status);
  return `
    <span class="status-badge status-badge-${status}">
      ${icon(meta.icon)}
      <span>${meta.label}</span>
    </span>
  `;
}
