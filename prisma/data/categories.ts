// Jerarquia de categorias: Departamento -> Categoria -> Subcategoria (con codigo)
// parentId referencia el id de otro item de esta misma lista.

export type SeedCategory = {
  id: string
  name: string
  slug: string
  level: 'DEPARTMENT' | 'CATEGORY' | 'SUBCATEGORY'
  code: string | null
  parentId: string | null
}

type SeedCategoryInput = Omit<SeedCategory, 'code' | 'parentId'> & {
  code?: string
  parentId?: string
}

const rawCategories: SeedCategoryInput[] = [
  // Departamentos
  { id: "dep-abarrotes-secos", name: "Abarrotes secos", slug: "abarrotes-secos", level: "DEPARTMENT" },
  { id: "dep-bebidas", name: "Bebidas", slug: "bebidas", level: "DEPARTMENT" },
  { id: "dep-limpieza", name: "Limpieza", slug: "limpieza", level: "DEPARTMENT" },

  // Categorias
  { id: "cat-arroz", name: "Arroz", slug: "arroz", level: "CATEGORY", parentId: "dep-abarrotes-secos" },
  { id: "cat-aceites", name: "Aceites", slug: "aceites", level: "CATEGORY", parentId: "dep-abarrotes-secos" },
  { id: "cat-aguas", name: "Aguas", slug: "aguas", level: "CATEGORY", parentId: "dep-bebidas" },
  { id: "cat-refrescos", name: "Refrescos", slug: "refrescos", level: "CATEGORY", parentId: "dep-bebidas" },
  { id: "cat-hogar", name: "Hogar", slug: "hogar", level: "CATEGORY", parentId: "dep-limpieza" },

  // Subcategorias (con codigo)
  { id: "sub-arroz-blanco", name: "Arroz blanco", slug: "arroz-blanco", level: "SUBCATEGORY", code: "CAT-0001", parentId: "cat-arroz" },
  { id: "sub-arroz-integral", name: "Arroz integral", slug: "arroz-integral", level: "SUBCATEGORY", code: "CAT-0002", parentId: "cat-arroz" },
  { id: "sub-arroz-precocido", name: "Arroz precocido", slug: "arroz-precocido", level: "SUBCATEGORY", code: "CAT-0003", parentId: "cat-arroz" },
  { id: "sub-arroz-saborizado", name: "Arroz saborizado", slug: "arroz-saborizado", level: "SUBCATEGORY", code: "CAT-0004", parentId: "cat-arroz" },
  { id: "sub-arroz-especial", name: "Arroz especial", slug: "arroz-especial", level: "SUBCATEGORY", code: "CAT-0005", parentId: "cat-arroz" },
  { id: "sub-aceite-vegetal", name: "Aceite vegetal", slug: "aceite-vegetal", level: "SUBCATEGORY", code: "CAT-0006", parentId: "cat-aceites" },
  { id: "sub-agua-mineral", name: "Agua mineral", slug: "agua-mineral", level: "SUBCATEGORY", code: "CAT-0007", parentId: "cat-aguas" },
  { id: "sub-refresco-cola", name: "Refresco de cola", slug: "refresco-cola", level: "SUBCATEGORY", code: "CAT-0008", parentId: "cat-refrescos" },
  { id: "sub-detergente", name: "Detergente", slug: "detergente", level: "SUBCATEGORY", code: "CAT-0009", parentId: "cat-hogar" },
  { id: "sub-jabon", name: "Jabon", slug: "jabon", level: "SUBCATEGORY", code: "CAT-0010", parentId: "cat-hogar" },
];

export const categories: SeedCategory[] = rawCategories.map((c) => ({
  ...c,
  code: c.code ?? null,
  parentId: c.parentId ?? null,
}));
