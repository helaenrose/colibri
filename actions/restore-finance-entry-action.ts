'use server'

import { prisma } from "@/src/lib/prisma"
import { OrderIdSchema } from "@/src/schema"
import { revalidatePath } from "next/cache"
import { isAdminAuthenticated } from "@/src/lib/admin-auth"
import { withTimeout } from "@/src/lib/with-timeout"
import { isDemoFallbackEnabled } from "@/src/lib/demo-fallback"
import { restoreDemoFinanceEntry } from "@/src/demo/demo-store"

// Restaura el ingreso archivado de una orden completada. Solo funciona si la
// orden todavia existe; si fue eliminada, el registro no puede restaurarse desde aqui.
export const restoreFinanceEntry = async (data: unknown) => {

    if (!(await isAdminAuthenticated())) {
        return { errors: [{ message: 'No autorizado: inicia sesion como administrador.' }] }
    }

    const result = OrderIdSchema.safeParse(data)
    if (!result.success) {
        return { errors: result.error.issues }
    }

    try {
        const order = await withTimeout(prisma.order.findUnique({ where: { id: result.data.orderId } }))
        if (!order) {
            return { errors: [{ message: 'La orden ya no existe, no se puede restaurar el ingreso.' }] }
        }

        const entry = await withTimeout(prisma.financeEntry.findFirst({
            where: { orderId: order.id, deletedAt: { not: null } },
        }))

        if (!entry) {
            return { errors: [{ message: 'No hay un ingreso archivado para esta orden.' }] }
        }

        await withTimeout(prisma.financeEntry.update({
            where: { id: entry.id },
            data: { deletedAt: null },
        }))
    } catch (error) {
        if (isDemoFallbackEnabled) {
            const restored = restoreDemoFinanceEntry(result.data.orderId)
            if (!restored) {
                return { errors: [{ message: 'No hay un ingreso archivado para esta orden.' }] }
            }
            revalidatePath('/admin/finance')
            revalidatePath('/admin/completed')
            return { success: true, demo: true }
        }

        console.error('Error restoring finance entry', error)
        return { errors: [{ message: 'No se pudo restaurar el ingreso.' }] }
    }

    revalidatePath('/admin/finance')
    revalidatePath('/admin/completed')
    return { success: true }
}
