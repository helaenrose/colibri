import Heading from "@/components/ui/Heading"
import CategoryManager from "@/components/categories/CategoryManager"
import { prisma } from "@/src/lib/prisma"
import { getDemoCategories } from "@/src/demo/demo-store"

const getCategories = async () => {
    try {
        const categories = await prisma.category.findMany({
            orderBy: { name: 'asc' },
            include: {
                _count: { select: { Products: true } },
            },
        })
        return categories.map((category) => ({
            id: category.id,
            name: category.name,
            slug: category.slug,
            productCount: category._count.Products,
        }))
    } catch {
        return getDemoCategories().map((category) => ({
            id: category.id,
            name: category.name,
            slug: category.slug,
            productCount: 0,
        }))
    }
}

const CategoriesPage = async () => {
    const categories = await getCategories()

    return (
        <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white/85 p-5 shadow-[0_16px_50px_rgba(15,23,42,0.07)] backdrop-blur sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">Administracion</p>
                        <Heading>Gestionar categorias</Heading>
                        <p className="-mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
                            Crea y organiza las categorias que agrupan los productos de tu tienda.
                        </p>
                    </div>

                    <div className="inline-flex items-center gap-2 self-start rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800">
                        <span>{categories.length}</span>
                        <span>{categories.length === 1 ? 'categoria' : 'categorias'}</span>
                    </div>
                </div>
            </section>

            <CategoryManager categories={categories} />
        </div>
    )
}

export default CategoriesPage
