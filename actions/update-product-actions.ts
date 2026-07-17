'use server'

import { prisma } from "@/src/lib/prisma"
import { ProductSchema } from "@/src/schema"
import { revalidatePath } from "next/cache"
import { updateDemoProduct } from "@/src/demo/demo-store"
import { isAdminAuthenticated } from "@/src/lib/admin-auth"

export const updateProduct = async (data: unknown, id: string) => {

    if (!(await isAdminAuthenticated())) {
        return {
            errors: [{ message: 'No autorizado: inicia sesion como administrador.' }]
        }
    }

    const result = ProductSchema.safeParse(data)
    if (!result.success) {
        return {
            errors: result.error.issues
        }
    }
    try {
        await prisma.product.update({
            where: {
                id
            },
            data: result.data
        })
    } catch {
        updateDemoProduct(id, result.data)
    }

    revalidatePath('/admin/products')
    return { success: true }
}
