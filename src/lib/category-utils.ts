import type { Category, CategoryLevel } from '@prisma/client'

export const CATEGORY_LEVELS: CategoryLevel[] = ['DEPARTMENT', 'CATEGORY', 'SUBCATEGORY']

export const levelLabels: Record<CategoryLevel, string> = {
    DEPARTMENT: 'Departamento',
    CATEGORY: 'Categoria',
    SUBCATEGORY: 'Subcategoria',
}

export const childLevel = (level: CategoryLevel): CategoryLevel | null => {
    if (level === 'DEPARTMENT') return 'CATEGORY'
    if (level === 'CATEGORY') return 'SUBCATEGORY'
    return null
}

export const slugify = (value: string) =>
    value
        .toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')

// Parser CSV simple que respeta comillas dobles y comas dentro de campos entrecomillados.
export const parseCsv = (text: string): string[][] => {
    const rows: string[][] = []
    let field = ''
    let row: string[] = []
    let inQuotes = false

    // Normaliza saltos de linea
    const input = text.replace(/\r\n?/g, '\n')

    for (let i = 0; i < input.length; i++) {
        const char = input[i]

        if (inQuotes) {
            if (char === '"') {
                if (input[i + 1] === '"') {
                    field += '"'
                    i++
                } else {
                    inQuotes = false
                }
            } else {
                field += char
            }
        } else if (char === '"') {
            inQuotes = true
        } else if (char === ',') {
            row.push(field)
            field = ''
        } else if (char === '\n') {
            row.push(field)
            rows.push(row)
            row = []
            field = ''
        } else {
            field += char
        }
    }

    // Ultimo campo/fila si el archivo no termina en salto de linea
    if (field.length > 0 || row.length > 0) {
        row.push(field)
        rows.push(row)
    }

    // Elimina filas totalmente vacias
    return rows.filter((r) => r.some((c) => c.trim() !== ''))
}

export type CategoryNode = Category & { children: CategoryNode[] }

// Construye el arbol completo (Departamento -> Categoria -> Subcategoria)
export const buildCategoryTree = (categories: Category[]): CategoryNode[] => {
    const byId = new Map<string, CategoryNode>()
    categories.forEach((c) => byId.set(c.id, { ...c, children: [] }))

    const roots: CategoryNode[] = []
    byId.forEach((node) => {
        if (node.parentId && byId.has(node.parentId)) {
            byId.get(node.parentId)!.children.push(node)
        } else {
            roots.push(node)
        }
    })

    const sortNodes = (nodes: CategoryNode[]) => {
        nodes.sort((a, b) => a.name.localeCompare(b.name))
        nodes.forEach((n) => sortNodes(n.children))
    }
    sortNodes(roots)
    return roots
}

// Poda el arbol dejando solo los nodos que tienen productos en su subarbol.
// `withProducts` es el conjunto de ids de categoria que tienen al menos un producto asociado directamente.
export const pruneEmptyCategories = (
    nodes: CategoryNode[],
    withProducts: Set<string>,
): CategoryNode[] => {
    const prune = (list: CategoryNode[]): CategoryNode[] => {
        return list
            .map((node) => ({ ...node, children: prune(node.children) }))
            .filter((node) => withProducts.has(node.id) || node.children.length > 0)
    }
    return prune(nodes)
}

// Ids de un nodo y de todos sus descendientes (para filtrar productos)
export const collectDescendantIds = (categories: Category[], rootId: string): string[] => {
    const childrenByParent = new Map<string, Category[]>()
    categories.forEach((c) => {
        if (!c.parentId) return
        const list = childrenByParent.get(c.parentId) ?? []
        list.push(c)
        childrenByParent.set(c.parentId, list)
    })

    const result: string[] = []
    const walk = (id: string) => {
        result.push(id)
        const kids = childrenByParent.get(id) ?? []
        kids.forEach((k) => walk(k.id))
    }
    walk(rootId)
    return result
}
