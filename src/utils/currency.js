// Utilidades de divisas para v1: COP, USD, EUR.
// Las tasas se cargan una vez y se cachean; ver docs/design-system.md
// para la decisión de usar una API pública vs. tasas fijas para la demo.

export const SUPPORTED_CURRENCIES = ["COP", "USD", "EUR"];

const CURRENCY_FORMATTERS = {
  COP: new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }),
  USD: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }),
  EUR: new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }),
};

export function formatCurrency(amount, currency) {
  const formatter = CURRENCY_FORMATTERS[currency];
  if (!formatter) throw new Error(`Divisa no soportada: ${currency}`);
  return formatter.format(amount);
}

// TODO: reemplazar por tasas reales (API o snapshot fijo documentado)
const FIXED_RATES_TO_COP = {
  COP: 1,
  USD: 4000,
  EUR: 4300,
};

export function convert(amount, from, to) {
  if (from === to) return amount;
  const amountInCOP = amount * FIXED_RATES_TO_COP[from];
  return amountInCOP / FIXED_RATES_TO_COP[to];
}
