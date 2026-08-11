'use client'

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useState, useTransition } from "react"
import type { FinancePeriod } from "@/src/lib/finance-period"
import { financePeriodLabels } from "@/src/lib/finance-period"

const periods: FinancePeriod[] = ['day', 'week', 'month', 'year']

interface FinanceFiltersProps {
    resultCount: number
}

// Filtros del modulo de finanzas: periodo (dia/semana/mes/año, default dia),
// tipo de movimiento, categoria y busqueda por descripcion/cliente.
// Todo se sincroniza con la URL para que sea compartible y persista al recargar.
const FinanceFilters = ({ resultCount }: FinanceFiltersProps) => {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [isPending, startTransition] = useTransition()

    const currentPeriod = (searchParams.get('period') as FinancePeriod) || 'day'
    const currentType = searchParams.get('type') ?? ''
    const [search, setSearch] = useState(searchParams.get('search') ?? '')

    const updateParams = (updates: Record<string, string>) => {
        const params = new URLSearchParams(searchParams.toString())
        Object.entries(updates).forEach(([key, value]) => {
            if (value) {
                params.set(key, value)
            } else {
                params.delete(key)
            }
        })
        startTransition(() => {
            router.replace(`${pathname}?${params.toString()}`)
        })
    }

    const handleSearchSubmit = (event: React.FormEvent) => {
        event.preventDefault()
        updateParams({ search })
    }

    return (
        <section className="rounded-3xl border border-slate-200 bg-white/85 p-5 shadow-[0_16px_50px_rgba(15,23,42,0.07)] backdrop-blur sm:p-6">
            <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-2">
                    {periods.map((period) => (
                        <button
                            key={period}
                            type="button"
                            onClick={() => updateParams({ period })}
                            aria-pressed={currentPeriod === period}
                            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                                currentPeriod === period
                                    ? 'bg-slate-900 text-white'
                                    : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-100'
                            }`}
                        >
                            {financePeriodLabels[period]}
                        </button>
                    ))}
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex flex-wrap gap-3">
                        <label className="flex flex-col gap-1 text-sm">
                            <span className="font-semibold text-slate-700">Tipo</span>
                            <select
                                value={currentType}
                                onChange={(event) => updateParams({ type: event.target.value })}
                                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
                            >
                                <option value="">Todos</option>
                                <option value="INCOME">Ingresos</option>
                                <option value="EXPENSE">Egresos</option>
                            </select>
                        </label>

                        <form onSubmit={handleSearchSubmit} className="flex flex-col gap-1 text-sm">
                            <span className="font-semibold text-slate-700">Buscar</span>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Descripcion, categoria o cliente"
                                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
                                />
                                <button
                                    type="submit"
                                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-100"
                                >
                                    Filtrar
                                </button>
                            </div>
                        </form>
                    </div>

                    <div
                        className={`inline-flex items-center gap-2 self-start rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition-opacity ${isPending ? 'opacity-60' : ''}`}
                    >
                        <span>{resultCount}</span>
                        <span>{resultCount === 1 ? 'movimiento' : 'movimientos'}</span>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default FinanceFilters
