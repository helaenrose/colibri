'use server'

import { prisma } from "@/src/lib/prisma"
import { FinanceEntryIdSchema } from "@/src/schema"
import { revalidatePath } from "next/cache"
import { isAdminAuthenticated } from "@/src/lib/admin-auth"
import { withTimeout } from "@/src/lib/with-timeout"
import { isDemoFallbackEnabled } from "@/src/lib/demo-fallback"
import { deleteDemoFinanceEntry } from "@/src/demo/demo-store"

// Elimina un registro financiero.
// - Si sigue asociado a una orden existente: se archiva (soft delete). Solo se puede
//   restaurar desde la orden mientras esta exista.
// - Si no tiene orden asociada (manual, o la orden ya fue eliminada): se borra
//   definitivamente y no puede recuperarse.
export const deleteFinanceEntry = async (data: unknown) => {

    if (!(await isAdminAuthenticated())) {
        return { errors: [{ message: 'No autorizado: inicia sesion como administrador.' }] }
    }

    const result = FinanceEntryIdSchema.safeParse(data)
    if (!result.success) {
        return { errors: result.error.issues }
    }

    try {
        const entry = await withTimeout(prisma.financeEntry.findUnique({
            where: { id: result.data.id },
            include: { order: { select: { id: true } } },
        }))

        if (!entry || entry.deletedAt) {
            return { errors: [{ message: 'El registro no existe.' }] }
        }

        if (entry.orderId && entry.order) {
            await withTimeout(prisma.financeEntry.update({
                where: { id: entry.id },
                data: { deletedAt: new Date() },
            }))
            revalidatePath('/admin/finance')
            revalidatePath('/admin/completed')
            return { success: true, archived: true }
        }

        await withTimeout(prisma.financeEntry.delete({ where: { id: entry.id } }))
        revalidatePath('/admin/finance')
        return { success: true, archived: false }
    } catch (error) {
        if (isDemoFallbackEnabled) {
            const removed = deleteDemoFinanceEntry(result.data.id)
            if (!removed) {
                return { errors: [{ message: 'El registro no existe.' }] }
            }
            revalidatePath('/admin/finance')
            revalidatePath('/admin/completed')
            return { success: true, archived: removed.archived, demo: true }
        }

        console.error('Error deleting finance entry', error)
        return { errors: [{ message: 'No se pudo eliminar el registro.' }] }
    }
}
