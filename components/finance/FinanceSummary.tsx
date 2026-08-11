import { formatCurrency } from "@/src/utils"

interface FinanceSummaryProps {
    totalIncome: number
    totalExpense: number
    periodLabel: string
}

const FinanceSummary = ({ totalIncome, totalExpense, periodLabel }: FinanceSummaryProps) => {
    const balance = totalIncome - totalExpense

    return (
        <section className="grid gap-4 sm:grid-cols-3" aria-label={`Resumen financiero - ${periodLabel}`}>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_16px_50px_rgba(15,23,42,0.06)]">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Ingresos · {periodLabel}</p>
                <p className="mt-2 text-2xl font-black tracking-tight text-emerald-600">{formatCurrency(totalIncome)}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_16px_50px_rgba(15,23,42,0.06)]">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Egresos · {periodLabel}</p>
                <p className="mt-2 text-2xl font-black tracking-tight text-red-600">{formatCurrency(totalExpense)}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_16px_50px_rgba(15,23,42,0.06)]">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Balance · {periodLabel}</p>
                <p className={`mt-2 text-2xl font-black tracking-tight ${balance >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
                    {formatCurrency(balance)}
                </p>
            </div>
        </section>
    )
}

export default FinanceSummary
