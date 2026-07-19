'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

export type SearchScope = { slug: string; name: string; level: 'DEPARTMENT' | 'CATEGORY' | 'SUBCATEGORY' }

interface Props {
    scopes: SearchScope[]
}

const levelIndent: Record<SearchScope['level'], string> = {
    DEPARTMENT: '',
    CATEGORY: '\u00A0\u00A0\u00A0\u00A0',
    SUBCATEGORY: '\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0',
}

const CatalogSearch = ({ scopes }: Props) => {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const isSearchPage = pathname === '/order/buscar'
    const [term, setTerm] = useState(isSearchPage ? (searchParams.get('q') ?? '') : '')
    const [cat, setCat] = useState(isSearchPage ? (searchParams.get('cat') ?? '') : '')

    // Mantiene sincronizado el input cuando se navega directamente con una URL de busqueda
    useEffect(() => {
        if (isSearchPage) {
            setTerm(searchParams.get('q') ?? '')
            setCat(searchParams.get('cat') ?? '')
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSearchPage])

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const runSearch = (nextTerm: string, nextCat: string) => {
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => {
            const trimmed = nextTerm.trim()
            if (!trimmed) {
                if (isSearchPage) router.replace('/order/buscar')
                return
            }
            const params = new URLSearchParams()
            params.set('q', trimmed)
            if (nextCat) params.set('cat', nextCat)
            router.replace(`/order/buscar?${params.toString()}`)
        }, 250)
    }

    useEffect(() => () => {
        if (debounceRef.current) clearTimeout(debounceRef.current)
    }, [])

    return (
        <div className="px-4 py-3 sm:px-5">
            <label htmlFor="catalog-search" className="sr-only">Buscar productos</label>
            <div className="relative">
                <svg
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden
                >
                    <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 3.4 9.83l3.38 3.38a.75.75 0 1 0 1.06-1.06l-3.38-3.38A5.5 5.5 0 0 0 9 3.5zM5 9a4 4 0 1 1 8 0 4 4 0 0 1-8 0z" clipRule="evenodd" />
                </svg>
                <input
                    id="catalog-search"
                    type="search"
                    value={term}
                    onChange={(e) => {
                        setTerm(e.target.value)
                        runSearch(e.target.value, cat)
                    }}
                    placeholder="Buscar productos..."
                    className="w-full rounded-full border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
                    autoComplete="off"
                />
            </div>
            <select
                aria-label="Ambito de la busqueda"
                value={cat}
                onChange={(e) => {
                    setCat(e.target.value)
                    runSearch(term, e.target.value)
                }}
                className="mt-2 w-full rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
            >
                <option value="">Todo el catalogo</option>
                {scopes.map((scope) => (
                    <option key={scope.slug} value={scope.slug}>
                        {levelIndent[scope.level]}{scope.name}
                    </option>
                ))}
            </select>
        </div>
    )
}

export default CatalogSearch
