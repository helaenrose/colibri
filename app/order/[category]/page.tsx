import ProductCard from "@/components/products/ProductCard"
import CatalogHeader from "@/components/order/CatalogHeader"
import { prisma } from "@/src/lib/prisma"
import { collectDescendantIds } from "@/src/lib/category-utils"
import {
    getDemoCategories,
    getDemoProductsByCategoryTree,
} from "@/src/demo/demo-store"

const getCategoryWithProducts = async (slug: string) => {
    try {
        const all = await prisma.category.findMany()
        const current = all.find((c) => c.slug === slug)
        if (!current) {
            return { title: "Productos", products: [] }
        }

        // Productos del nodo actual + todos sus descendientes, solo activos y con stock
        const ids = collectDescendantIds(all, current.id)
        const products = await prisma.product.findMany({
            where: { categoryId: { in: ids }, stock: { gt: 0 }, active: true },
            include: { category: true },
        })

        return { title: current.name, products }
    } catch {
        const demoCategory = getDemoCategories().find((item) => item.slug === slug)
        return {
            title: demoCategory?.name ?? "Productos",
            products: getDemoProductsByCategoryTree(slug),
        }
    }
}

const CategoryPage = async ({ params }: { params: Promise<{ category: string }> }) => {
    const { category } = await params
    const { title, products } = await getCategoryWithProducts(category)

    return (
        <div className="space-y-6 sm:space-y-8">
            <CatalogHeader
                title={title}
                description="Elige tus productos, agrega cantidades al carrito y confirma tu pedido en pocos pasos."
            />

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
