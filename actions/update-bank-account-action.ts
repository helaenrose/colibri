'use server'

import { prisma } from "@/src/lib/prisma"
import { UpdateBankAccountSchema } from "@/src/schema"
import { revalidatePath } from "next/cache"
import { isAdminAuthenticated } from "@/src/lib/admin-auth"

export const updateBankAccount = async (data: unknown) => {

    if (!(await isAdminAuthenticated())) {
        return { errors: [{ message: 'No autorizado: inicia sesion como administrador.' }] }
    }

    const result = UpdateBankAccountSchema.safeParse(data)
    if (!result.success) {
        return { errors: result.error.issues }
    }

    try {
        await prisma.bankAccount.update({
            where: { id: result.data.id },
            data: {
                bankName: result.data.bankName,
                ownerName: result.data.ownerName,
                accountNumber: result.data.accountNumber,
                idNumber: result.data.idNumber,
                accountType: result.data.accountType,
                email: result.data.email || null,
                logoUrl: result.data.logoUrl || null,
            },
        })
    } catch {
        return { errors: [{ message: 'No se pudo actualizar la cuenta bancaria. Intenta de nuevo.' }] }
    }

    revalidatePath('/admin/profile')
    revalidatePath('/')
    return { success: true }
}
