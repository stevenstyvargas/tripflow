// Toast breve, no bloqueante — confirma que un click "hizo algo" sin
// navegar ni abrir nada (usado hoy por los ítems de nav "Próximamente":
// Mis facturas, Calendario). A diferencia de confirm-modal.js, no
// requiere ninguna respuesta del usuario: se muestra y se cierra solo.

let hideTimeoutId = null;

export function showToast(message) {
  let toast = document.querySelector("#toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast";
    toast.setAttribute("role", "status");
    document.body.appendChild(toast);
  }

  toast.textContent = message;

  // Reinicia la animación si ya estaba visible (2 clicks seguidos):
  // quitar y volver a agregar la clase en el mismo tick no dispara la
  // transición de nuevo, hace falta forzar un reflow entre medio.
  toast.classList.remove("is-visible");
  void toast.offsetWidth;
  toast.classList.add("is-visible");

  clearTimeout(hideTimeoutId);
  hideTimeoutId = setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 2500);
}
