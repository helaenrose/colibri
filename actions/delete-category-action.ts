'use server'

import { prisma } from "@/src/lib/prisma"
import { revalidatePath } from "next/cache"
import { isAdminAuthenticated } from "@/src/lib/admin-auth"

export const deleteCategory = async (id: string) => {

    if (!(await isAdminAuthenticated())) {
        return { errors: [{ message: 'No autorizado: inicia sesion como administrador.' }] }
    }

    try {
        const productCount = await prisma.product.count({ where: { categoryId: id } })
        if (productCount > 0) {
            return { errors: [{ message: 'No puedes eliminar una categoria con productos asociados.' }] }
        }

        await prisma.category.delete({ where: { id } })
    } catch {
        return { errors: [{ message: 'No se pudo eliminar la categoria.' }] }
    }

    revalidatePath('/admin/categories')
    revalidatePath('/admin/products')
    return { success: true }
}
