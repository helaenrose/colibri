import "server-only"

import { createHmac, timingSafeEqual } from "crypto"
import { cookies, headers } from "next/headers"
import { auth } from "@/src/lib/auth"

/**
 * Nombre de la cookie usada por el acceso de emergencia (no pasa por Better Auth).
 */
export const EMERGENCY_COOKIE_NAME = "admin_emergency"

/**
 * Devuelve la sesión de Better Auth para el administrador autenticado,
 * o null si no hay sesión válida. Existe un único rol: administrador.
 */
export const getAdminSession = async () => {
    const session = await auth.api.getSession({ headers: await headers() })
    return session
}

/**
 * Compara de forma segura dos strings (evita ataques de temporización).
 */
const safeEqual = (a: string, b: string) => {
    const bufA = Buffer.from(a)
    const bufB = Buffer.from(b)
    if (bufA.length !== bufB.length) return false
    return timingSafeEqual(bufA, bufB)
}

/**
 * Token firmado que representa una sesión de emergencia. Solo puede generarlo
 * quien conoce BETTER_AUTH_SECRET, y la cookie se marca httpOnly.
 */
export const getEmergencyToken = () => {
    const secret = process.env.BETTER_AUTH_SECRET ?? ""
    return createHmac("sha256", secret).update("admin-emergency-v1").digest("hex")
}

/**
 * Valida las credenciales de emergencia contra ADMIN_BASIC_USER / ADMIN_BASIC_PASSWORD.
 */
export const checkEmergencyCredentials = (user: string, password: string) => {
    const expectedUser = process.env.ADMIN_BASIC_USER
    const expectedPassword = process.env.ADMIN_BASIC_PASSWORD
    if (!expectedUser || !expectedPassword) return false
    return safeEqual(user, expectedUser) && safeEqual(password, expectedPassword)
}

/**
 * Indica si la cookie de emergencia presente es válida.
 */
export const hasValidEmergencyCookie = async () => {
    const cookieStore = await cookies()
    const token = cookieStore.get(EMERGENCY_COOKIE_NAME)?.value
    if (!token) return false
    return safeEqual(token, getEmergencyToken())
}

/**
 * Indica si la petición actual pertenece a un administrador autenticado,
 * ya sea por Better Auth o por el acceso de emergencia.
 */
export const isAdminAuthenticated = async () => {
    const session = await getAdminSession()
    if (session?.user) return true
    return hasValidEmergencyCookie()
}
