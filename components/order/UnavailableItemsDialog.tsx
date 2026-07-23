'use client'

import { IoClose } from "react-icons/io5"

interface UnavailableItemsDialogProps {
    unavailableNames: string[]
    onProceed: () => void
    onCancel: () => void
}

/**
 * Diálogo que se muestra cuando el usuario intenta confirmar un pedido y
 * algunos productos ya no están disponibles (inactivos o sin stock).
 *
 * - "Continuar con los disponibles" → elimina los no disponibles del carrito
 *   y deja que el usuario complete el pedido con el resto.
 * - "Volver al carrito" → cierra el diálogo sin modificar nada para que el
 *   usuario pueda agregar otros productos.
 */
const UnavailableItemsDialog = ({
    unavailableNames,
    onProceed,
    onCancel,
}: UnavailableItemsDialogProps) => {
    if (unavailableNames.length === 0) return null

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="unavailable-dialog-title"
        >
            {/* Backdrop */}
            <button
                type="button"
                className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
                aria-label="Cerrar"
                onClick={onCancel}
            />

            {/* Panel */}
            <div className="relative z-10 w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
                <div className="flex items-start justify-between gap-3">
                    <h2
                        id="unavailable-dialog-title"
                        className="text-base font-bold text-slate-900"
                    >
                        Algunos productos ya no estan disponibles
                    </h2>
                    <button
                        type="button"
                        onClick={onCancel}
                        aria-label="Cerrar"
                        className="shrink-0 rounded-full p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                    >
                        <IoClose size={18} />
                    </button>
                </div>

                <p className="mt-2 text-sm text-slate-600">
                    Los siguientes productos fueron inactivados o se agotaron desde que los agregaste al carrito:
                </p>

                <ul className="mt-3 space-y-1.5">
                    {unavailableNames.map((name) => (
                        <li
                            key={name}
                            className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
                        >
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" aria-hidden="true" />
                            {name}
                        </li>
                    ))}
                </ul>

                <p className="mt-3 text-sm text-slate-600">
                    Puedes continuar el pedido con los productos disponibles o volver al carrito para agregar otros.
                </p>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row-reverse">
                    <button
                        type="button"
                        onClick={onProceed}
                        className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 sm:w-auto"
                    >
                        Continuar con los disponibles
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
                    >
                        Volver al carrito
                    </button>
                </div>
            </div>
        </div>
    )
}

export default UnavailableItemsDialog
