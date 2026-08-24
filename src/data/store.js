// Estado central de Tripflow. Fase 3 del prompt maestro: persistencia
// en Firestore, un documento de viajes por usuario autenticado
// (users/{uid}/trips/{tripId}/expenses/{expenseId}).

import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs } from "firebase/firestore";
import { EXPENSE_CATEGORIES } from "../utils/categories.js";
import { getBudgetStatus, STATUS } from "../utils/status.js";
import { db } from "./firebase.js";

export const TRIP_STATUS = { ACTIVE: "active", CLOSED: "closed" };

// v1 es de una sola divisa (COP) — ver docs/product-decisions.md. El
// campo `currency` se mantiene en los documentos por compatibilidad con
// datos existentes, pero ya no es seleccionable por el usuario.
const CURRENCY = "COP";

/**
 * @typedef {Object} Trip
 * @property {string} id
 * @property {string} name
 * @property {string} currency      // siempre "COP" en v1
 * @property {number} budgetLimit
 * @property {string} startDate
 * @property {string} endDate
 * @property {string} photoUrl      // opcional, foto grande del destino
 * @property {"active" | "closed"} status
 */

/**
 * @typedef {Object} Expense
 * @property {string} id
 * @property {string} tripId
 * @property {string} category
 * @property {number} amount
 * @property {string} currency      // siempre "COP" en v1
 * @property {string} date
 * @property {string} note
 */

let state = { trips: [], expenses: [] };
let currentUid = null;

function tripsRef(uid) {
  return collection(db, "users", uid, "trips");
}

function expensesRef(uid, tripId) {
  return collection(db, "users", uid, "trips", tripId, "expenses");
}

/**
 * Carga los viajes y gastos del usuario autenticado desde Firestore
 * hacia el estado en memoria. Se llama una vez por sesión, al hacer login.
 * @param {string} uid
 */
export async function initStore(uid) {
  currentUid = uid;

  const tripsSnap = await getDocs(tripsRef(uid));
  const trips = tripsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const expenses = [];
  for (const trip of trips) {
    const expensesSnap = await getDocs(expensesRef(uid, trip.id));
    expensesSnap.docs.forEach((d) =>
      expenses.push({ id: d.id, tripId: trip.id, ...d.data() })
    );
  }

  state = { trips, expenses };
}

/** Se llama al cerrar sesión, para no dejar datos del usuario anterior en memoria. */
export function clearStore() {
  currentUid = null;
  state = { trips: [], expenses: [] };
}

/**
 * Valida los datos de un viaje nuevo antes de guardarlo.
 * Lanza un Error con un mensaje apto para mostrar al usuario si algo falla.
 * @param {{ name: string, budgetLimit: number }} data
 */
function validateTripInput({ name, budgetLimit }) {
  if (!name || !name.trim()) {
    throw new Error("El viaje necesita un nombre.");
  }
  if (typeof budgetLimit !== "number" || Number.isNaN(budgetLimit) || budgetLimit <= 0) {
    throw new Error("El presupuesto límite debe ser un número mayor a 0.");
  }
}

export function getActiveTrips() {
  return state.trips.filter((t) => t.status !== TRIP_STATUS.CLOSED);
}

export function getClosedTrips() {
  return state.trips.filter((t) => t.status === TRIP_STATUS.CLOSED);
}

/** Todos los viajes del usuario, activos y cerrados — usado en Mis viajes. */
export function getAllTrips() {
  return state.trips;
}

export function getTrip(tripId) {
  return state.trips.find((t) => t.id === tripId);
}

export function getExpensesByTrip(tripId) {
  return state.expenses.filter((e) => e.tripId === tripId);
}

/**
 * Crea y persiste un viaje nuevo en Firestore.
 * @param {{ name: string, budgetLimit: number, startDate?: string, endDate?: string, photoUrl?: string }} data
 * @returns {Promise<Trip>} el viaje creado, con su id asignado
 */
export async function createTrip({
  name,
  budgetLimit,
  startDate = "",
  endDate = "",
  photoUrl = "",
}) {
  validateTripInput({ name, budgetLimit });

  const tripData = {
    name: name.trim(),
    budgetLimit,
    currency: CURRENCY,
    startDate,
    endDate,
    photoUrl: photoUrl.trim(),
    status: TRIP_STATUS.ACTIVE,
  };

  const docRef = await addDoc(tripsRef(currentUid), tripData);
  const trip = { id: docRef.id, ...tripData };
  state.trips.push(trip);
  return trip;
}

/**
 * Actualiza los datos de un viaje ya creado. No toca `status`: se usa
 * para editar nombre/presupuesto/fechas/foto, no para cerrar.
 * @param {string} tripId
 * @param {{ name: string, budgetLimit: number, startDate?: string, endDate?: string, photoUrl?: string }} data
 */
export async function updateTrip(tripId, { name, budgetLimit, startDate = "", endDate = "", photoUrl = "" }) {
  validateTripInput({ name, budgetLimit });

  const tripData = {
    name: name.trim(),
    budgetLimit,
    currency: CURRENCY,
    startDate,
    endDate,
    photoUrl: photoUrl.trim(),
  };

  await updateDoc(doc(db, "users", currentUid, "trips", tripId), tripData);
  const trip = getTrip(tripId);
  if (trip) Object.assign(trip, tripData);
  return trip;
}

/** Marca un viaje como cerrado; pasa a mostrarse en Historial. */
export async function closeTrip(tripId) {
  await updateDoc(doc(db, "users", currentUid, "trips", tripId), {
    status: TRIP_STATUS.CLOSED,
  });
  const trip = getTrip(tripId);
  if (trip) trip.status = TRIP_STATUS.CLOSED;
}

/**
 * Elimina un viaje de forma PERMANENTE, junto con todos sus gastos —
 * Firestore no borra subcolecciones solo al borrar el documento padre,
 * así que cada gasto se borra explícitamente antes/junto con el viaje
 * para no dejar gastos huérfanos en `expenses/`. Irreversible: solo se
 * llama tras confirmación explícita del usuario, y la UI que la invoca
 * (trip-detail.js) restringe esta acción a viajes ya "Finalizado" — ver
 * docs/product-decisions.md.
 * @param {string} tripId
 */
export async function deleteTrip(tripId) {
  const expenses = getExpensesByTrip(tripId);
  await Promise.all(
    expenses.map((expense) => deleteDoc(doc(db, "users", currentUid, "trips", tripId, "expenses", expense.id)))
  );
  await deleteDoc(doc(db, "users", currentUid, "trips", tripId));

  state.trips = state.trips.filter((t) => t.id !== tripId);
  state.expenses = state.expenses.filter((e) => e.tripId !== tripId);
}

/**
 * Valida los datos de un gasto nuevo antes de guardarlo.
 * Lanza un Error con un mensaje apto para mostrar al usuario si algo falla.
 * @param {{ category: string, amount: number, date: string }} data
 */
function validateExpenseInput({ category, amount, date }) {
  if (!EXPENSE_CATEGORIES.some((c) => c.id === category)) {
    throw new Error(`Categoría no soportada: ${category}`);
  }
  if (typeof amount !== "number" || Number.isNaN(amount) || amount <= 0) {
    throw new Error("El monto debe ser un número mayor a 0.");
  }
  if (!date) {
    throw new Error("La fecha del gasto es obligatoria.");
  }
}

/**
 * @param {{ tripId: string, category: string, amount: number, currency: string, date: string, note: string }} expense
 */
export async function addExpense(expense) {
  const { tripId, ...data } = expense;
  validateExpenseInput(data);
  const docRef = await addDoc(expensesRef(currentUid, tripId), data);
  const saved = { id: docRef.id, tripId, ...data };
  state.expenses.push(saved);
  return saved;
}

export function getTripTotal(tripId) {
  return getExpensesByTrip(tripId).reduce((sum, e) => sum + e.amount, 0);
}

/**
 * Viajes activos que cruzaron el umbral naranja (80%) o rojo (100%) del
 * presupuesto, con su status ya calculado — fuente única para la
 * pantalla de Alertas (que además ordena danger-primero) y el badge de
 * notificación sobre el ícono de campana (components/sidebar.js), para
 * que nunca muestren números distintos.
 * @returns {{ trip: Trip, status: "warning" | "danger" }[]}
 */
export function getTripAlerts() {
  return getActiveTrips()
    .map((trip) => ({ trip, status: getBudgetStatus(getTripTotal(trip.id), trip.budgetLimit) }))
    .filter(({ status }) => status !== STATUS.OK);
}

/**
 * Actualiza un gasto existente en Firestore y en el estado en memoria.
 * Mismo patrón de recálculo automático que addExpense/deleteExpense:
 * quien llama a render() después ve el total, semáforo, torre de
 * categorías y alertas ya actualizados, porque todos leen
 * state.expenses en vivo.
 * @param {string} expenseId
 * @param {{ tripId: string, category: string, amount: number, currency: string, date: string, note: string }} expense
 */
export async function updateExpense(expenseId, expense) {
  const { tripId, ...data } = expense;
  validateExpenseInput(data);

  const existing = state.expenses.find((e) => e.id === expenseId);
  if (!existing) throw new Error("Este gasto ya no existe.");

  await updateDoc(doc(db, "users", currentUid, "trips", existing.tripId, "expenses", expenseId), data);
  Object.assign(existing, data);
}

/**
 * Elimina un gasto de Firestore y del estado en memoria. El total del
 * viaje, el semáforo, la torre de categorías y las alertas se
 * recalculan solos la próxima vez que se rendericen: todos leen
 * `state.expenses` en vivo.
 * @param {string} expenseId
 */
export async function deleteExpense(expenseId) {
  const expense = state.expenses.find((e) => e.id === expenseId);
  if (!expense) return;

  await deleteDoc(doc(db, "users", currentUid, "trips", expense.tripId, "expenses", expenseId));
  state.expenses = state.expenses.filter((e) => e.id !== expenseId);
}
