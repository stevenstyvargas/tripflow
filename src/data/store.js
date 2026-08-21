// Estado central de Tripflow. v1 = un solo usuario, sin backend:
// todo se persiste en localStorage. El shape de datos ya está pensado
// para que en una futura versión (perfil compartido) sea fácil migrar
// a un backend real sin rediseñar el modelo.

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

export function getTrips() {
  return state.trips;
}

export function getExpensesByTrip(tripId) {
  return state.expenses.filter((e) => e.tripId === tripId);
}

export function addTrip(trip) {
  state.trips.push(trip);
  saveState(state);
}

export function addExpense(expense) {
  state.expenses.push(expense);
  saveState(state);
}

export function getTripTotal(tripId) {
  return getExpensesByTrip(tripId).reduce((sum, e) => sum + e.amount, 0);
}
