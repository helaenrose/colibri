"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/src/lib/auth-client"
import { clearEmergencySession } from "@/actions/admin-session-actions"

export default function LogoutButton() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const handleLogout = async () => {
        setLoading(true)
        // Cierra la sesión de Better Auth (si existe) y limpia el acceso de emergencia.
        try {
            await authClient.signOut()
        } catch {
            // Sin sesión de Better Auth (acceso de emergencia): ignorar.
        }
        await clearEmergencySession()
        router.push("/admin/login")
        router.refresh()
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
