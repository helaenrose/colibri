import ProductCard from "@/components/products/ProductCard"
import Heading from "@/components/ui/Heading"
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

    return (
        <div className="space-y-6 sm:space-y-8">
            <section className="rounded-3xl border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.2),_transparent_45%),linear-gradient(145deg,_#ffffff,_#f8fafc)] p-4 shadow-sm sm:p-6 md:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">
                    {scopeName ? `Buscando en ${scopeName}` : "Buscando en todo el catalogo"}
                </p>
                <Heading>{hasQuery ? `Resultados para "${query}"` : "Buscar productos"}</Heading>
                <p className="-mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                    {hasQuery
                        ? `${products.length} ${products.length === 1 ? "producto encontrado" : "productos encontrados"}.`
                        : "Escribe en el buscador del menu para encontrar productos por nombre."}
                </p>
            </section>

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
