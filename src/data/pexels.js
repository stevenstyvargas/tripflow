// Fotos sugeridas del destino (components/trip-form.js), vía Pexels
// Search API — llamada directo desde el cliente con
// VITE_PEXELS_API_KEY (ver .env.example), sin función serverless de
// por medio: a diferencia de api/scan-receipt.js (que sí oculta una
// key de IA más sensible/costosa), el plan gratuito de Pexels ya está
// pensado para consumirse desde el navegador. Si la key no está
// configurada, la request falla (red, CORS, rate limit) o no hay
// resultados, se degrada a `null` — quien llame a esto decide caer al
// input de URL manual, nunca se lanza un error que bloquee el
// formulario.

const PEXELS_SEARCH_URL = "https://api.pexels.com/v1/search";

/**
 * @param {string} query
 * @returns {Promise<{ id: number, thumbnailUrl: string, url: string }[] | null>}
 *   `null` si no hay key configurada, la request falla, o no hay resultados.
 */
export async function searchDestinationPhotos(query) {
  const apiKey = import.meta.env.VITE_PEXELS_API_KEY;
  if (!apiKey || !query) return null;

  let response;
  try {
    response = await fetch(`${PEXELS_SEARCH_URL}?query=${encodeURIComponent(query)}&per_page=3`, {
      headers: { Authorization: apiKey },
    });
  } catch {
    return null;
  }

  if (!response.ok) return null;

  let data;
  try {
    data = await response.json();
  } catch {
    return null;
  }

  const photos = (data?.photos ?? [])
    .map((photo) => ({
      id: photo.id,
      thumbnailUrl: photo.src?.medium,
      url: photo.src?.large ?? photo.src?.medium,
    }))
    .filter((photo) => photo.thumbnailUrl && photo.url);

  return photos.length > 0 ? photos : null;
}
