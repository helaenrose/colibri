import ProductPagination from "@/components/products/ProductPagination"
import ProductFilters, { type FilterCategoryOption } from "@/components/products/ProductFilters"
import ProductTable from "@/components/products/ProductTable"
import ProductCsvImport from "@/components/products/ProductCsvImport"
import Heading from "@/components/ui/Heading"
import EmptyState from "@/components/ui/EmptyState"
import { prisma } from "@/src/lib/prisma"
import { getDemoProducts } from "@/src/demo/demo-store"
import { LOW_STOCK_THRESHOLD, getStockStatus } from "@/src/lib/inventory"
import type { Prisma } from "@prisma/client"
import Link from "next/link"
import { redirect } from 'next/navigation'

type Filters = {
    search?: string
    category?: string
    stock?: string
    estado?: string
    min?: string
    max?: string
}

// Construye la clausula where de Prisma a partir de los filtros de las columnas
const buildWhere = (filters: Filters): Prisma.ProductWhereInput => {
    const where: Prisma.ProductWhereInput = {}

    if (filters.search) {
        where.name = { contains: filters.search, mode: "insensitive" }
    }
    if (filters.category) {
        where.categoryId = filters.category
    }
    if (filters.estado === "active") where.active = true
    if (filters.estado === "inactive") where.active = false

    if (filters.stock === "out") where.stock = { lte: 0 }
    if (filters.stock === "low") where.stock = { gt: 0, lte: LOW_STOCK_THRESHOLD }
    if (filters.stock === "ok") where.stock = { gt: LOW_STOCK_THRESHOLD }

    const min = filters.min ? Number(filters.min) : undefined
    const max = filters.max ? Number(filters.max) : undefined
    if ((min !== undefined && !Number.isNaN(min)) || (max !== undefined && !Number.isNaN(max))) {
        where.price = {}
        if (min !== undefined && !Number.isNaN(min)) where.price.gte = min
        if (max !== undefined && !Number.isNaN(max)) where.price.lte = max
    }

    return where
}

// Filtrado en memoria para el modo demo (sin base de datos)
const filterDemoProducts = (filters: Filters) => {
    const min = filters.min ? Number(filters.min) : undefined
    const max = filters.max ? Number(filters.max) : undefined
    return getDemoProducts().filter((p) => {
        if (filters.search && !p.name.toLowerCase().includes(filters.search.toLowerCase())) return false
        if (filters.category && p.categoryId !== filters.category) return false
        if (filters.estado === "active" && !p.active) return false
        if (filters.estado === "inactive" && p.active) return false
        if (filters.stock) {
            const status = getStockStatus(p.stock)
            if (status !== filters.stock) return false
        }
        if (min !== undefined && !Number.isNaN(min) && p.price < min) return false
        if (max !== undefined && !Number.isNaN(max) && p.price > max) return false
        return true
    })
}

const productCount = async (filters: Filters) => {
    try {
        return await prisma.product.count({ where: buildWhere(filters) })
    } catch {
        return filterDemoProducts(filters).length
    }
}

const getProducts = async (page: number, pageSize: number, filters: Filters) => {
    const skip = (page - 1) * pageSize
    try {
        return await prisma.product.findMany({
            take: pageSize,
            skip,
            where: buildWhere(filters),
            orderBy: { name: "asc" },
            include: {
                category: true
            }
        })
    } catch {
        return filterDemoProducts(filters).slice(skip, skip + pageSize)
    }
}

const getCategoryOptions = async (): Promise<FilterCategoryOption[]> => {
    try {
        const categories = await prisma.category.findMany({
            orderBy: [{ level: "asc" }, { name: "asc" }],
            select: { id: true, name: true, level: true },
        })
        return categories as FilterCategoryOption[]
    } catch {
        return []
    }
}

export type ProductsWithCategory = Awaited<ReturnType<typeof getProducts>>

const ProductsPage = async ({
    searchParams,
}: {
    searchParams: Promise<{
        page?: string
        search?: string
        category?: string
        stock?: string
        estado?: string
        min?: string
        max?: string
    }>
}) => {
    const { page, search, category, stock, estado, min, max } = await searchParams
    const filters: Filters = { search, category, stock, estado, min, max }

    const pageIn = +(page ?? "") || 1
    if (pageIn < 0) redirect('/admin/products')
    const pageSize = 10

    const [products, totalProducts, categories] = await Promise.all([
        getProducts(pageIn, pageSize, filters),
        productCount(filters),
        getCategoryOptions(),
    ])

    const totalPages = Math.max(1, Math.ceil(totalProducts / pageSize))

    return (
        <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white/85 p-5 shadow-[0_16px_50px_rgba(15,23,42,0.07)] backdrop-blur sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">Administracion</p>
                        <Heading>Gestionar productos</Heading>
                        <p className="-mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
                            Crea, edita y organiza el catalogo disponible para el restaurante en tiempo real.
                        </p>
                    </div>

                    <div className="inline-flex items-center gap-2 self-start rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800">
                        <span>{totalProducts}</span>
                        <span>{totalProducts === 1 ? 'producto encontrado' : 'productos encontrados'}</span>
                    </div>
                </div>
            </section>

            <div className="flex flex-col lg:flex-row lg:justify-between gap-5">
                <Link
                    className="w-full rounded-2xl bg-slate-900 px-6 py-3 text-center font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-slate-800 lg:w-auto"
                    href="/admin/products/new">
                    Agregar producto
                </Link>
            </div>

            <ProductFilters categories={categories} />

            <ProductCsvImport />

            {products.length ? (
                <ProductTable products={products} />
            ) : (
                <EmptyState message="No hay productos que coincidan con los filtros" />
            )}

            <ProductPagination page={pageIn} totalPages={totalPages} params={filters} />
        </div>
    )
}

export default ProductsPage
