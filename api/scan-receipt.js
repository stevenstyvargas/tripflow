// Endpoint serverless (Vercel Functions) para el bonus de escaneo de recibos.
// Recibe una imagen, la envía a un modelo con visión, y devuelve
// { amount, date, merchant } como sugerencia — el usuario siempre
// confirma/edita antes de guardar el gasto (nunca se guarda automático).
//
// Placeholder: implementar solo si el tiempo alcanza (ver docs/ai-process.md).

export default async function handler(req, res) {
  res.status(501).json({ error: "No implementado todavía." });
}
