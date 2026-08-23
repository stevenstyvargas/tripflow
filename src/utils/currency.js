// Utilidades de divisas para v1: COP, USD, EUR.
// Las tasas se cargan una vez y se cachean; ver docs/design-system.md
// para la decisión de usar una API pública vs. tasas fijas para la demo.

export const SUPPORTED_CURRENCIES = ["COP", "USD", "EUR"];

const CURRENCY_LOCALES = {
  COP: "es-CO",
  USD: "en-US",
  EUR: "de-DE",
};

// Sin decimales en ninguna divisa: es solo para mostrar en pantalla, los
// montos se siguen guardando y sumando con precisión completa (ver
// store.js/status.js) — esto no redondea nada salvo lo que el usuario ve.
const CURRENCY_FORMATTERS = {
  COP: new Intl.NumberFormat(CURRENCY_LOCALES.COP, { style: "currency", currency: "COP", maximumFractionDigits: 0 }),
  USD: new Intl.NumberFormat(CURRENCY_LOCALES.USD, { style: "currency", currency: "USD", maximumFractionDigits: 0 }),
  EUR: new Intl.NumberFormat(CURRENCY_LOCALES.EUR, { style: "currency", currency: "EUR", maximumFractionDigits: 0 }),
};

export function formatCurrency(amount, currency) {
  const formatter = CURRENCY_FORMATTERS[currency];
  if (!formatter) throw new Error(`Divisa no soportada: ${currency}`);
  return formatter.format(amount);
}

// Formato en vivo para inputs de monto (Presupuesto límite, Monto de
// gasto): mismos locales que formatCurrency, para que el separador de
// miles sea el mismo que se ve luego en el resto de la app, pero sin
// símbolo ni decimales — mientras el usuario escribe, el valor es un
// entero en construcción, no un monto ya cerrado. v1 no soporta
// centavos en estos campos (ver docs/product-decisions.md).
const AMOUNT_INPUT_FORMATTERS = Object.fromEntries(
  Object.entries(CURRENCY_LOCALES).map(([currency, locale]) => [
    currency,
    new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }),
  ])
);

/**
 * Quita todo lo que no sea dígito. Convierte un valor formateado
 * ("4.000.000") o crudo de un input a solo dígitos ("4000000").
 * @param {string} value
 */
export function parseAmountInput(value) {
  return (value ?? "").replace(/\D/g, "");
}

/**
 * Formatea dígitos crudos con el separador de miles de la divisa dada,
 * para mostrar mientras el usuario escribe un monto.
 * @param {string} rawDigits solo dígitos, sin separadores (ver parseAmountInput)
 * @param {string} currency
 */
export function formatAmountInput(rawDigits, currency) {
  if (!rawDigits) return "";
  const formatter = AMOUNT_INPUT_FORMATTERS[currency] ?? AMOUNT_INPUT_FORMATTERS.COP;
  return formatter.format(Number(rawDigits));
}

/**
 * Formatea un monto ya guardado (número o string) para precargar un
 * input de monto al editar — mismo resultado que si el usuario lo
 * hubiera tecleado.
 * @param {number | string | undefined | null} amount
 * @param {string} currency
 */
export function formatStoredAmount(amount, currency) {
  if (amount === undefined || amount === null || amount === "") return "";
  return formatAmountInput(parseAmountInput(String(amount)), currency);
}

// TODO: reemplazar por tasas reales (API o snapshot fijo documentado)
const FIXED_RATES_TO_COP = {
  COP: 1,
  USD: 4000,
  EUR: 4300,
};

// Sin uso actual en la UI: Inicio dejó de normalizar KPIs a una sola
// divisa (ver docs/product-decisions.md — sumar divisas distintas
// inflaba los totales). Se deja porque una futura "vista consolidada
// opcional" (roadmap, para cuando se soporten más divisas) sí la
// necesitaría.
export function convert(amount, from, to) {
  if (from === to) return amount;
  const amountInCOP = amount * FIXED_RATES_TO_COP[from];
  return amountInCOP / FIXED_RATES_TO_COP[to];
}
