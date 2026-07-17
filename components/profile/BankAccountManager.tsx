'use client'

import { createBankAccount } from "@/actions/create-bank-account-action"
import { deleteBankAccount } from "@/actions/delete-bank-account-action"
import { BankAccountSchema } from "@/src/schema"
import { useToastZodErrors } from "@/src/hooks/useToastZodErrors"
import { FormEvent, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "react-toastify"
import type { BankAccountData } from "@/src/lib/bank-accounts"

const emptyForm = {
    bankName: '',
    ownerName: '',
    idNumber: '',
    accountType: '',
    email: '',
}

const BankAccountManager = ({ accounts }: { accounts: BankAccountData[] }) => {

    const router = useRouter()
    const { showIssues } = useToastZodErrors()
    const [form, setForm] = useState(emptyForm)
    const [isPending, startTransition] = useTransition()
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const handleChange = (field: keyof typeof emptyForm) => (event: React.ChangeEvent<HTMLInputElement>) => {
        setForm((prev) => ({ ...prev, [field]: event.target.value }))
    }

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        const result = BankAccountSchema.safeParse(form)
        if (!result.success) {
            showIssues(result.error.issues)
            return
        }

        startTransition(async () => {
            const response = await createBankAccount(result.data)
            if (response?.errors) {
                response.errors.forEach((error) => toast.error(error.message))
                return
            }
            toast.success('Cuenta bancaria agregada')
            setForm(emptyForm)
            router.refresh()
        })
    }

    const handleDelete = (id: string) => {
        setDeletingId(id)
        startTransition(async () => {
            const response = await deleteBankAccount(id)
            if (response?.errors) {
                response.errors.forEach((error) => toast.error(error.message))
                setDeletingId(null)
                return
            }
            toast.success('Cuenta bancaria eliminada')
            setDeletingId(null)
            router.refresh()
        })
    }

    const inputClass =
        "block w-full rounded-md border border-slate-200 bg-slate-100 p-3 focus:outline-none focus:ring-2 focus:ring-amber-400"

    return (
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <form
                onSubmit={handleSubmit}
                noValidate
                className="h-fit rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_16px_50px_rgba(15,23,42,0.06)] sm:p-6"
            >
                <h2 className="text-lg font-bold text-slate-900">Nueva cuenta bancaria</h2>
                <p className="mt-1 text-sm text-slate-600">
                    Registra las cuentas donde tus clientes pueden realizar el pago. Se mostraran en el sitio publico.
                </p>

                <div className="mt-4 space-y-3">
                    <div className="space-y-1.5">
                        <label htmlFor="bankName" className="text-sm font-semibold text-slate-800">Banco</label>
                        <input id="bankName" type="text" value={form.bankName} onChange={handleChange('bankName')} placeholder="Ej. Banco Pichincha" className={inputClass} />
                    </div>
                    <div className="space-y-1.5">
                        <label htmlFor="ownerName" className="text-sm font-semibold text-slate-800">Titular de la cuenta</label>
                        <input id="ownerName" type="text" value={form.ownerName} onChange={handleChange('ownerName')} placeholder="Ej. Maria Perez" className={inputClass} />
                    </div>
                    <div className="space-y-1.5">
                        <label htmlFor="idNumber" className="text-sm font-semibold text-slate-800">Numero de cuenta / Cedula</label>
                        <input id="idNumber" type="text" value={form.idNumber} onChange={handleChange('idNumber')} placeholder="Ej. 2200123456" className={inputClass} />
                    </div>
                    <div className="space-y-1.5">
                        <label htmlFor="accountType" className="text-sm font-semibold text-slate-800">Tipo de cuenta</label>
                        <input id="accountType" type="text" value={form.accountType} onChange={handleChange('accountType')} placeholder="Ej. Ahorros / Corriente" className={inputClass} />
                    </div>
                    <div className="space-y-1.5">
                        <label htmlFor="bankEmail" className="text-sm font-semibold text-slate-800">Correo (opcional)</label>
                        <input id="bankEmail" type="email" value={form.email} onChange={handleChange('email')} placeholder="Ej. pagos@negocio.com" className={inputClass} />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isPending}
                    className="mt-5 w-full rounded-md bg-slate-900 p-3 font-semibold text-white transition-all hover:bg-slate-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isPending ? 'Guardando...' : 'Agregar cuenta'}
                </button>
            </form>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_16px_50px_rgba(15,23,42,0.06)] sm:p-6">
                <h2 className="text-lg font-bold text-slate-900">Cuentas registradas</h2>
                {accounts.length ? (
                    <ul className="mt-4 space-y-3">
                        {accounts.map((account) => (
                            <li
                                key={account.id}
                                className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                            >
                                <div className="min-w-0">
                                    <p className="font-semibold text-slate-900">{account.bankName}</p>
                                    <p className="text-sm text-slate-700">{account.ownerName}</p>
                                    <p className="text-xs text-slate-500">
                                        {account.accountType} - {account.idNumber}
                                    </p>
                                    {account.email ? (
                                        <p className="break-all text-xs text-slate-500">{account.email}</p>
                                    ) : null}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleDelete(account.id)}
                                    disabled={isPending && deletingId === account.id}
                                    className="shrink-0 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-700 transition-colors hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {isPending && deletingId === account.id ? 'Eliminando...' : 'Eliminar'}
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-slate-600">
                        Aun no hay cuentas bancarias. Agrega la primera con el formulario.
                    </p>
                )}
            </div>
        </div>
    )
}

export default BankAccountManager
