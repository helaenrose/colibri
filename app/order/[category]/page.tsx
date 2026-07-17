import ProductCard from "@/components/products/ProductCard"
import Heading from "@/components/ui/Heading"
import { prisma } from "@/src/lib/prisma"
import { getDemoProductsByCategory, getDemoCategories } from "@/src/demo/demo-store"

const getCategoryWithProducts = async (category: string) => {
    try {
        const found = await prisma.category.findFirst({
            where: { slug: category },
            include: { Products: true },
        })
        return {
            title: found?.name ?? "Productos",
            products: found?.Products ?? [],
        }
    } catch {
        const demoCategory = getDemoCategories().find((item) => item.slug === category)
        return {
            title: demoCategory?.name ?? "Productos",
            products: getDemoProductsByCategory(category),
        }
    }
}

const CategoryPage = async ({ params }: { params: Promise<{ category: string }> }) => {
    const { category } = await params
    const { title, products } = await getCategoryWithProducts(category)

    return (
        <div className="space-y-6 sm:space-y-8">
            <section className="rounded-3xl border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.2),_transparent_45%),linear-gradient(145deg,_#ffffff,_#f8fafc)] p-4 shadow-sm sm:p-6 md:p-8">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">Catalogo activo</p>
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
