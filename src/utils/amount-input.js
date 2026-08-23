// Conecta un <input type="text"> a formato en vivo de monto (separador
// de miles mientras se escribe). El truco central es que el cursor se
// sigue por cantidad de dígitos antes de él, no por posición de
// caracter — porque el separador se inserta/corre en cada tecla, así
// que un índice de caracter fijo saltaría al lugar equivocado.

import { formatAmountInput, parseAmountInput } from "./currency.js";

function countDigitsBefore(value, index) {
  return value.slice(0, index).replace(/\D/g, "").length;
}

function indexAfterDigitCount(value, digitCount) {
  if (digitCount <= 0) return 0;
  let seen = 0;
  for (let i = 0; i < value.length; i++) {
    if (/\d/.test(value[i])) {
      seen += 1;
      if (seen === digitCount) return i + 1;
    }
  }
  return value.length;
}

/** @param {HTMLInputElement} input */
export function bindAmountInput(input) {
  input.addEventListener("input", () => {
    const caret = input.selectionStart ?? input.value.length;
    const digitsBeforeCaret = countDigitsBefore(input.value, caret);

    input.value = formatAmountInput(parseAmountInput(input.value));

    const newCaret = indexAfterDigitCount(input.value, digitsBeforeCaret);
    input.setSelectionRange(newCaret, newCaret);
  });
}

/** Número real (sin separadores) que contiene un input de monto, para guardar o calcular. */
export function readAmountInput(input) {
  const raw = parseAmountInput(input.value);
  return raw ? Number(raw) : NaN;
}
