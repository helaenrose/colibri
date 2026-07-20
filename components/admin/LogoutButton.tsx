"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { logoutAdmin } from "@/actions/admin-session-actions"

export default function LogoutButton() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const handleLogout = async () => {
        setLoading(true)
        try {
            // Cierre de sesión del lado del servidor: borra la cookie de Better Auth
            // y la del acceso de emergencia. Evita el fetch del cliente (poco fiable
            // dentro del iframe de la vista previa por el origen cruzado).
            await logoutAdmin()
            router.replace("/admin/login")
            router.refresh()
        } catch {
            setLoading(false)
        }
    }

    return (
        <button
            type="button"
            onClick={handleLogout}
            disabled={loading}
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-all hover:-translate-y-0.5 hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
            {loading ? "Cerrando..." : "Cerrar sesion"}
        </button>
    )
}
