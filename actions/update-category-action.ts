'use server'

import { prisma } from "@/src/lib/prisma"
import { CategorySchema } from "@/src/schema"
import { slugify, collectDescendantIds } from "@/src/lib/categories"
import { revalidatePath } from "next/cache"
import { isAdminAuthenticated } from "@/src/lib/admin-auth"
import type { CategoryLevel } from "@prisma/client"

export const updateCategory = async (id: string, data: unknown) => {

    if (!(await isAdminAuthenticated())) {
        return { errors: [{ message: 'No autorizado: inicia sesion como administrador.' }] }
    }

    const result = CategorySchema.safeParse(data)
    if (!result.success) {
        return { errors: result.error.issues }
    }

    const { name, level, parentId, code, image } = result.data

    const current = await prisma.category.findUnique({ where: { id } })
    if (!current) {
        return { errors: [{ message: 'El elemento no existe.' }] }
    }

    // No permitir que una categoria sea su propio padre o descendiente de si misma
    if (parentId) {
        const all = await prisma.category.findMany()
        const branchIds = collectDescendantIds(all, id)
        if (branchIds.includes(parentId)) {
            return { errors: [{ message: 'No puedes seleccionar la propia categoria o una de sus hijas como padre.' }] }
        }
    }

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
        if (existing && existing.id !== id) {
            return { errors: [{ message: 'Ya existe un elemento con ese nombre en ese nivel.' }] }
        }

        if (level === 'SUBCATEGORY' && code) {
            const codeTaken = await prisma.category.findUnique({ where: { code } })
            if (codeTaken && codeTaken.id !== id) {
                return { errors: [{ message: `El codigo "${code}" ya esta en uso.` }] }
            }
        }

        await prisma.category.update({
            where: { id },
            data: {
                name,
                slug,
                level: level as CategoryLevel,
                parentId: parentId || null,
                code: level === 'SUBCATEGORY' ? (code || null) : null,
                image: image || null,
            },
        })
    } catch {
        return { errors: [{ message: 'No se pudo actualizar. Intenta de nuevo.' }] }
    }

    revalidatePath('/admin/categories')
    revalidatePath('/admin/products')
    revalidatePath('/')
    return { success: true }
}
