'use server'

import { prisma } from "@/src/lib/prisma"
import { revalidatePath } from "next/cache"
import { isAdminAuthenticated } from "@/src/lib/admin-auth"

export const deleteBankAccount = async (id: string) => {

    if (!(await isAdminAuthenticated())) {
        return { errors: [{ message: 'No autorizado: inicia sesion como administrador.' }] }
    }

    try {
        await prisma.bankAccount.delete({ where: { id } })
    } catch {
        return { errors: [{ message: 'No se pudo eliminar la cuenta bancaria.' }] }
    }

    revalidatePath('/admin/profile')
    revalidatePath('/')
    return { success: true }
}
