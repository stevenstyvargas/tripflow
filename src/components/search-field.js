// Campo de búsqueda con ícono de lupa, mismo estilo que los inputs de
// .field (borde/padding), usado en Inicio e Historial para filtrar
// viajes por nombre en vivo — el filtrado en sí vive en cada página
// (qué lista filtra y cómo la re-renderiza), este componente solo es
// el input.

import { icon } from "../utils/icons.js";

export function searchField({ id, placeholder = "Buscar destino o país...", label = "Buscar destino o país" }) {
  return `
    <div class="search-field">
      ${icon("search", "search-field-icon")}
      <input type="search" id="${id}" placeholder="${placeholder}" aria-label="${label}" />
    </div>
  `;
}
