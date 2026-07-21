'use client'

import { useEffect } from "react"
import { IoClose } from "react-icons/io5"

interface ModalProps {
    open: boolean
    onClose: () => void
    title: string
    description?: string
    children: React.ReactNode
}

// Modal reutilizable: cierra con Escape o clic en el fondo y bloquea el scroll de la pagina.
const Modal = ({ open, onClose, title, description, children }: ModalProps) => {
    useEffect(() => {
        if (!open) return

        const handleKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose()
        }
        document.addEventListener("keydown", handleKey)
        document.body.style.overflow = "hidden"

        return () => {
            document.removeEventListener("keydown", handleKey)
            document.body.style.overflow = ""
        }
    }, [open, onClose])

    if (!open) return null

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm sm:items-center"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            onClick={onClose}
        >
            <div
                className="relative my-8 w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.25)] sm:p-6"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
                        {description ? (
                            <p className="mt-1 text-sm text-slate-600">{description}</p>
                        ) : null}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Cerrar"
                        className="shrink-0 rounded-full border border-slate-200 bg-slate-50 p-2 text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                    >
                        <IoClose size={20} />
                    </button>
                </div>

                <div className="mt-4">{children}</div>
            </div>
        </div>
    )
}

export default Modal
