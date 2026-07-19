'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

interface AdminMobileNavProps {
    children: React.ReactNode
}

const AdminMobileNav = ({ children }: AdminMobileNavProps) => {
    const [open, setOpen] = useState(false)
    const pathname = usePathname()

    // Cierra el cajon al navegar a otra ruta
    useEffect(() => {
        setOpen(false)
    }, [pathname])

    // Bloquea el scroll del body cuando el cajon esta abierto
    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => {
            document.body.style.overflow = ''
        }
    }, [open])

    return (
        <div className="md:hidden">
            {/* Barra superior compacta */}
            <div className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-slate-700">Administracion</p>
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    aria-label="Abrir menu de administracion"
                    aria-expanded={open}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <line x1="3" y1="12" x2="21" y2="12" />
                        <line x1="3" y1="18" x2="21" y2="18" />
                    </svg>
                    Menu
                </button>
            </div>

            {/* Overlay + cajon lateral */}
            {open ? (
                <div className="fixed inset-0 z-40">
                    <div
                        className="absolute inset-0 bg-slate-900/50"
                        onClick={() => setOpen(false)}
                        aria-hidden="true"
                    />
                    <div className="absolute inset-y-0 left-0 flex w-[85%] max-w-sm flex-col overflow-y-auto bg-white shadow-2xl">
                        <div className="flex items-center justify-end p-3">
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                aria-label="Cerrar menu"
                                className="inline-flex size-9 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 transition hover:border-slate-900 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        {children}
                    </div>
                </div>
            ) : null}
        </div>
    )
}

export default AdminMobileNav
