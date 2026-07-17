"use server"

import { cookies } from "next/headers"
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
