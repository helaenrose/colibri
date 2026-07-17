'use server'

import { prisma } from "@/src/lib/prisma"
import { CategorySchema } from "@/src/schema"
import { revalidatePath } from "next/cache"
import { isAdminAuthenticated } from "@/src/lib/admin-auth"

const slugify = (value: string) =>
    value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')

export const createCategory = async (data: unknown) => {

    if (!(await isAdminAuthenticated())) {
        return { errors: [{ message: 'No autorizado: inicia sesion como administrador.' }] }
    }

    const result = CategorySchema.safeParse(data)
    if (!result.success) {
        return { errors: result.error.issues }
    }

    const slug = slugify(result.data.name)
    if (!slug) {
        return { errors: [{ message: 'El nombre de la categoria no es valido.' }] }
    }

    try {
        const existing = await prisma.category.findFirst({ where: { slug } })
        if (existing) {
            return { errors: [{ message: 'Ya existe una categoria con ese nombre.' }] }
        }

        await prisma.category.create({
            data: {
                name: result.data.name,
                slug,
            },
        })
    } catch {
        return { errors: [{ message: 'No se pudo crear la categoria. Intenta de nuevo.' }] }
    }

    revalidatePath('/admin/categories')
    revalidatePath('/admin/products')
    return { success: true }
}
