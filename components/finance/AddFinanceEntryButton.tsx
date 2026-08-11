'use client'

import { useState } from "react"
import Modal from "@/components/ui/Modal"
import FinanceEntryForm from "@/components/finance/FinanceEntryForm"

const AddFinanceEntryButton = () => {
    const [open, setOpen] = useState(false)

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
                Registrar movimiento
            </button>

            <Modal
                open={open}
                onClose={() => setOpen(false)}
                title="Registrar movimiento"
                description="Agrega un ingreso o egreso manual que no proviene de una orden."
            >
                <FinanceEntryForm onSuccess={() => setOpen(false)} />
            </Modal>
        </>
    )
}

export default AddFinanceEntryButton
