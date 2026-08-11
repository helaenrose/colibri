'use client'

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "react-toastify"
import { createFinanceEntry } from "@/actions/create-finance-entry-action"

interface FinanceEntryFormProps {
    onSuccess: () => void
}

const todayInputValue = () => new Date().toISOString().slice(0, 10)

// Formulario para registrar movimientos manuales (ingresos o egresos que no
// provienen de una orden, por ejemplo compras de insumos o ingresos externos).
const FinanceEntryForm = ({ onSuccess }: FinanceEntryFormProps) => {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [errors, setErrors] = useState<string[]>([])

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setErrors([])

        const formData = new FormData(event.currentTarget)
        const payload = {
            type: formData.get('type'),
            amount: formData.get('amount'),
            description: formData.get('description'),
            category: formData.get('category'),
            date: formData.get('date'),
        }

        startTransition(async () => {
            const response = await createFinanceEntry(payload)
            if (response?.errors) {
                setErrors(response.errors.map((error) => error.message))
                return
            }

            toast.success('Movimiento registrado correctamente')
            router.refresh()
            onSuccess()
        })
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {errors.length > 0 ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    <ul className="list-inside list-disc space-y-1">
                        {errors.map((message, index) => (
                            <li key={index}>{message}</li>
                        ))}
                    </ul>
                </div>
            ) : null}

            <label className="flex flex-col gap-1 text-sm">
                <span className="font-semibold text-slate-700">Tipo de movimiento</span>
                <select
                    name="type"
                    required
                    defaultValue="EXPENSE"
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
                >
                    <option value="EXPENSE">Egreso</option>
                    <option value="INCOME">Ingreso</option>
                </select>
            </label>

            <label className="flex flex-col gap-1 text-sm">
                <span className="font-semibold text-slate-700">Monto</span>
                <input
                    type="number"
                    name="amount"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
                />
            </label>

            <label className="flex flex-col gap-1 text-sm">
                <span className="font-semibold text-slate-700">Descripcion</span>
                <input
                    type="text"
                    name="description"
                    required
                    minLength={3}
                    placeholder="Ej. Compra de insumos de limpieza"
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
                />
            </label>

            <label className="flex flex-col gap-1 text-sm">
                <span className="font-semibold text-slate-700">Categoria (opcional)</span>
                <input
                    type="text"
                    name="category"
                    placeholder="Ej. Insumos, Servicios, Ventas"
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
                />
            </label>

            <label className="flex flex-col gap-1 text-sm">
                <span className="font-semibold text-slate-700">Fecha</span>
                <input
                    type="date"
                    name="date"
                    required
                    defaultValue={todayInputValue()}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
                />
            </label>

            <button
                type="submit"
                disabled={isPending}
                className="mt-2 inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
                {isPending ? 'Guardando...' : 'Registrar movimiento'}
            </button>
        </form>
    )
}

export default FinanceEntryForm
