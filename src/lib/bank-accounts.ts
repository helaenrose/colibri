import { prisma } from "@/src/lib/prisma"

export type BankAccountData = {
    id: string
    bankName: string
    ownerName: string
    accountNumber: string
    idNumber: string
    accountType: string
    email: string | null
    logoUrl: string | null
}

export const getBankAccounts = async (): Promise<BankAccountData[]> => {
    try {
        const accounts = await prisma.bankAccount.findMany({ orderBy: { createdAt: "asc" } })
        return accounts.map((account) => ({
            id: account.id,
            bankName: account.bankName,
            ownerName: account.ownerName,
            accountNumber: account.accountNumber,
            idNumber: account.idNumber,
            accountType: account.accountType,
            email: account.email,
            logoUrl: account.logoUrl,
        }))
    } catch {
        return []
    }
}
