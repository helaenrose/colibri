import { ProductsWithCategory } from '@/app/admin/(protected)/products/page'
import EmptyState from '@/components/ui/EmptyState'
import { formatCurrency } from '@/src/utils'
import { getStockStatus } from '@/src/lib/inventory'
import Link from 'next/link'

interface ProductTableProps {
    products: ProductsWithCategory
}

const stockBadgeClass: Record<ReturnType<typeof getStockStatus>, string> = {
    out: 'bg-red-100 text-red-700',
    low: 'bg-amber-100 text-amber-800',
    ok: 'bg-emerald-100 text-emerald-700',
}

const stockLabel = (stock: number, status: ReturnType<typeof getStockStatus>) => {
    if (status === 'out') return 'Agotado'
    if (status === 'low') return `Bajo: ${stock}`
    return `${stock} disp.`
}

const ProductTable = ({ products }: ProductTableProps) => {
    if (!products || products.length === 0) {
        return <EmptyState message="No hay productos para mostrar" />
    }

    return (
        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-3 shadow-[0_16px_50px_rgba(15,23,42,0.06)] sm:p-5">
            <div className="flow-root">
                <div className="overflow-x-auto">
                    <div className="inline-block min-w-full align-middle">
                        <table className="min-w-full divide-y divide-gray-300">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 sm:pl-0">
                                        Producto
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                                        Precio
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                                        Categoría
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                                        Inventario
                                    </th>
                                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                                        <span className="sr-only">Acciones</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {products.map((product) => (
                                    <tr key={product.id} className="transition-colors hover:bg-amber-50/40">
                                        <td className="py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                                            <p className="font-semibold text-slate-900">{product.name}</p>
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-700">
                                            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 sm:text-sm">
                                                {formatCurrency(product.price)}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-700">
                                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 sm:text-sm">
                                                {product.category.name}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-700">
                                            {(() => {
                                                const status = getStockStatus(product.stock)
                                                return (
                                                    <span className={`rounded-full px-3 py-1 text-xs font-semibold sm:text-sm ${stockBadgeClass[status]}`}>
                                                        {stockLabel(product.stock, status)}
                                                    </span>
                                                )
                                            })()}
                                        </td>
                                        <td className="relative whitespace-nowrap px-3 py-4 text-right text-sm text-gray-500 sm:pr-0">
                                            <Link
                                                href={`/admin/products/${product.id}/edit`}
                                                className="inline-flex rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400 sm:text-sm"
                                            >
                                                Editar <span className="sr-only">{product.name}</span>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ProductTable
