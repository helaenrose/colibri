'use client'

import { useState, useTransition } from "react"
import { toast } from "react-toastify"
import { restoreFinanceEntry } from "@/actions/restore-finance-entry-action"

interface RestoreFinanceEntryButtonProps {
    orderId: string
}

// Permite restaurar el ingreso financiero de una orden completada cuando este
// fue eliminado (archivado) desde el modulo de Finanzas.
const RestoreFinanceEntryButton = ({ orderId }: RestoreFinanceEntryButtonProps) => {
    const [isPending, startTransition] = useTransition()
    const [restored, setRestored] = useState(false)

    if (restored) return null

    const handleRestore = () => {
        startTransition(async () => {
            const response = await restoreFinanceEntry({ orderId })
            if (response?.errors) {
                response.errors.forEach((error) => toast.error(error.message))
                return
            }

            toast.success('Ingreso restaurado en Finanzas')
            setRestored(true)
        })
    }

    return (
        <button
            type="button"
            onClick={handleRestore}
            disabled={isPending}
            className="mt-3 w-full rounded-md border border-emerald-300 bg-emerald-50 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
            {isPending ? 'Restaurando...' : 'Restaurar ingreso archivado'}
        </button>
    )
}

export default RestoreFinanceEntryButton
