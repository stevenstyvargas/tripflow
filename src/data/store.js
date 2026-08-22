// Estado central de Tripflow. Fase 3 del prompt maestro: persistencia
// en Firestore, un documento de viajes por usuario autenticado
// (users/{uid}/trips/{tripId}/expenses/{expenseId}).

import { collection, addDoc, updateDoc, doc, getDocs } from "firebase/firestore";
import { SUPPORTED_CURRENCIES } from "../utils/currency.js";
import { db } from "./firebase.js";

export const TRIP_STATUS = { ACTIVE: "active", CLOSED: "closed" };

/**
 * @typedef {Object} Trip
 * @property {string} id
 * @property {string} name
 * @property {string} currency      // "COP" | "USD" | "EUR"
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
 * @property {string} currency
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

export function getActiveTrips() {
  return state.trips.filter((t) => t.status !== TRIP_STATUS.CLOSED);
}

export function getClosedTrips() {
  return state.trips.filter((t) => t.status === TRIP_STATUS.CLOSED);
}

export function getTrip(tripId) {
  return state.trips.find((t) => t.id === tripId);
}

export function getExpensesByTrip(tripId) {
  return state.expenses.filter((e) => e.tripId === tripId);
}

/**
 * Crea y persiste un viaje nuevo en Firestore.
 * @param {{ name: string, budgetLimit: number, currency: string, startDate?: string, endDate?: string, photoUrl?: string }} data
 * @returns {Promise<Trip>} el viaje creado, con su id asignado
 */
export async function createTrip({
  name,
  budgetLimit,
  currency,
  startDate = "",
  endDate = "",
  photoUrl = "",
}) {
  validateTripInput({ name, budgetLimit, currency });

  const tripData = {
    name: name.trim(),
    budgetLimit,
    currency,
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

/** Marca un viaje como cerrado; pasa a mostrarse en Historial. */
export async function closeTrip(tripId) {
  await updateDoc(doc(db, "users", currentUid, "trips", tripId), {
    status: TRIP_STATUS.CLOSED,
  });
  const trip = getTrip(tripId);
  if (trip) trip.status = TRIP_STATUS.CLOSED;
}

/**
 * @param {{ tripId: string, category: string, amount: number, currency: string, date: string, note: string }} expense
 */
export async function addExpense(expense) {
  const { tripId, ...data } = expense;
  const docRef = await addDoc(expensesRef(currentUid, tripId), data);
  const saved = { id: docRef.id, tripId, ...data };
  state.expenses.push(saved);
  return saved;
}

export function getTripTotal(tripId) {
  return getExpensesByTrip(tripId).reduce((sum, e) => sum + e.amount, 0);
}
