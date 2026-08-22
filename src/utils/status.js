// Semáforo de presupuesto — mismo criterio y significado en toda la app
// (Inicio, Alertas, Historial). Siempre se comunica con ícono + texto +
// color juntos, nunca solo color, por accesibilidad.

export const STATUS = {
  OK: "ok",
  WARNING: "warning",
  DANGER: "danger",
};

const STATUS_META = {
  [STATUS.OK]: {
    label: "En control",
    icon: "circle-check",
    colorVar: "--color-status-ok",
  },
  [STATUS.WARNING]: {
    label: "Al borde del límite",
    icon: "alert-triangle",
    colorVar: "--color-status-warning",
  },
  [STATUS.DANGER]: {
    label: "Límite superado",
    icon: "alert-octagon",
    colorVar: "--color-status-danger",
  },
};

/**
 * @param {number} spent
 * @param {number} budgetLimit
 * @returns {"ok" | "warning" | "danger"}
 */
export function getBudgetStatus(spent, budgetLimit) {
  if (!budgetLimit || budgetLimit <= 0) return STATUS.OK;
  const ratio = spent / budgetLimit;
  if (ratio > 1) return STATUS.DANGER;
  if (ratio >= 0.8) return STATUS.WARNING;
  return STATUS.OK;
}

export function getStatusMeta(status) {
  return STATUS_META[status];
}
