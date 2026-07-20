'use server'

import { prisma } from "@/src/lib/prisma"
import { revalidatePath } from "next/cache"
import { isAdminAuthenticated } from "@/src/lib/admin-auth"

export const toggleProductActive = async (id: string, active: boolean) => {
    if (!(await isAdminAuthenticated())) {
        return { errors: [{ message: 'No autorizado: inicia sesion como administrador.' }] }
    }

    if (typeof id !== 'string' || id.trim().length === 0) {
        return { errors: [{ message: 'Producto no valido.' }] }
    }

    try {
        await prisma.product.update({
            where: { id },
            data: { active },
        })
    } catch {
        return { errors: [{ message: 'No se pudo actualizar el estado del producto.' }] }
    }

    revalidatePath('/', 'layout')
    revalidatePath('/admin/products')
    return { success: true }
}
