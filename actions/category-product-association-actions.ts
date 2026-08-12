'use server'

import { prisma } from "@/src/lib/prisma"
import { revalidatePath } from "next/cache"
import { isAdminAuthenticated } from "@/src/lib/admin-auth"
import { assignDemoProductCategory, removeDemoProductCategory } from "@/src/demo/demo-store"

type ActionResult = { success: true } | { success: false; message: string }

// Asocia un producto existente a una categoria (Departamento, Categoria o Subcategoria).
export const assignProductToCategory = async (productId: string, categoryId: string): Promise<ActionResult> => {
    if (!(await isAdminAuthenticated())) {
        return { success: false, message: 'No autorizado: inicia sesion como administrador.' }
    }

    if (!productId || !categoryId) {
        return { success: false, message: 'Producto o categoria no validos.' }
    }

    try {
        await prisma.product.update({
            where: { id: productId },
            data: { categoryId },
        })
    } catch {
        const updated = assignDemoProductCategory(productId, categoryId)
        if (!updated) return { success: false, message: 'No se pudo asociar el producto.' }
    }

    revalidatePath('/admin/categories')
    revalidatePath('/admin/products')
    revalidatePath('/')
    return { success: true }
}

// Quita la asociacion de un producto con esta categoria (queda sin categoria, no se elimina).
export const removeProductFromCategory = async (productId: string): Promise<ActionResult> => {
    if (!(await isAdminAuthenticated())) {
        return { success: false, message: 'No autorizado: inicia sesion como administrador.' }
    }

    if (!productId) {
        return { success: false, message: 'Producto no valido.' }
    }

    try {
        await prisma.product.update({
            where: { id: productId },
            data: { categoryId: null },
        })
    } catch {
        const updated = removeDemoProductCategory(productId)
        if (!updated) return { success: false, message: 'No se pudo quitar la asociacion.' }
    }

    revalidatePath('/admin/categories')
    revalidatePath('/admin/products')
    revalidatePath('/')
    return { success: true }
}
