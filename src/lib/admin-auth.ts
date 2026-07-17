import "server-only"

import { headers } from "next/headers"
import { auth } from "@/src/lib/auth"

/**
 * Devuelve la sesión de Better Auth para el administrador autenticado,
 * o null si no hay sesión válida. Existe un único rol: administrador.
 */
export const getAdminSession = async () => {
    const session = await auth.api.getSession({ headers: await headers() })
    return session
}

/**
 * Indica si la petición actual pertenece a un administrador autenticado.
 */
export const isAdminAuthenticated = async () => {
    const session = await getAdminSession()
    return Boolean(session?.user)
}
