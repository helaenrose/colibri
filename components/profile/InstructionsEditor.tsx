'use client'

import { updateInstructionSteps } from "@/actions/update-instructions-action"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "react-toastify"

const InstructionsEditor = ({ steps }: { steps: string[] }) => {
    const router = useRouter()
    const [items, setItems] = useState<string[]>(steps.length > 0 ? steps : [""])
    const [isPending, startTransition] = useTransition()

    const updateItem = (index: number, value: string) => {
        setItems((prev) => prev.map((item, i) => (i === index ? value : item)))
    }

    const addItem = () => {
        if (items.length >= 12) {
            toast.info("Puedes tener hasta 12 pasos.")
            return
        }
        setItems((prev) => [...prev, ""])
    }

    const removeItem = (index: number) => {
        setItems((prev) => prev.filter((_, i) => i !== index))
    }

    const move = (index: number, dir: -1 | 1) => {
        setItems((prev) => {
            const next = [...prev]
            const target = index + dir
            if (target < 0 || target >= next.length) return prev
            ;[next[index], next[target]] = [next[target], next[index]]
            return next
        })
    }

    const handleSave = () => {
        const cleaned = items.map((s) => s.trim()).filter((s) => s.length > 0)
        if (cleaned.length === 0) {
            toast.error("Agrega al menos un paso.")
            return
        }

        startTransition(async () => {
            const response = await updateInstructionSteps(cleaned)
            if (response?.errors) {
                response.errors.forEach((e) => toast.error(e.message))
                return
            }
            toast.success("Instrucciones actualizadas")
            router.refresh()
        })
    }

    return (
        <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_16px_50px_rgba(15,23,42,0.06)] sm:p-6">
            <ol className="space-y-3">
                {items.map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                        <span className="mt-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-black text-amber-300">
                            {index + 1}
                        </span>
                        <input
                            type="text"
                            value={item}
                            maxLength={160}
                            onChange={(e) => updateItem(index, e.target.value)}
                            placeholder={`Paso ${index + 1}`}
                            className="block w-full rounded-md border border-slate-200 bg-slate-100 p-3 focus:outline-none focus:ring-2 focus:ring-amber-400"
                        />
                        <div className="flex shrink-0 items-center gap-1 pt-1.5">
                            <button
                                type="button"
                                onClick={() => move(index, -1)}
                                disabled={index === 0}
                                aria-label={`Subir paso ${index + 1}`}
                                className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                ↑
                            </button>
                            <button
                                type="button"
                                onClick={() => move(index, 1)}
                                disabled={index === items.length - 1}
                                aria-label={`Bajar paso ${index + 1}`}
                                className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                ↓
                            </button>
                            <button
                                type="button"
                                onClick={() => removeItem(index)}
                                aria-label={`Eliminar paso ${index + 1}`}
                                className="flex h-8 w-8 items-center justify-center rounded-full border border-red-200 text-red-600 transition hover:border-red-400 hover:bg-red-50"
                            >
                                ✕
                            </button>
                        </div>
                    </li>
                ))}
            </ol>

            <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <button
                    type="button"
                    onClick={addItem}
                    className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
                >
                    + Agregar paso
                </button>
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={isPending}
                    className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isPending ? "Guardando..." : "Guardar instrucciones"}
                </button>
            </div>
        </div>
    )
}

export default InstructionsEditor
