'use client'

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "react-toastify"
import EmptyState from "@/components/ui/EmptyState"
import { formatCurrency } from "@/src/utils"
import { deleteFinanceEntry } from "@/actions/delete-finance-entry-action"

export interface FinanceEntryRow {
    id: string
    type: 'INCOME' | 'EXPENSE'
    amount: number
    description: string
    category: string | null
    date: Date | string
    orderId: string | null
    orderCustomerName: string | null
}

interface FinanceEntryTableProps {
    entries: FinanceEntryRow[]
}

const formatDate = (value: Date | string) =>
    new Date(value).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })

const FinanceEntryTable = ({ entries }: FinanceEntryTableProps) => {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const handleDelete = (id: string, isOrderIncome: boolean) => {
        const confirmMessage = isOrderIncome
            ? '¿Eliminar este ingreso? Se archivara y podras restaurarlo desde la orden mientras esta exista.'
            : '¿Eliminar este movimiento? Esta accion no se puede deshacer.'

        if (!window.confirm(confirmMessage)) return

        setDeletingId(id)
        startTransition(async () => {
            const response = await deleteFinanceEntry({ id })
            if (response?.errors) {
                response.errors.forEach((error) => toast.error(error.message))
                setDeletingId(null)
                return
            }

            toast.success(response?.archived ? 'Ingreso archivado' : 'Movimiento eliminado')
            router.refresh()
            setDeletingId(null)
        })
    }

    if (!entries || entries.length === 0) {
        return <EmptyState message="No hay movimientos para este filtro" />
    }

    return (
        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-3 shadow-[0_16px_50px_rgba(15,23,42,0.06)] sm:p-5">
            {/* Vista de tarjetas para movil */}
            <ul className="space-y-3 sm:hidden">
                {entries.map((entry) => (
                    <li key={entry.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="font-semibold text-slate-900">{entry.description}</p>
                                {entry.orderCustomerName ? (
                                    <p className="mt-0.5 text-xs text-slate-500">Cliente: {entry.orderCustomerName}</p>
                                ) : null}
                                <p className="mt-0.5 text-xs text-slate-500">{formatDate(entry.date)}</p>
                            </div>
                            <span
                                className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${entry.type === 'INCOME' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}
                            >
                                {entry.type === 'INCOME' ? '+' : '-'}{formatCurrency(entry.amount)}
                            </span>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                                {entry.category || 'Sin categoria'}
                            </span>
                            <button
                                type="button"
                                onClick={() => handleDelete(entry.id, entry.type === 'INCOME' && Boolean(entry.orderId))}
                                disabled={isPending && deletingId === entry.id}
                                className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isPending && deletingId === entry.id ? '...' : 'Eliminar'}
                            </button>
                        </div>
                    </li>
                ))}
            </ul>

            {/* Vista de tabla para escritorio */}
            <div className="hidden flow-root sm:block">
                <div className="overflow-x-auto">
                    <div className="inline-block min-w-full align-middle">
                        <table className="min-w-full divide-y divide-gray-300">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th scope="col" className="py-3.5 pl-2 pr-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                                        Descripcion
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                                        Categoria
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                                        Fecha
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                                        Monto
                                    </th>
                                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                                        <span className="sr-only">Acciones</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {entries.map((entry) => (
                                    <tr key={entry.id} className="transition-colors hover:bg-amber-50/40">
                                        <td className="py-4 pl-2 pr-3 text-sm text-slate-900">
                                            <p className="font-semibold">{entry.description}</p>
                                            {entry.orderCustomerName ? (
                                                <p className="mt-0.5 text-xs font-normal text-slate-500">
                                                    Cliente: {entry.orderCustomerName}
                                                </p>
                                            ) : null}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-700">
                                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 sm:text-sm">
                                                {entry.category || 'Sin categoria'}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-700">{formatDate(entry.date)}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold sm:text-sm ${entry.type === 'INCOME' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}
                                            >
                                                {entry.type === 'INCOME' ? '+' : '-'}{formatCurrency(entry.amount)}
                                            </span>
                                        </td>
                                        <td className="relative whitespace-nowrap px-3 py-4 text-right text-sm sm:pr-0">
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(entry.id, entry.type === 'INCOME' && Boolean(entry.orderId))}
                                                disabled={isPending && deletingId === entry.id}
                                                className="inline-flex rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
                                            >
                                                {isPending && deletingId === entry.id ? '...' : 'Eliminar'}
                                            </button>
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

export default FinanceEntryTable
