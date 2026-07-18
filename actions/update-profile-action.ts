'use server'

import { prisma } from "@/src/lib/prisma"
import { BusinessProfileSchema } from "@/src/schema"
import { revalidatePath } from "next/cache"
import { isAdminAuthenticated } from "@/src/lib/admin-auth"

export const updateBusinessProfile = async (data: unknown) => {

    if (!(await isAdminAuthenticated())) {
        return { errors: [{ message: 'No autorizado: inicia sesion como administrador.' }] }
    }

    const result = BusinessProfileSchema.safeParse(data)
    if (!result.success) {
        return { errors: result.error.issues }
    }

    const payload = {
        name: result.data.name,
        tagline: result.data.tagline || null,
        phone: result.data.phone || null,
        email: result.data.email || null,
        address: result.data.address || null,
        image: result.data.image || null,
        googleReviewsUrl: result.data.googleReviewsUrl || null,
    }

    try {
        const existing = await prisma.businessProfile.findFirst()
        if (existing) {
            await prisma.businessProfile.update({
                where: { id: existing.id },
                data: payload,
            })
        } else {
            await prisma.businessProfile.create({ data: payload })
        }
    } catch {
        return { errors: [{ message: 'No se pudo guardar el perfil. Intenta de nuevo.' }] }
    }

    revalidatePath('/', 'layout')
    revalidatePath('/admin/profile')
    return { success: true }
}
