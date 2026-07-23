'use client'

import { useStore } from "@/src/store/store"
import ProductDetails from "./ProductDetails"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { formatCurrency } from "@/src/utils"
import OrderCheckoutForm from "./OrderCheckoutForm"

const OrderSummary = () => {

    const order = useStore(state => state.order)
    const removeItemFromCart = useStore(state => state.removeItemFromCart)
    const total = useMemo(() => order.reduce((total, item) => total + (item.quantity * item.price), 0), [order])
    const totalItems = useMemo(() => order.reduce((acc, item) => acc + item.quantity, 0), [order])
    const [isOpen, setIsOpen] = useState(false)

    // El carrito se rehidrata desde localStorage en el cliente. Mostramos el conteo
    // real solo despues de montar para evitar un desajuste de hidratacion con el SSR.
    const [hydrated, setHydrated] = useState(false)

    // Purga silenciosamente los productos que ya no están disponibles del carrito.
    // Se llama en la hidratación inicial y cada vez que el drawer se abre.
    const purgingRef = useRef(false)
    const purgeUnavailable = useCallback(async (currentOrder: typeof order) => {
        if (purgingRef.current || currentOrder.length === 0) return
        purgingRef.current = true
        try {
            const res = await fetch('/order/api/validate-cart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: currentOrder.map((i) => i.id) }),
            })
            if (!res.ok) return
            const { unavailable } = await res.json() as { unavailable: string[] }
            unavailable.forEach((id) => removeItemFromCart(id))
        } catch {
            // Fallo silencioso: no bloqueamos la experiencia del usuario.
        } finally {
            purgingRef.current = false
        }
    }, [removeItemFromCart])

    useEffect(() => {
        setHydrated(true)
        // Purga al rehidratar (cuando la página carga con un carrito guardado).
        void purgeUnavailable(order)
    // Solo al montar — order no debe estar en las deps para no re-ejecutar en cada cambio.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <>
            <button
                type="button"
                onClick={() => {
                    const opening = !isOpen
                    setIsOpen(opening)
                    if (opening) void purgeUnavailable(order)
                }}
                className="fixed bottom-3 right-3 z-40 inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-xl transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 sm:bottom-5 sm:right-4"
                aria-expanded={isOpen}
                aria-controls="order-summary-drawer"
            >
                Mi pedido
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">{hydrated ? totalItems : 0}</span>
            </button>

            {isOpen && (
                <>
                    <button
                        type="button"
                        className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[1px]"
                        aria-label="Cerrar resumen del pedido"
                        onClick={() => setIsOpen(false)}
                    />

                    <aside
                        id="order-summary-drawer"
                        className="fixed right-0 top-0 z-50 flex h-[100dvh] w-full max-w-[26rem] flex-col rounded-tl-3xl border-l border-gray-200 bg-white p-3 shadow-2xl sm:rounded-none sm:p-4"
                        aria-label="Resumen del pedido"
                    >
                        <div className="flex items-center justify-between border-b border-gray-200 pb-2.5">
                            <h1 className="text-xl font-extrabold sm:text-2xl">Mi pedido</h1>
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="rounded-md border border-gray-300 px-2.5 py-1 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 sm:px-3 sm:py-1.5 sm:text-sm"
                            >
                                Cerrar
                            </button>
                        </div>

                        {order.length < 1 ? (
                            <div className="flex flex-1 items-center justify-center text-center text-sm text-gray-500">
                                No hay productos en tu pedido
                            </div>
                        ) : (
                            <div className="mt-3 flex-1 overflow-y-auto pr-1">
                                <ul className="space-y-2 pb-3">
                                    {order.map((item) => (
                                        <ProductDetails
                                            key={item.id}
                                            item={item}
                                        />
                                    ))}
                                </ul>

                                <div className="border-t border-gray-200 pt-3">
                                    <p className="flex items-center justify-between gap-3 text-base sm:text-lg">
                                        <span className="font-medium text-slate-700">Total a pagar</span>
                                        <span className="text-xl font-black text-slate-900">{formatCurrency(total)}</span>
                                    </p>

                                    <OrderCheckoutForm total={total} onSuccess={() => setIsOpen(false)} />
                                </div>
                            </div>
                        )}
                    </aside>
                </>
            )}
        </>
    )
}

export default OrderSummary
