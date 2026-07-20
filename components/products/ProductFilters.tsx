'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export type FilterCategoryOption = {
    id: string
    name: string
    level: 'DEPARTMENT' | 'CATEGORY' | 'SUBCATEGORY'
}

interface ProductFiltersProps {
    categories: FilterCategoryOption[]
}

const levelPrefix: Record<FilterCategoryOption['level'], string> = {
    DEPARTMENT: '',
    CATEGORY: '\u00A0\u00A0\u00A0\u00A0',
    SUBCATEGORY: '\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0',
}

const ProductFilters = ({ categories }: ProductFiltersProps) => {
    const router = useRouter()
    const searchParams = useSearchParams()

    // Estado local del texto de busqueda (con debounce hacia la URL)
    const [search, setSearch] = useState(searchParams.get('search') ?? '')
    const firstRender = useRef(true)

    // Sincroniza el input si cambia la URL desde afuera (ej. limpiar)
    useEffect(() => {
        setSearch(searchParams.get('search') ?? '')
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams.get('search')])

    const updateParams = useCallback(
        (updates: Record<string, string>) => {
            const params = new URLSearchParams(searchParams.toString())
            Object.entries(updates).forEach(([key, value]) => {
                if (value) params.set(key, value)
                else params.delete(key)
            })
            // Cualquier cambio de filtro regresa a la primera pagina
            params.delete('page')
            router.replace(`/admin/products?${params.toString()}`)
        },
        [router, searchParams],
    )

    // Debounce del texto de busqueda
    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false
            return
        }
        const handler = setTimeout(() => {
            if ((searchParams.get('search') ?? '') !== search) {
                updateParams({ search })
            }
        }, 400)
        return () => clearTimeout(handler)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search])

    const category = searchParams.get('category') ?? ''
    const stock = searchParams.get('stock') ?? ''
    const estado = searchParams.get('estado') ?? ''
    const min = searchParams.get('min') ?? ''
    const max = searchParams.get('max') ?? ''

    const hasActiveFilters = useMemo(
        () => Boolean(search || category || stock || estado || min || max),
        [search, category, stock, estado, min, max],
    )

    const clearFilters = () => {
        setSearch('')
        router.replace('/admin/products')
    }

    const selectClass =
        'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400'
    const labelClass = 'mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500'

    return (
        <section className="rounded-3xl border border-slate-200 bg-white/85 p-4 shadow-[0_16px_50px_rgba(15,23,42,0.06)] backdrop-blur sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">Buscar y filtrar</p>
                {hasActiveFilters && (
                    <button
                        type="button"
                        onClick={clearFilters}
                        className="text-sm font-semibold text-slate-500 underline-offset-2 transition hover:text-slate-900 hover:underline"
                    >
                        Limpiar filtros
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {/* Producto (nombre) */}
                <div className="lg:col-span-2">
                    <label htmlFor="filter-search" className={labelClass}>
                        Producto
                    </label>
                    <input
                        id="filter-search"
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar por nombre"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                </div>

                {/* Categoria */}
                <div>
                    <label htmlFor="filter-category" className={labelClass}>
                        Categoría
                    </label>
                    <select
                        id="filter-category"
                        value={category}
                        onChange={(e) => updateParams({ category: e.target.value })}
                        className={selectClass}
                    >
                        <option value="">Todas</option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                                {levelPrefix[c.level]}
                                {c.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Inventario (stock) */}
                <div>
                    <label htmlFor="filter-stock" className={labelClass}>
                        Inventario
                    </label>
                    <select
                        id="filter-stock"
                        value={stock}
                        onChange={(e) => updateParams({ stock: e.target.value })}
                        className={selectClass}
                    >
                        <option value="">Todos</option>
                        <option value="ok">Disponible</option>
                        <option value="low">Bajo</option>
                        <option value="out">Agotado</option>
                    </select>
                </div>

                {/* Estado (activo/inactivo) */}
                <div>
                    <label htmlFor="filter-estado" className={labelClass}>
                        Estado
                    </label>
                    <select
                        id="filter-estado"
                        value={estado}
                        onChange={(e) => updateParams({ estado: e.target.value })}
                        className={selectClass}
                    >
                        <option value="">Todos</option>
                        <option value="active">Activo</option>
                        <option value="inactive">Inactivo</option>
                    </select>
                </div>

                {/* Precio (rango) */}
                <div>
                    <label className={labelClass}>Precio</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            inputMode="decimal"
                            min={0}
                            step="0.01"
                            value={min}
                            onChange={(e) => updateParams({ min: e.target.value })}
                            placeholder="Min"
                            aria-label="Precio mínimo"
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
                        />
                        <span className="text-slate-400">-</span>
                        <input
                            type="number"
                            inputMode="decimal"
                            min={0}
                            step="0.01"
                            value={max}
                            onChange={(e) => updateParams({ max: e.target.value })}
                            placeholder="Max"
                            aria-label="Precio máximo"
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
                        />
                    </div>
                </div>
            </div>
        </section>
    )
}

export default ProductFilters
