import ProductCard from "@/components/products/ProductCard"
import CatalogHeader, { type AppliedFilter } from "@/components/order/CatalogHeader"
import { prisma } from "@/src/lib/prisma"
import { collectDescendantIds } from "@/src/lib/category-utils"
import {
    getDemoCategories,
    getDemoProductsBySearch,
    getDemoProductsByCategoryTree,
} from "@/src/demo/demo-store"
import type { Product } from "@prisma/client"

type SearchResult = {
    products: Product[]
    scopeName: string | null
}

const searchProducts = async (query: string, catSlug: string): Promise<SearchResult> => {
    const terms = query.split(/\s+/).filter(Boolean)

    try {
        const all = await prisma.category.findMany()
        const scope = catSlug ? all.find((c) => c.slug === catSlug) ?? null : null

        const categoryFilter = scope
            ? { categoryId: { in: collectDescendantIds(all, scope.id) } }
            : {}

        const products = await prisma.product.findMany({
            where: {
                stock: { gt: 0 },
                active: true,
                ...categoryFilter,
                AND: terms.map((term) => ({
                    name: { contains: term, mode: "insensitive" as const },
                })),
            },
            include: { category: true },
            orderBy: { name: "asc" },
        })

        return { products, scopeName: scope?.name ?? null }
    } catch {
        const scope = catSlug ? getDemoCategories().find((c) => c.slug === catSlug) ?? null : null
        const base = scope
            ? getDemoProductsByCategoryTree(catSlug)
            : getDemoProductsBySearch("")
        const lowered = query.toLowerCase()
        const products = base.filter((p) => p.name.toLowerCase().includes(lowered)) as unknown as Product[]
        return { products, scopeName: scope?.name ?? null }
    }
}

const SearchPage = async ({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; cat?: string }>
}) => {
    const { q = "", cat = "" } = await searchParams
    const query = q.trim()
    const hasQuery = query.length > 0

    const { products, scopeName } = hasQuery
        ? await searchProducts(query, cat)
        : { products: [], scopeName: null }

    const filters: AppliedFilter[] = hasQuery
        ? [
            { label: "Busqueda", value: `"${query}"` },
            ...(scopeName ? [{ label: "Categoria", value: scopeName }] : []),
        ]
        : []

    return (
        <div className="space-y-6 sm:space-y-8">
            <CatalogHeader
                title={hasQuery ? "Resultados de busqueda" : "Buscar productos"}
                description={
                    hasQuery
                        ? `${products.length} ${products.length === 1 ? "producto encontrado" : "productos encontrados"}.`
                        : "Escribe en el buscador del menu para encontrar productos por nombre."
                }
                filters={filters}
            />

            {hasQuery ? (
                <div className="grid w-full min-w-0 grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {products.length > 0 ? (
                        products.map((product) => <ProductCard key={product.id} product={product} />)
                    ) : (
                        <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-600">
                            No se encontraron productos que coincidan con tu busqueda.
                        </div>
                    )}
                </div>
            ) : null}
        </div>
    )
}

export default SearchPage
