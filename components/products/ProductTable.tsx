'use client'

import { ProductsWithCategory } from '@/app/admin/(protected)/products/page'
import EmptyState from '@/components/ui/EmptyState'
import { formatCurrency } from '@/src/utils'
import { getStockStatus } from '@/src/lib/inventory'
import { deleteProducts } from '@/actions/delete-products-action'
import { toggleProductActive } from '@/actions/toggle-product-active-action'
import Link from 'next/link'
import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'

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
    const router = useRouter()
    const [selected, setSelected] = useState<Set<string>>(new Set())
    const [isPending, startTransition] = useTransition()

    const allIds = useMemo(() => (products ?? []).map((p) => p.id), [products])
    const allSelected = allIds.length > 0 && selected.size === allIds.length

    const toggleOne = (id: string) => {
        setSelected((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const toggleAll = () => {
        setSelected((prev) => (prev.size === allIds.length ? new Set() : new Set(allIds)))
    }

    const [togglingId, setTogglingId] = useState<string | null>(null)

    const handleToggle = (id: string, current: boolean) => {
        setTogglingId(id)
        startTransition(async () => {
            const response = await toggleProductActive(id, !current)
            if (response?.errors) {
                response.errors.forEach((e) => toast.error(e.message))
            } else {
                toast.success(!current ? 'Producto activado' : 'Producto desactivado')
                router.refresh()
            }
            setTogglingId(null)
        })
    }

    const handleDelete = () => {
        if (selected.size === 0) return
        const count = selected.size
        const confirmed = window.confirm(
            `Se eliminaran ${count} producto(s). Los que esten asociados a ordenes se omitiran. ¿Continuar?`,
        )
        if (!confirmed) return

        startTransition(async () => {
            const response = await deleteProducts([...selected])
            if (response?.errors && !response.success) {
                response.errors.forEach((e) => toast.error(e.message))
                if (response.skipped) {
                    // nada eliminado; ya se mostro el error
                }
                return
            }
            const deleted = response.deleted ?? 0
            const skipped = response.skipped ?? 0
            if (deleted > 0) toast.success(`${deleted} producto(s) eliminado(s).`)
            if (skipped > 0) toast.info(`${skipped} omitido(s) por estar asociados a ordenes.`)
            setSelected(new Set())
            router.refresh()
        })
    }

    if (!products || products.length === 0) {
        return <EmptyState message="No hay productos para mostrar" />
    }

    return (
        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-3 shadow-[0_16px_50px_rgba(15,23,42,0.06)] sm:p-5">
            {/* Barra de acciones de seleccion */}
            <div className="mb-3 flex flex-col gap-3 border-b border-slate-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
                <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                        className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-amber-400"
                        aria-label="Seleccionar todos los productos de la pagina"
                    />
                    {selected.size > 0 ? `${selected.size} seleccionado(s)` : 'Seleccionar todos'}
                </label>

                <button
                    type="button"
                    onClick={handleDelete}
                    disabled={selected.size === 0 || isPending}
                    className="inline-flex items-center justify-center rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {isPending ? 'Eliminando...' : `Eliminar seleccionados${selected.size > 0 ? ` (${selected.size})` : ''}`}
                </button>
            </div>

            <p className="mb-3 text-xs text-slate-500">
                Solo se pueden eliminar productos que no esten asociados a ninguna orden.
            </p>

            {/* Vista de tarjetas para movil */}
            <ul className="space-y-3 sm:hidden">
                {products.map((product) => {
                    const status = getStockStatus(product.stock)
                    const isChecked = selected.has(product.id)
                    return (
                        <li
                            key={product.id}
                            className={`rounded-2xl border p-4 ${isChecked ? 'border-amber-400 bg-amber-50/40' : 'border-slate-200 bg-white'} ${product.active ? '' : 'opacity-70'}`}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <label className="flex items-start gap-2">
                                    <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => toggleOne(product.id)}
                                        className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-amber-400"
                                        aria-label={`Seleccionar ${product.name}`}
                                    />
                                    <span className="font-semibold text-slate-900">{product.name}</span>
                                </label>
                                <span className="shrink-0 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                                    {formatCurrency(product.price)}
                                </span>
                            </div>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                                    {product.category.name}
                                </span>
                                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${stockBadgeClass[status]}`}>
                                    {stockLabel(product.stock, status)}
                                </span>
                                <span
                                    className={`rounded-full px-3 py-1 text-xs font-semibold ${product.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}
                                >
                                    {product.active ? 'Activo' : 'Inactivo'}
                                </span>
                            </div>
                            <div className="mt-4 flex items-center gap-2">
                                <Link
                                    href={`/admin/products/${product.id}/edit`}
                                    className="flex flex-1 items-center justify-center rounded-full border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                                >
                                    Editar <span className="sr-only">{product.name}</span>
                                </Link>
                                <button
                                    type="button"
                                    onClick={() => handleToggle(product.id, product.active)}
                                    disabled={togglingId === product.id}
                                    className={`flex flex-1 items-center justify-center rounded-full px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${product.active ? 'border border-slate-300 bg-white text-slate-700 hover:border-slate-900' : 'bg-emerald-600 text-white hover:bg-emerald-500'}`}
                                >
                                    {togglingId === product.id ? '...' : product.active ? 'Desactivar' : 'Activar'}
                                </button>
                            </div>
                        </li>
                    )
                })}
            </ul>

            {/* Vista de tabla para escritorio */}
            <div className="hidden flow-root sm:block">
                <div className="overflow-x-auto">
                    <div className="inline-block min-w-full align-middle">
                        <table className="min-w-full divide-y divide-gray-300">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left sm:pl-2">
                                        <input
                                            type="checkbox"
                                            checked={allSelected}
                                            onChange={toggleAll}
                                            className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-amber-400"
                                            aria-label="Seleccionar todos los productos de la pagina"
                                        />
                                    </th>
                                    <th scope="col" className="py-3.5 pl-2 pr-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
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
                                    <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                                        Estado
                                    </th>
                                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                                        <span className="sr-only">Acciones</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {products.map((product) => {
                                    const isChecked = selected.has(product.id)
                                    return (
                                        <tr
                                            key={product.id}
                                            className={`transition-colors ${isChecked ? 'bg-amber-50/60' : 'hover:bg-amber-50/40'} ${product.active ? '' : 'opacity-60'}`}
                                        >
                                            <td className="py-4 pl-4 pr-3 sm:pl-2">
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => toggleOne(product.id)}
                                                    className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-amber-400"
                                                    aria-label={`Seleccionar ${product.name}`}
                                                />
                                            </td>
                                            <td className="py-4 pl-2 pr-3 text-sm font-medium text-gray-900">
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
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-700">
                                                <span
                                                    className={`rounded-full px-3 py-1 text-xs font-semibold sm:text-sm ${product.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}
                                                >
                                                    {product.active ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>
                                            <td className="relative whitespace-nowrap px-3 py-4 text-right text-sm text-gray-500 sm:pr-0">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggle(product.id, product.active)}
                                                        disabled={togglingId === product.id}
                                                        className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm ${product.active ? 'border border-slate-300 bg-white text-slate-700 hover:border-slate-900 hover:text-slate-900' : 'bg-emerald-600 text-white hover:bg-emerald-500'}`}
                                                    >
                                                        {togglingId === product.id ? '...' : product.active ? 'Desactivar' : 'Activar'}
                                                    </button>
                                                    <Link
                                                        href={`/admin/products/${product.id}/edit`}
                                                        className="inline-flex rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400 sm:text-sm"
                                                    >
                                                        Editar <span className="sr-only">{product.name}</span>
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ProductTable
