'use client'

import { useState, useTransition } from "react"
import { toast } from "react-toastify"
import { recoverFinanceEntry } from "@/actions/recover-finance-entry-action"

interface RecoverFinanceEntryButtonProps {
    orderId: string
}

// Permite recuperar el ingreso financiero de una orden completada cuando en Finanzas
// no hay un registro activo asociado: ya sea porque fue archivado (eliminado) o porque
// nunca se creo (p.ej. ordenes completadas antes de existir este modulo).
const RecoverFinanceEntryButton = ({ orderId }: RecoverFinanceEntryButtonProps) => {
    const [isPending, startTransition] = useTransition()
    const [recovered, setRecovered] = useState(false)

    if (recovered) return null

    const handleRecover = () => {
        startTransition(async () => {
            const response = await recoverFinanceEntry({ orderId })
            if (response?.errors) {
                response.errors.forEach((error) => toast.error(error.message))
                return
            }

            toast.success('Ingreso recuperado en Finanzas')
            setRecovered(true)
        })
    }

    return (
        <button
            type="button"
            onClick={handleRecover}
            disabled={isPending}
            className="mt-3 w-full rounded-md border border-emerald-300 bg-emerald-50 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
            {isPending ? 'Recuperando...' : 'Recuperar ingreso en Finanzas'}
        </button>
    )
}

export default RecoverFinanceEntryButton
