'use server'

import { prisma } from '@/src/lib/prisma'
import { revalidatePath } from 'next/cache'
import { isAdminAuthenticated } from '@/src/lib/admin-auth'

type DeleteResult = {
    success?: boolean
    deleted?: number
    skipped?: number
    errors?: { message: string }[]
}

// Elimina multiples productos, omitiendo los que esten asociados a alguna orden.
export const deleteProducts = async (ids: string[]): Promise<DeleteResult> => {
    if (!(await isAdminAuthenticated())) {
        return { errors: [{ message: 'No autorizado: inicia sesion como administrador.' }] }
    }

    const uniqueIds = [...new Set((ids ?? []).filter(Boolean))]
    if (uniqueIds.length === 0) {
        return { errors: [{ message: 'Selecciona al menos un producto.' }] }
    }

    try {
        // Ids de productos que aparecen en alguna orden: NO se pueden eliminar
        const inOrders = await prisma.orderProducts.findMany({
            where: { productId: { in: uniqueIds } },
            select: { productId: true },
            distinct: ['productId'],
        })
        const blocked = new Set(inOrders.map((o) => o.productId))
        const deletable = uniqueIds.filter((id) => !blocked.has(id))

        if (deletable.length === 0) {
            return {
                deleted: 0,
                skipped: uniqueIds.length,
                errors: [
                    {
                        message:
                            'Ninguno se pudo eliminar: todos los seleccionados estan asociados a ordenes.',
                    },
                ],
            }
        }

        // Las relaciones ProductImage se eliminan en cascada (onDelete: Cascade)
        await prisma.product.deleteMany({ where: { id: { in: deletable } } })

        revalidatePath('/admin/products')
        revalidatePath('/admin/media')
        revalidatePath('/')

        return {
            success: true,
            deleted: deletable.length,
            skipped: blocked.size,
        }
    } catch (error) {
        console.log('[v0] deleteProducts error:', error)
        return { errors: [{ message: 'No se pudieron eliminar los productos.' }] }
    }
}
