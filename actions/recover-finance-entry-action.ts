'use server'

import { prisma } from "@/src/lib/prisma"
import { OrderIdSchema } from "@/src/schema"
import { revalidatePath } from "next/cache"
import { isAdminAuthenticated } from "@/src/lib/admin-auth"
import { withTimeout } from "@/src/lib/with-timeout"
import { isDemoFallbackEnabled } from "@/src/lib/demo-fallback"
import { recoverDemoFinanceEntry } from "@/src/demo/demo-store"

// Recupera el ingreso financiero de una orden completada:
// - Si el registro fue archivado (eliminado desde Finanzas), lo restaura.
// - Si nunca se creo (p.ej. una orden completada antes de existir este modulo), lo genera
//   de nuevo a partir de los datos de la orden.
// Solo funciona si la orden todavia existe.
export const recoverFinanceEntry = async (data: unknown) => {

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
            return { errors: [{ message: 'La orden ya no existe, no se puede recuperar el ingreso.' }] }
        }

        const activeEntry = await withTimeout(prisma.financeEntry.findFirst({
            where: { orderId: order.id, deletedAt: null },
        }))
        if (activeEntry) {
            return { errors: [{ message: 'Esta orden ya tiene un ingreso registrado en Finanzas.' }] }
        }

        const archivedEntry = await withTimeout(prisma.financeEntry.findFirst({
            where: { orderId: order.id, deletedAt: { not: null } },
        }))

        if (archivedEntry) {
            await withTimeout(prisma.financeEntry.update({
                where: { id: archivedEntry.id },
                data: { deletedAt: null },
            }))
        } else {
            await withTimeout(prisma.financeEntry.create({
                data: {
                    type: 'INCOME',
                    amount: order.total,
                    description: `Orden completada - ${order.name}`,
                    category: 'Ventas',
                    date: order.orderReadyAt ?? new Date(),
                    orderId: order.id,
                    orderCustomerName: order.name,
                },
            }))
        }
    } catch (error) {
        if (isDemoFallbackEnabled) {
            const recovered = recoverDemoFinanceEntry(result.data.orderId)
            if (!recovered) {
                return { errors: [{ message: 'No se pudo recuperar el ingreso de esta orden.' }] }
            }
            revalidatePath('/admin/finance')
            revalidatePath('/admin/completed')
            return { success: true, demo: true }
        }

        console.error('Error recovering finance entry', error)
        return { errors: [{ message: 'No se pudo recuperar el ingreso.' }] }
    }

    revalidatePath('/admin/finance')
    revalidatePath('/admin/completed')
    return { success: true }
}
