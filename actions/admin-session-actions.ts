"use server"

import { cookies, headers } from "next/headers"
import { auth } from "@/src/lib/auth"
import {
    EMERGENCY_COOKIE_NAME,
    checkEmergencyCredentials,
    getEmergencyToken,
} from "@/src/lib/admin-auth"

/**
 * Acceso de emergencia: valida ADMIN_BASIC_USER / ADMIN_BASIC_PASSWORD y crea
 * una cookie de sesión firmada sin pasar por Better Auth.
 */
export const emergencyLogin = async (user: string, password: string) => {
    if (!checkEmergencyCredentials(user.trim(), password)) {
        return { ok: false as const, error: "Credenciales de emergencia invalidas." }
    }

    const cookieStore = await cookies()
    cookieStore.set(EMERGENCY_COOKIE_NAME, getEmergencyToken(), {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/",
        maxAge: 60 * 60 * 8, // 8 horas
    })

    return { ok: true as const }
}

/**
 * Limpia la cookie del acceso de emergencia (si existe).
 */
export const clearEmergencySession = async () => {
    const cookieStore = await cookies()
    cookieStore.delete(EMERGENCY_COOKIE_NAME)
}

/**
 * Cierra la sesión del administrador completamente del lado del servidor.
 * Esto evita depender del fetch del cliente de Better Auth, que es poco
 * fiable dentro del iframe de la vista previa (origen cruzado).
 */
export const logoutAdmin = async () => {
    // Cierra la sesión de Better Auth (si existe). El plugin nextCookies()
    // se encarga de borrar la cookie de sesión en la respuesta.
    try {
        await auth.api.signOut({ headers: await headers() })
    } catch {
        // Sin sesión de Better Auth (p. ej. acceso de emergencia): ignorar.
    }

    // Limpia también la cookie del acceso de emergencia.
    const cookieStore = await cookies()
    cookieStore.delete(EMERGENCY_COOKIE_NAME)

    return { ok: true as const }
}
