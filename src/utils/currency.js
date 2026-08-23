// Formato de moneda — v1 simplificada a una sola divisa: COP (peso
// colombiano). Antes soportaba COP/USD/EUR con selector y conversión
// entre divisas; ver docs/product-decisions.md para el porqué de la
// simplificación.

const CURRENCY_FORMATTER = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

/** Formatea un monto en COP, con el código de divisa explícito al final. */
export function formatCurrency(amount) {
  return `${CURRENCY_FORMATTER.format(amount)} COP`;
}

// Formato en vivo para inputs de monto (Presupuesto límite, Monto de
// gasto): mismo locale que formatCurrency, para que el separador de
// miles sea el mismo que se ve luego en el resto de la app, pero sin
// símbolo ni decimales — mientras el usuario escribe, el valor es un
// entero en construcción, no un monto ya cerrado. v1 no soporta
// centavos en estos campos (ver docs/product-decisions.md).
const AMOUNT_INPUT_FORMATTER = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });

/**
 * Quita todo lo que no sea dígito. Convierte un valor formateado
 * ("4.000.000") o crudo de un input a solo dígitos ("4000000").
 * @param {string} value
 */
export function parseAmountInput(value) {
  return (value ?? "").replace(/\D/g, "");
}

/**
 * Formatea dígitos crudos con el separador de miles, para mostrar
 * mientras el usuario escribe un monto.
 * @param {string} rawDigits solo dígitos, sin separadores (ver parseAmountInput)
 */
export function formatAmountInput(rawDigits) {
  if (!rawDigits) return "";
  return AMOUNT_INPUT_FORMATTER.format(Number(rawDigits));
}

/**
 * Formatea un monto ya guardado (número o string) para precargar un
 * input de monto al editar — mismo resultado que si el usuario lo
 * hubiera tecleado.
 * @param {number | string | undefined | null} amount
 */
export function formatStoredAmount(amount) {
  if (amount === undefined || amount === null || amount === "") return "";
  return formatAmountInput(parseAmountInput(String(amount)));
}
