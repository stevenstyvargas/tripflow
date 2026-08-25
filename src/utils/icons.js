// Iconografía Lucide (SVG estáticos, sin runtime JS ni emojis placeholder).
// El tamaño/color de cada ícono se controla por CSS (.icon + currentColor),
// nunca hardcodeado aquí.

import home from "lucide-static/icons/home.svg?raw";
import bell from "lucide-static/icons/bell.svg?raw";
import plane from "lucide-static/icons/plane.svg?raw";
import wallet from "lucide-static/icons/wallet.svg?raw";
import piggyBank from "lucide-static/icons/piggy-bank.svg?raw";
import logOut from "lucide-static/icons/log-out.svg?raw";
import calendar from "lucide-static/icons/calendar.svg?raw";
import car from "lucide-static/icons/car.svg?raw";
import utensils from "lucide-static/icons/utensils.svg?raw";
import hotel from "lucide-static/icons/hotel.svg?raw";
import receipt from "lucide-static/icons/receipt.svg?raw";
import plus from "lucide-static/icons/plus.svg?raw";
import circleCheck from "lucide-static/icons/circle-check.svg?raw";
import alertTriangle from "lucide-static/icons/alert-triangle.svg?raw";
import alertOctagon from "lucide-static/icons/alert-octagon.svg?raw";
import shoppingBag from "lucide-static/icons/shopping-bag.svg?raw";
import packageIcon from "lucide-static/icons/package.svg?raw";
import trash2 from "lucide-static/icons/trash-2.svg?raw";
import edit2 from "lucide-static/icons/edit-2.svg?raw";
import calculator from "lucide-static/icons/calculator.svg?raw";
import search from "lucide-static/icons/search.svg?raw";
import chevronDown from "lucide-static/icons/chevron-down.svg?raw";
import arrowRight from "lucide-static/icons/arrow-right.svg?raw";
import map from "lucide-static/icons/map.svg?raw";
import target from "lucide-static/icons/target.svg?raw";
import lock from "lucide-static/icons/lock.svg?raw";
import messageCircle from "lucide-static/icons/message-circle.svg?raw";
import menu from "lucide-static/icons/menu.svg?raw";
import x from "lucide-static/icons/x.svg?raw";
import users from "lucide-static/icons/users.svg?raw";
import barChart3 from "lucide-static/icons/bar-chart-3.svg?raw";
import layoutDashboard from "lucide-static/icons/layout-dashboard.svg?raw";
import arrowUpRight from "lucide-static/icons/arrow-up-right.svg?raw";
import banknote from "lucide-static/icons/banknote.svg?raw";
import languages from "lucide-static/icons/languages.svg?raw";
import scanLine from "lucide-static/icons/scan-line.svg?raw";

const ICONS = {
  home,
  bell,
  plane,
  wallet,
  "piggy-bank": piggyBank,
  "log-out": logOut,
  calendar,
  car,
  utensils,
  hotel,
  receipt,
  plus,
  "circle-check": circleCheck,
  "alert-triangle": alertTriangle,
  "alert-octagon": alertOctagon,
  "shopping-bag": shoppingBag,
  package: packageIcon,
  "trash-2": trash2,
  "edit-2": edit2,
  calculator,
  search,
  "chevron-down": chevronDown,
  "arrow-right": arrowRight,
  map,
  target,
  lock,
  "message-circle": messageCircle,
  menu,
  x,
  users,
  "bar-chart-3": barChart3,
  "layout-dashboard": layoutDashboard,
  "arrow-up-right": arrowUpRight,
  banknote,
  languages,
  "scan-line": scanLine,
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
