'use server'

import { prisma } from "@/src/lib/prisma"
import { FinanceEntrySchema } from "@/src/schema"
import { revalidatePath } from "next/cache"
import { isAdminAuthenticated } from "@/src/lib/admin-auth"
import { withTimeout } from "@/src/lib/with-timeout"
import { isDemoFallbackEnabled } from "@/src/lib/demo-fallback"
import { createDemoFinanceEntry } from "@/src/demo/demo-store"

// Registra un movimiento manual (ingreso o egreso). Los ingresos de ordenes
// completadas se crean automaticamente y no pasan por esta accion.
export const createFinanceEntry = async (data: unknown) => {

    if (!(await isAdminAuthenticated())) {
        return { errors: [{ message: 'No autorizado: inicia sesion como administrador.' }] }
    }

    const result = FinanceEntrySchema.safeParse(data)
    if (!result.success) {
        return { errors: result.error.issues }
    }

    const { type, amount, description, category, date } = result.data

    try {
        await withTimeout(prisma.financeEntry.create({
            data: {
                type,
                amount,
                description,
                category: category || null,
                date,
            },
        }))
    } catch (error) {
        if (isDemoFallbackEnabled) {
            createDemoFinanceEntry({ type, amount, description, category, date })
            revalidatePath('/admin/finance')
            return { success: true, demo: true }
        }

        console.error('Error creating finance entry', error)
        return { errors: [{ message: 'No se pudo registrar el movimiento.' }] }
    }

    revalidatePath('/admin/finance')
    return { success: true }
}
