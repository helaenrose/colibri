'use server'

import { prisma } from "@/src/lib/prisma"
import { revalidatePath } from "next/cache"
import { isAdminAuthenticated } from "@/src/lib/admin-auth"

export const updateInstructionSteps = async (steps: unknown) => {
    if (!(await isAdminAuthenticated())) {
        return { errors: [{ message: 'No autorizado: inicia sesion como administrador.' }] }
    }

    if (!Array.isArray(steps) || steps.some((s) => typeof s !== 'string')) {
        return { errors: [{ message: 'Formato de pasos no valido.' }] }
    }

    // Limpia espacios y descarta pasos vacios
    const cleaned = (steps as string[])
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
        .slice(0, 12)

    if (cleaned.length === 0) {
        return { errors: [{ message: 'Agrega al menos un paso.' }] }
    }

    if (cleaned.some((s) => s.length > 160)) {
        return { errors: [{ message: 'Cada paso puede tener maximo 160 caracteres.' }] }
    }

    try {
        const existing = await prisma.businessProfile.findFirst()
        if (existing) {
            await prisma.businessProfile.update({
                where: { id: existing.id },
                data: { instructionSteps: cleaned },
            })
        } else {
            await prisma.businessProfile.create({
                data: { name: 'Mi Tienda de Abarrotes', instructionSteps: cleaned },
            })
        }
    } catch {
        return { errors: [{ message: 'No se pudieron guardar los pasos. Intenta de nuevo.' }] }
    }

    revalidatePath('/', 'layout')
    revalidatePath('/admin/profile')
    return { success: true }
}
