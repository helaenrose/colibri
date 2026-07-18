import Heading from "@/components/ui/Heading"
import CategoryManager from "@/components/categories/CategoryManager"
import CategoryCsvImport from "@/components/categories/CategoryCsvImport"
import { prisma } from "@/src/lib/prisma"
import { getDemoCategories } from "@/src/demo/demo-store"

export const dynamic = 'force-dynamic'

export type AdminCategoryItem = {
    id: string
    name: string
    slug: string
    level: 'DEPARTMENT' | 'CATEGORY' | 'SUBCATEGORY'
    code: string | null
    image: string | null
    parentId: string | null
    productCount: number
}

const getCategories = async (): Promise<AdminCategoryItem[]> => {
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
            level: category.level,
            code: category.code,
            image: category.image,
            parentId: category.parentId,
            productCount: category._count.Products,
        }))
    } catch {
        return getDemoCategories().map((category) => ({
            id: category.id,
            name: category.name,
            slug: category.slug,
            level: category.level,
            code: category.code ?? null,
            image: null,
            parentId: category.parentId ?? null,
            productCount: 0,
        }))
    }
}

const CategoriesPage = async () => {
    const categories = await getCategories()
    const departmentCount = categories.filter((c) => c.level === 'DEPARTMENT').length
    const subcategoryCount = categories.filter((c) => c.level === 'SUBCATEGORY').length

    return (
        <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white/85 p-5 shadow-[0_16px_50px_rgba(15,23,42,0.07)] backdrop-blur sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">Administracion</p>
                        <Heading>Gestionar categorias</Heading>
                        <p className="-mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
                            Organiza tu catalogo en tres niveles: Departamento, Categoria y Subcategoria (con codigo).
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 self-start">
                        <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800">
                            {departmentCount} {departmentCount === 1 ? 'departamento' : 'departamentos'}
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
                            {subcategoryCount} {subcategoryCount === 1 ? 'subcategoria' : 'subcategorias'}
                        </span>
                    </div>
                </div>
            </section>

            <CategoryCsvImport />

            <CategoryManager categories={categories} />
        </div>
    )
}

export default CategoriesPage
