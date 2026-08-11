"use client"

import { useState } from "react"
import Image from "next/image"
import { OrderWithProducts } from "@/src/types"

interface OrderInfoProps {
    order: OrderWithProducts
}

const OrderInfo = ({ order }: OrderInfoProps) => {
    const isDelivery = order.deliveryType === "DELIVERY"
    const [isReceiptOpen, setIsReceiptOpen] = useState(false)

    return (
        <div className="mt-4 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm">
            <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Entrega</span>
                <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${isDelivery ? "bg-sky-100 text-sky-800" : "bg-emerald-100 text-emerald-800"}`}
                >
                    {isDelivery ? "Envio a domicilio" : "Retiro en tienda"}
                </span>
            </div>

            <dl className="space-y-1.5 text-slate-700">
                <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Celular</dt>
                    <dd className="text-right font-medium">{order.phone}</dd>
                </div>
                {order.email ? (
                    <div className="flex justify-between gap-3">
                        <dt className="text-slate-500">Correo</dt>
                        <dd className="break-all text-right font-medium">{order.email}</dd>
                    </div>
                ) : null}
                {isDelivery && order.address ? (
                    <div className="flex justify-between gap-3">
                        <dt className="text-slate-500">Direccion</dt>
                        <dd className="text-right font-medium">{order.address}</dd>
                    </div>
                ) : null}
            </dl>

            <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Comprobante de pago</p>
                <button
                    type="button"
                    onClick={() => setIsReceiptOpen(true)}
                    className="group block w-full overflow-hidden rounded-xl border border-slate-200"
                    aria-label="Ver comprobante de pago en grande"
                >
                    <span className="relative block h-40 w-full bg-white">
                        <Image
                            src={order.receiptUrl}
                            alt={`Comprobante de pago de ${order.name}`}
                            fill
                            sizes="(max-width: 640px) 100vw, 320px"
                            className="object-contain transition group-hover:scale-105"
                        />
                    </span>
                </button>
            </div>

            {isReceiptOpen ? (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4"
                    role="dialog"
                    aria-modal="true"
                    onClick={() => setIsReceiptOpen(false)}
                >
                    <button
                        type="button"
                        onClick={() => setIsReceiptOpen(false)}
                        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
                        aria-label="Cerrar"
                    >
                        <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                        </svg>
                    </button>
                    <div
                        className="relative h-full max-h-[85vh] w-full max-w-3xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Image
                            src={order.receiptUrl}
                            alt={`Comprobante de pago de ${order.name}`}
                            fill
                            sizes="90vw"
                            className="object-contain"
                        />
                    </div>
                </div>
            ) : null}
        </div>
    )
}

export default OrderInfo
