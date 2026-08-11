'use client'

import Link from 'next/link'
import { Suspense, useState, type ReactNode } from 'react'
import CatalogSearch, { type SearchScope } from './CatalogSearch'
import CategoryTreeNav from './CategoryTreeNav'
import type { CategoryNode } from '@/src/lib/category-utils'

interface Props {
    logo: ReactNode
    tree: CategoryNode[]
    scopes: SearchScope[]
}

// En movil, el selector de categoria, los filtros y el boton de inicio viven
// dentro de este menu lateral (se abre con el boton "Categorias y filtros") para
// dejar el catalogo de productos como protagonista de la pantalla. En desktop
// (md+) el contenido se mantiene siempre visible como un sidebar estatico.
const CatalogSidebarDrawer = ({ logo, tree, scopes }: Props) => {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            <div className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur md:hidden">
                <span className="text-sm font-black uppercase tracking-[0.14em] text-slate-900">Catalogo</span>
                <button
                    type="button"
                    onClick={() => setIsOpen(true)}
                    aria-expanded={isOpen}
                    aria-controls="catalog-sidebar-drawer"
                    className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-amber-300 hover:bg-amber-50"
                >
                    <svg className="size-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                        <path fillRule="evenodd" d="M3 5.5a.75.75 0 0 1 .75-.75h12.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 5.5Zm0 4.5a.75.75 0 0 1 .75-.75h12.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 10Zm.75 3.75a.75.75 0 0 0 0 1.5h12.5a.75.75 0 0 0 0-1.5H3.75Z" clipRule="evenodd" />
                    </svg>
                    Categorias y filtros
                </button>
            </div>

            <aside
                id="catalog-sidebar-drawer"
                aria-label="Categorias, filtros e inicio"
                className={[
                    'w-full overflow-y-auto bg-white/95',
                    isOpen ? 'fixed inset-0 z-50 flex flex-col' : 'hidden',
                    'md:static md:z-auto md:flex md:h-screen md:w-80 md:flex-col md:border-r md:border-gray-200 md:shadow-sm',
                ].join(' ')}
            >
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 md:hidden">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Categorias y filtros
                    </span>
                    <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="rounded-md border border-gray-300 px-2.5 py-1 text-xs font-semibold text-gray-700 transition hover:bg-gray-100"
                    >
                        Cerrar
                    </button>
                </div>

                <div className="sticky top-0 z-20 border-b border-gray-100 bg-[linear-gradient(145deg,_#ffffff,_#f8fafc)] px-4 py-3 sm:px-5 md:static md:py-4">
                    {logo}

                    <Link
                        href="/"
                        onClick={() => setIsOpen(false)}
                        className="mt-3 flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-amber-300 hover:bg-amber-50 md:hidden"
                    >
                        Inicio
                    </Link>

                    <div className="mt-2 text-center">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 sm:text-sm">Selecciona tu categoria</p>
                    </div>
                </div>

                <Suspense fallback={null}>
                    <CatalogSearch scopes={scopes} />
                </Suspense>

                <nav className="pb-2" aria-label="Menu principal de categorias">
                    <h3 className="w-full bg-slate-900 py-2.5 text-center text-sm font-bold uppercase tracking-[0.2em] text-white sm:text-base md:py-3 md:text-lg md:tracking-wide">
                        Menu
                    </h3>
                    <CategoryTreeNav tree={tree} onNavigate={() => setIsOpen(false)} />
                </nav>
            </aside>
        </>
    )
}

export default CatalogSidebarDrawer
