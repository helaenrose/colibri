import { prisma } from "@/src/lib/prisma"

export type BankAccountData = {
    id: string
    bankName: string
    ownerName: string
    idNumber: string
    accountType: string
    email: string | null
}

export const getBankAccounts = async (): Promise<BankAccountData[]> => {
    try {
        const accounts = await prisma.bankAccount.findMany({ orderBy: { createdAt: "asc" } })
        return accounts.map((account) => ({
            id: account.id,
            bankName: account.bankName,
            ownerName: account.ownerName,
            idNumber: account.idNumber,
            accountType: account.accountType,
            email: account.email,
        }))
    } catch {
        return []
    }
}
