'use server'

import { prisma } from "@/src/lib/prisma"
import { ProductSchema } from "@/src/schema"
import { createDemoProduct } from "@/src/demo/demo-store"
import { isAdminAuthenticated } from "@/src/lib/admin-auth"

export const createProduct = async (data: unknown) => {
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
        await prisma.product.create({
            data: result.data
        })
    } catch {
        createDemoProduct(result.data)
    }

    return { success: true }
}
