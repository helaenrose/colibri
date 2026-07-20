import ProductCard from "@/components/products/ProductCard"
import Heading from "@/components/ui/Heading"
import Link from "next/link"
import { prisma } from "@/src/lib/prisma"
import { collectDescendantIds } from "@/src/lib/category-utils"
import {
    getDemoCategories,
    getDemoProductsByCategoryTree,
} from "@/src/demo/demo-store"
import type { Category } from "@prisma/client"

type SubNavItem = { name: string; slug: string; code: string | null }

const getCategoryWithProducts = async (slug: string) => {
    try {
        const all = await prisma.category.findMany()
        const current = all.find((c) => c.slug === slug)
        if (!current) {
            return { title: "Productos", products: [], subNav: [] as SubNavItem[], parent: null as Category | null }
        }

        // Productos del nodo actual + todos sus descendientes, solo activos y con stock
        const ids = collectDescendantIds(all, current.id)
        const products = await prisma.product.findMany({
            where: { categoryId: { in: ids }, stock: { gt: 0 }, active: true },
            include: { category: true },
        })

        // Sub-navegacion: hijos directos del nodo actual
        const subNav: SubNavItem[] = all
            .filter((c) => c.parentId === current.id)
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((c) => ({ name: c.name, slug: c.slug, code: c.code }))

        const parent = current.parentId ? all.find((c) => c.id === current.parentId) ?? null : null

        return { title: current.name, products, subNav, parent }
    } catch {
        const demoCategory = getDemoCategories().find((item) => item.slug === slug)
        return {
            title: demoCategory?.name ?? "Productos",
            products: getDemoProductsByCategoryTree(slug),
            subNav: [] as SubNavItem[],
            parent: null as Category | null,
        }
    }
}

const CategoryPage = async ({ params }: { params: Promise<{ category: string }> }) => {
    const { category } = await params
    const { title, products, subNav, parent } = await getCategoryWithProducts(category)

    return (
        <div className="space-y-6 sm:space-y-8">
            <section className="rounded-3xl border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.2),_transparent_45%),linear-gradient(145deg,_#ffffff,_#f8fafc)] p-4 shadow-sm sm:p-6 md:p-8">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">
                            {parent ? parent.name : "Catalogo activo"}
                        </p>
                        <Heading>{title}</Heading>
                        <p className="-mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                            Elige tus productos, agrega cantidades al carrito y confirma tu pedido en pocos pasos.
                        </p>
                    </div>

                    <div className="inline-flex items-center gap-2 self-start rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800">
                        <span>{products.length}</span>
                        <span>{products.length === 1 ? "opcion disponible" : "opciones disponibles"}</span>
                    </div>
                </div>

                {subNav.length > 0 ? (
                    <nav className="mt-5 flex flex-wrap gap-2" aria-label={`Subcategorias de ${title}`}>
                        {subNav.map((item) => (
                            <Link
                                key={item.slug}
                                href={`/order/${item.slug}`}
                                className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-all hover:-translate-y-0.5 hover:border-amber-300 hover:bg-amber-50"
                            >
                                {item.name}
                                {item.code ? (
                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-500">{item.code}</span>
                                ) : null}
                            </Link>
                        ))}
                    </nav>
                ) : null}
            </section>

            <div className="grid w-full min-w-0 grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
                {products.length > 0 ?
                    products.map(product => (
                        <ProductCard
                            key={product.id}
                            product={product}
                        />
                    ))
                    : (
                        <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-600">
                            No se encontraron productos para esta categoria.
                        </div>
                    )
                }
            </div>
        </div>
    )
}

export default CategoryPage
