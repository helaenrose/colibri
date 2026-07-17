'use server'

import { prisma } from "@/src/lib/prisma"
import { collectDescendantIds } from "@/src/lib/categories"
import { revalidatePath } from "next/cache"
import { isAdminAuthenticated } from "@/src/lib/admin-auth"

export const deleteCategory = async (id: string) => {

    if (!(await isAdminAuthenticated())) {
        return { errors: [{ message: 'No autorizado: inicia sesion como administrador.' }] }
    }

    try {
        const all = await prisma.category.findMany()
        const branchIds = collectDescendantIds(all, id)

        // No permitir borrar si hay productos asignados en cualquier parte de la rama
        const productCount = await prisma.product.count({ where: { categoryId: { in: branchIds } } })
        if (productCount > 0) {
            return { errors: [{ message: 'No puedes eliminar: hay productos asociados en esta rama.' }] }
        }

        // Borrar en cascada (los hijos se eliminan por onDelete: Cascade)
        await prisma.category.delete({ where: { id } })
    } catch {
        return { errors: [{ message: 'No se pudo eliminar.' }] }
    }

    revalidatePath('/admin/categories')
    revalidatePath('/admin/products')
    revalidatePath('/')
    return { success: true }
}
