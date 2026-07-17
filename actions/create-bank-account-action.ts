'use server'

import { prisma } from "@/src/lib/prisma"
import { BankAccountSchema } from "@/src/schema"
import { revalidatePath } from "next/cache"
import { isAdminAuthenticated } from "@/src/lib/admin-auth"

export const createBankAccount = async (data: unknown) => {

    if (!(await isAdminAuthenticated())) {
        return { errors: [{ message: 'No autorizado: inicia sesion como administrador.' }] }
    }

    const result = BankAccountSchema.safeParse(data)
    if (!result.success) {
        return { errors: result.error.issues }
    }

    try {
        await prisma.bankAccount.create({
            data: {
                bankName: result.data.bankName,
                ownerName: result.data.ownerName,
                idNumber: result.data.idNumber,
                accountType: result.data.accountType,
                email: result.data.email || null,
            },
        })
    } catch {
        return { errors: [{ message: 'No se pudo agregar la cuenta bancaria. Intenta de nuevo.' }] }
    }

    revalidatePath('/admin/profile')
    revalidatePath('/')
    return { success: true }
}
