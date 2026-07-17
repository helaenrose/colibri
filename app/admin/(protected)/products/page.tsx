import ProductPagination from "@/components/products/ProductPagination"
import ProductSearch from "@/components/products/ProductSearch"
import ProductTable from "@/components/products/ProductTable"
import Heading from "@/components/ui/Heading"
import { prisma } from "@/src/lib/prisma"
import { getDemoProducts } from "@/src/demo/demo-store"
import Link from "next/link"
import { redirect } from 'next/navigation'



const productCount = async () => {
    try {
        return await prisma.product.count()
    } catch {
        return getDemoProducts().length
    }
}

const getProducts = async (page: number, pageSize: number) => {
    const skip = (page - 1) * pageSize
    try {
        return await prisma.product.findMany({
            take: pageSize,
            skip,
            include: {
                category: true
            }
        })
    } catch {
        return getDemoProducts().slice(skip, skip + pageSize)
    }
}

export type ProductsWithCategory = Awaited<ReturnType<typeof getProducts>>

const ProductsPage = async ({ searchParams }: { searchParams: Promise<{ page: string }> }) => {
    const { page } = await searchParams
    const pageIn = +page || 1
    if (pageIn < 0) redirect('/admin/products')
    const pageSize = 10
    const productsData = getProducts(pageIn, pageSize)
    const totalProductsData = productCount()
    const [products, totalProducts] = await Promise.all([productsData, totalProductsData])

    const totalPages = Math.max(1, Math.ceil(totalProducts / pageSize))

    if (pageIn > totalPages) redirect('/admin/products')

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
                        <span>{totalProducts === 1 ? 'producto cargado' : 'productos cargados'}</span>
                    </div>
                </div>
            </section>

            <div className="flex flex-col lg:flex-row lg:justify-between gap-5">
                <Link
                    className="w-full rounded-2xl bg-slate-900 px-6 py-3 text-center font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-slate-800 lg:w-auto"
                    href="/admin/products/new">
                    Agregar producto
                </Link>

                <ProductSearch />
            </div>

            <ProductTable products={products} />

            <ProductPagination page={pageIn} totalPages={totalPages} />
        </div>
    )
}

export default ProductsPage 