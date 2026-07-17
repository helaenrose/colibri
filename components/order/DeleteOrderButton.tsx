'use client'

import { useState } from "react"
import { mutate } from "swr"
import { toast } from "react-toastify"
import { OrderWithProducts } from "@/src/types"
import { notifyOrderUpdate } from "@/src/hooks/useOrderChannelSync"

interface DeleteOrderButtonProps {
    orderId: string
    mutateKey: string
}

const DeleteOrderButton = ({ orderId, mutateKey }: DeleteOrderButtonProps) => {
    const [isDeleting, setIsDeleting] = useState(false)
    const [confirming, setConfirming] = useState(false)

    const handleDelete = async () => {
        if (isDeleting) return
        setIsDeleting(true)

        try {
            await mutate<OrderWithProducts[]>(
                mutateKey,
                async (currentOrders = []) => {
                    const request = await fetch('/admin/orders/api/delete', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ orderId }),
                    })

                    const response = await request.json()
                    if (!request.ok || !response?.success) {
                        throw new Error('No se pudo eliminar la orden')
                    }

                    notifyOrderUpdate()
                    return currentOrders.filter((currentOrder) => currentOrder.id !== orderId)
                },
                {
                    optimisticData: (currentOrders = []) => currentOrders.filter((currentOrder) => currentOrder.id !== orderId),
                    rollbackOnError: true,
                    revalidate: false,
                    populateCache: true,
                },
            )

            toast.success('Orden eliminada')
        } catch {
            toast.error('No se pudo eliminar la orden')
        } finally {
            setIsDeleting(false)
            setConfirming(false)
        }
    }

    if (confirming) {
        return (
            <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3">
                <p className="text-sm font-medium text-red-800">
                    Se eliminara la orden y su comprobante de pago. Esta accion no se puede deshacer.
                </p>
                <div className="mt-3 flex gap-2">
                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="flex-1 rounded-md bg-red-600 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isDeleting ? 'Eliminando...' : 'Si, eliminar'}
                    </button>
                    <button
                        type="button"
                        onClick={() => setConfirming(false)}
                        disabled={isDeleting}
                        className="flex-1 rounded-md border border-slate-300 bg-white py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        )
    }

    return (
        <button
            type="button"
            onClick={() => setConfirming(true)}
            className="mt-3 w-full rounded-md border border-red-300 bg-white py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
        >
            Eliminar orden
        </button>
    )
}

export default DeleteOrderButton
