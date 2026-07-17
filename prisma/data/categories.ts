// Jerarquia de categorias: Departamento -> Categoria -> Subcategoria (con codigo)
// parentId referencia el id de otro item de esta misma lista.
// Los slugs se derivan con el MISMO esquema que usa el import de CSV
// (slugify de la ruta completa) para que sembrar e importar sean consistentes.
import { slugify } from "@/src/lib/category-utils"

export type SeedCategory = {
  id: string
  name: string
  slug: string
  level: 'DEPARTMENT' | 'CATEGORY' | 'SUBCATEGORY'
  code: string | null
  parentId: string | null
}

type SeedCategoryInput = {
  id: string
  name: string
  level: 'DEPARTMENT' | 'CATEGORY' | 'SUBCATEGORY'
  code?: string
  parentId?: string
}

const rawCategories: SeedCategoryInput[] = [
  // Departamentos
  { id: "dep-abarrotes-secos", name: "Abarrotes secos", level: "DEPARTMENT" },
  { id: "dep-bebidas", name: "Bebidas", level: "DEPARTMENT" },
  { id: "dep-limpieza", name: "Limpieza", level: "DEPARTMENT" },

  // Categorias
  { id: "cat-arroz", name: "Arroz", level: "CATEGORY", parentId: "dep-abarrotes-secos" },
  { id: "cat-aceites", name: "Aceites", level: "CATEGORY", parentId: "dep-abarrotes-secos" },
  { id: "cat-aguas", name: "Aguas", level: "CATEGORY", parentId: "dep-bebidas" },
  { id: "cat-refrescos", name: "Refrescos", level: "CATEGORY", parentId: "dep-bebidas" },
  { id: "cat-hogar", name: "Hogar", level: "CATEGORY", parentId: "dep-limpieza" },

  // Subcategorias (con codigo)
  { id: "sub-arroz-blanco", name: "Arroz blanco", level: "SUBCATEGORY", code: "CAT-0001", parentId: "cat-arroz" },
  { id: "sub-arroz-integral", name: "Arroz integral", level: "SUBCATEGORY", code: "CAT-0002", parentId: "cat-arroz" },
  { id: "sub-arroz-precocido", name: "Arroz precocido", level: "SUBCATEGORY", code: "CAT-0003", parentId: "cat-arroz" },
  { id: "sub-arroz-saborizado", name: "Arroz saborizado", level: "SUBCATEGORY", code: "CAT-0004", parentId: "cat-arroz" },
  { id: "sub-arroz-especial", name: "Arroz especial", level: "SUBCATEGORY", code: "CAT-0005", parentId: "cat-arroz" },
  { id: "sub-aceite-vegetal", name: "Aceite vegetal", level: "SUBCATEGORY", code: "CAT-0006", parentId: "cat-aceites" },
  { id: "sub-agua-mineral", name: "Agua mineral", level: "SUBCATEGORY", code: "CAT-0007", parentId: "cat-aguas" },
  { id: "sub-refresco-cola", name: "Refresco de cola", level: "SUBCATEGORY", code: "CAT-0008", parentId: "cat-refrescos" },
  { id: "sub-detergente", name: "Detergente", level: "SUBCATEGORY", code: "CAT-0009", parentId: "cat-hogar" },
  { id: "sub-jabon", name: "Jabon", level: "SUBCATEGORY", code: "CAT-0010", parentId: "cat-hogar" },
];

const byId = new Map(rawCategories.map((c) => [c.id, c]))

// Construye el slug con la ruta completa (igual que el import de CSV)
const buildSlug = (item: SeedCategoryInput): string => {
  const names: string[] = []
  let current: SeedCategoryInput | undefined = item
  while (current) {
    names.unshift(current.name)
    current = current.parentId ? byId.get(current.parentId) : undefined
  }
  return slugify(names.join("-"))
}

export const categories: SeedCategory[] = rawCategories.map((c) => ({
  id: c.id,
  name: c.name,
  slug: buildSlug(c),
  level: c.level,
  code: c.code ?? null,
  parentId: c.parentId ?? null,
}));
