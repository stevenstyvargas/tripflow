// Estado central de Tripflow. v1 = un solo usuario, sin backend:
// todo se persiste en localStorage. El shape de datos ya está pensado
// para que en una futura versión (perfil compartido) sea fácil migrar
// a un backend real sin rediseñar el modelo.

import { SUPPORTED_CURRENCIES } from "../utils/currency.js";

const STORAGE_KEY = "tripflow:v1";

/**
 * @typedef {Object} Trip
 * @property {string} id
 * @property {string} name
 * @property {string} currency      // "COP" | "USD" | "EUR"
 * @property {number} budgetLimit
 * @property {string} startDate
 * @property {string} endDate
 */

/**
 * @typedef {Object} Expense
 * @property {string} id
 * @property {string} tripId
 * @property {string} category
 * @property {number} amount
 * @property {string} currency
 * @property {string} date
 * @property {string} note
 */

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { trips: [], expenses: [] };
  } catch {
    return { trips: [], expenses: [] };
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = loadState();

function generateId() {
  return crypto.randomUUID();
}

/**
 * Valida los datos de un viaje nuevo antes de guardarlo.
 * Lanza un Error con un mensaje apto para mostrar al usuario si algo falla.
 * @param {{ name: string, budgetLimit: number, currency: string }} data
 */
function validateTripInput({ name, budgetLimit, currency }) {
  if (!name || !name.trim()) {
    throw new Error("El viaje necesita un nombre.");
  }
  if (typeof budgetLimit !== "number" || Number.isNaN(budgetLimit) || budgetLimit <= 0) {
    throw new Error("El presupuesto límite debe ser un número mayor a 0.");
  }
  if (!SUPPORTED_CURRENCIES.includes(currency)) {
    throw new Error(`Divisa no soportada: ${currency}`);
  }
}

export function getTrips() {
  return state.trips;
}

export function getTrip(tripId) {
  return state.trips.find((t) => t.id === tripId);
}

export function getExpensesByTrip(tripId) {
  return state.expenses.filter((e) => e.tripId === tripId);
}

/**
 * Crea y persiste un viaje nuevo.
 * @param {{ name: string, budgetLimit: number, currency: string, startDate?: string, endDate?: string }} data
 * @returns {Trip} el viaje creado, con su id asignado
 */
export function createTrip({ name, budgetLimit, currency, startDate = "", endDate = "" }) {
  validateTripInput({ name, budgetLimit, currency });

  const trip = {
    id: generateId(),
    name: name.trim(),
    budgetLimit,
    currency,
    startDate,
    endDate,
  };

  state.trips.push(trip);
  saveState(state);
  return trip;
}

export function addExpense(expense) {
  state.expenses.push(expense);
  saveState(state);
}

export function getTripTotal(tripId) {
  return getExpensesByTrip(tripId).reduce((sum, e) => sum + e.amount, 0);
}
