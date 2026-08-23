// Categorías de gasto para el desglose por categoría (dona en Inicio) y
// el futuro flujo de registro de gastos. El color de cada una vive en
// tokens.css como --color-category-*, separado del semáforo de estado.

export const EXPENSE_CATEGORIES = [
  { id: "transporte", label: "Transporte", icon: "car", colorVar: "--color-category-transporte" },
  { id: "comida", label: "Comida", icon: "utensils", colorVar: "--color-category-comida" },
  { id: "hotel", label: "Hotel", icon: "hotel", colorVar: "--color-category-hotel" },
  { id: "imprevistos", label: "Imprevistos", icon: "receipt", colorVar: "--color-category-imprevistos" },
  { id: "compras", label: "Compras", icon: "shopping-bag", colorVar: "--color-category-compras" },
  { id: "otros", label: "Otros", icon: "package", colorVar: "--color-category-otros" },
];
