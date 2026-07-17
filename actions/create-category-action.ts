'use server'

import { prisma } from "@/src/lib/prisma"
import { CategorySchema } from "@/src/schema"
import { slugify } from "@/src/lib/categories"
import { revalidatePath } from "next/cache"
import { isAdminAuthenticated } from "@/src/lib/admin-auth"
import type { CategoryLevel } from "@prisma/client"

export const createCategory = async (data: unknown) => {

    if (!(await isAdminAuthenticated())) {
        return { errors: [{ message: 'No autorizado: inicia sesion como administrador.' }] }
    }

    const result = CategorySchema.safeParse(data)
    if (!result.success) {
        return { errors: result.error.issues }
    }

    const { name, level, parentId, code } = result.data

    // Construir slug incluyendo la ruta del padre para evitar colisiones entre ramas
    let parent = null
    if (parentId) {
        parent = await prisma.category.findUnique({ where: { id: parentId } })
        if (!parent) {
            return { errors: [{ message: 'La categoria padre no existe.' }] }
        }
    }

    const slugBase = parent ? `${parent.slug}-${name}` : name
    const slug = slugify(slugBase)
    if (!slug) {
        return { errors: [{ message: 'El nombre no es valido.' }] }
    }

    try {
        const existing = await prisma.category.findUnique({ where: { slug } })
        if (existing) {
            return { errors: [{ message: 'Ya existe un elemento con ese nombre en ese nivel.' }] }
        }

        if (level === 'SUBCATEGORY' && code) {
            const codeTaken = await prisma.category.findUnique({ where: { code } })
            if (codeTaken) {
                return { errors: [{ message: `El codigo "${code}" ya esta en uso.` }] }
            }
        }

        await prisma.category.create({
            data: {
                name,
                slug,
                level: level as CategoryLevel,
                parentId: parentId || null,
                code: level === 'SUBCATEGORY' ? (code || null) : null,
            },
        })
    } catch {
        return { errors: [{ message: 'No se pudo crear. Intenta de nuevo.' }] }
    }

    revalidatePath('/admin/categories')
    revalidatePath('/admin/products')
    revalidatePath('/')
    return { success: true }
}
