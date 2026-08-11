'use client'

export type OrderFiltersState = {
    search: string
    deliveryType: '' | 'PICKUP' | 'DELIVERY'
    from: string
    to: string
}

export const defaultOrderFilters: OrderFiltersState = {
    search: '',
    deliveryType: '',
    from: '',
    to: '',
}

interface OrderFiltersProps {
    filters: OrderFiltersState
    onChange: (filters: OrderFiltersState) => void
    resultCount: number
    dateLabel?: string
}

const hasActiveFilters = (filters: OrderFiltersState) =>
    Boolean(filters.search || filters.deliveryType || filters.from || filters.to)

const OrderFilters = ({ filters, onChange, resultCount, dateLabel = 'Fecha' }: OrderFiltersProps) => {
    const update = (updates: Partial<OrderFiltersState>) => {
        onChange({ ...filters, ...updates })
    }

    const inputClass =
        'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400'
    const labelClass = 'mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500'

    return (
        <section className="rounded-3xl border border-slate-200 bg-white/85 p-4 shadow-[0_16px_50px_rgba(15,23,42,0.06)] backdrop-blur sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">Buscar y filtrar</p>
                {hasActiveFilters(filters) && (
                    <button
                        type="button"
                        onClick={() => onChange(defaultOrderFilters)}
                        className="text-sm font-semibold text-slate-500 underline-offset-2 transition hover:text-slate-900 hover:underline"
                    >
                        Limpiar filtros
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="sm:col-span-2">
                    <label htmlFor="order-filter-search" className={labelClass}>
                        Cliente o celular
                    </label>
                    <input
                        id="order-filter-search"
                        type="search"
                        value={filters.search}
                        onChange={(e) => update({ search: e.target.value })}
                        placeholder="Buscar por nombre o celular"
                        className={inputClass}
                    />
                </div>

                <div>
                    <label htmlFor="order-filter-delivery" className={labelClass}>
                        Entrega
                    </label>
                    <select
                        id="order-filter-delivery"
                        value={filters.deliveryType}
                        onChange={(e) => update({ deliveryType: e.target.value as OrderFiltersState['deliveryType'] })}
                        className={inputClass}
                    >
                        <option value="">Todas</option>
                        <option value="PICKUP">Retiro</option>
                        <option value="DELIVERY">Domicilio</option>
                    </select>
                </div>

                <div>
                    <label className={labelClass}>{dateLabel}</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            value={filters.from}
                            onChange={(e) => update({ from: e.target.value })}
                            aria-label={`${dateLabel} desde`}
                            className={inputClass}
                        />
                        <span className="text-slate-400">-</span>
                        <input
                            type="date"
                            value={filters.to}
                            onChange={(e) => update({ to: e.target.value })}
                            aria-label={`${dateLabel} hasta`}
                            className={inputClass}
                        />
                    </div>
                </div>
            </div>

            {hasActiveFilters(filters) && (
                <p className="mt-3 text-sm text-slate-500">
                    {resultCount} {resultCount === 1 ? 'resultado' : 'resultados'} para estos filtros
                </p>
            )}
        </section>
    )
}

export default OrderFilters
