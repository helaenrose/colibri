import Heading from "@/components/ui/Heading"
import EmptyState from "@/components/ui/EmptyState"
import FinanceFilters from "@/components/finance/FinanceFilters"
import FinanceSummary from "@/components/finance/FinanceSummary"
import FinanceEntryTable, { type FinanceEntryRow } from "@/components/finance/FinanceEntryTable"
import AddFinanceEntryButton from "@/components/finance/AddFinanceEntryButton"
import { prisma } from "@/src/lib/prisma"
import { getDemoFinanceEntries } from "@/src/demo/demo-store"
import { isFinancePeriod, resolveFinancePeriodRange, financePeriodLabels, type FinancePeriod } from "@/src/lib/finance-period"
import type { Prisma, FinanceEntryType } from "@prisma/client"

type Filters = {
    period: FinancePeriod
    type?: string
    search?: string
}

const buildWhere = (filters: Filters, from: Date, to: Date): Prisma.FinanceEntryWhereInput => {
    const where: Prisma.FinanceEntryWhereInput = {
        deletedAt: null,
        date: { gte: from, lte: to },
    }

    if (filters.type === 'INCOME' || filters.type === 'EXPENSE') {
        where.type = filters.type as FinanceEntryType
    }

    if (filters.search) {
        where.OR = [
            { description: { contains: filters.search, mode: 'insensitive' } },
            { category: { contains: filters.search, mode: 'insensitive' } },
            { orderCustomerName: { contains: filters.search, mode: 'insensitive' } },
        ]
    }

    return where
}

const filterDemoEntries = (filters: Filters, from: Date, to: Date) => {
    const term = filters.search?.trim().toLowerCase()
    return getDemoFinanceEntries().filter((entry) => {
        if (entry.deletedAt) return false
        const entryDate = new Date(entry.date)
        if (entryDate < from || entryDate > to) return false
        if (filters.type === 'INCOME' || filters.type === 'EXPENSE') {
            if (entry.type !== filters.type) return false
        }
        if (term) {
            const haystack = `${entry.description} ${entry.category ?? ''} ${entry.orderCustomerName ?? ''}`.toLowerCase()
            if (!haystack.includes(term)) return false
        }
        return true
    })
}

const getEntries = async (filters: Filters, from: Date, to: Date): Promise<FinanceEntryRow[]> => {
    try {
        return await prisma.financeEntry.findMany({
            where: buildWhere(filters, from, to),
            orderBy: { date: 'desc' },
        })
    } catch {
        return filterDemoEntries(filters, from, to)
    }
}

const FinancePage = async ({
    searchParams,
}: {
    searchParams: Promise<{ period?: string; type?: string; search?: string }>
}) => {
    const { period, type, search } = await searchParams
    const resolvedPeriod: FinancePeriod = isFinancePeriod(period) ? period : 'day'
    const { from, to } = resolveFinancePeriodRange(resolvedPeriod)

    const filters: Filters = { period: resolvedPeriod, type, search }
    const entries = await getEntries(filters, from, to)

    const totalIncome = entries.filter((entry) => entry.type === 'INCOME').reduce((sum, entry) => sum + entry.amount, 0)
    const totalExpense = entries.filter((entry) => entry.type === 'EXPENSE').reduce((sum, entry) => sum + entry.amount, 0)

    return (
        <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white/85 p-5 shadow-[0_16px_50px_rgba(15,23,42,0.07)] backdrop-blur sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">Administracion</p>
                        <Heading>Finanzas</Heading>
                        <p className="-mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
                            Consulta ingresos y egresos del negocio. Las ordenes completadas generan un ingreso automaticamente.
                        </p>
                    </div>

                    <AddFinanceEntryButton />
                </div>
            </section>

            <FinanceSummary totalIncome={totalIncome} totalExpense={totalExpense} periodLabel={financePeriodLabels[resolvedPeriod]} />

            <FinanceFilters resultCount={entries.length} />

            {entries.length ? (
                <FinanceEntryTable entries={entries} />
            ) : (
                <EmptyState message="No hay movimientos para este filtro" />
            )}
        </div>
    )
}

export default FinancePage
