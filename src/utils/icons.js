// Iconografía Lucide (SVG estáticos, sin runtime JS ni emojis placeholder).
// El tamaño/color de cada ícono se controla por CSS (.icon + currentColor),
// nunca hardcodeado aquí.

import home from "lucide-static/icons/home.svg?raw";
import bell from "lucide-static/icons/bell.svg?raw";
import history from "lucide-static/icons/history.svg?raw";
import plane from "lucide-static/icons/plane.svg?raw";
import wallet from "lucide-static/icons/wallet.svg?raw";
import piggyBank from "lucide-static/icons/piggy-bank.svg?raw";
import user from "lucide-static/icons/user.svg?raw";
import logOut from "lucide-static/icons/log-out.svg?raw";
import mapPin from "lucide-static/icons/map-pin.svg?raw";
import calendar from "lucide-static/icons/calendar.svg?raw";
import car from "lucide-static/icons/car.svg?raw";
import utensils from "lucide-static/icons/utensils.svg?raw";
import hotel from "lucide-static/icons/hotel.svg?raw";
import receipt from "lucide-static/icons/receipt.svg?raw";
import plus from "lucide-static/icons/plus.svg?raw";
import circleCheck from "lucide-static/icons/circle-check.svg?raw";
import alertTriangle from "lucide-static/icons/alert-triangle.svg?raw";
import alertOctagon from "lucide-static/icons/alert-octagon.svg?raw";
import lock from "lucide-static/icons/lock.svg?raw";

const ICONS = {
  home,
  bell,
  history,
  plane,
  wallet,
  "piggy-bank": piggyBank,
  user,
  "log-out": logOut,
  "map-pin": mapPin,
  calendar,
  car,
  utensils,
  hotel,
  receipt,
  plus,
  "circle-check": circleCheck,
  "alert-triangle": alertTriangle,
  "alert-octagon": alertOctagon,
  lock,
};

/**
 * Markup de un ícono Lucide listo para insertar en innerHTML.
 * @param {keyof typeof ICONS} name
 * @param {string} [extraClass]
 */
export function icon(name, extraClass = "") {
  const svg = ICONS[name];
  if (!svg) throw new Error(`Ícono no encontrado: ${name}`);
  return svg.replace('class="lucide', `class="icon${extraClass ? ` ${extraClass}` : ""} lucide`);
}
