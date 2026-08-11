'use client'

import Image from "next/image"
import { createBankAccount } from "@/actions/create-bank-account-action"
import { updateBankAccount } from "@/actions/update-bank-account-action"
import { deleteBankAccount } from "@/actions/delete-bank-account-action"
import { BankAccountSchema } from "@/src/schema"
import { useToastZodErrors } from "@/src/hooks/useToastZodErrors"
import { FormEvent, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "react-toastify"
import { TbBuildingBank, TbPhotoPlus } from "react-icons/tb"
import type { BankAccountData } from "@/src/lib/bank-accounts"

const emptyForm = {
    bankName: '',
    ownerName: '',
    accountNumber: '',
    idNumber: '',
    accountType: '',
    email: '',
    logoUrl: '',
}

const BankAccountManager = ({ accounts }: { accounts: BankAccountData[] }) => {

    const router = useRouter()
    const { showIssues } = useToastZodErrors()
    const [form, setForm] = useState(emptyForm)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [isUploadingLogo, setIsUploadingLogo] = useState(false)
    const logoInputRef = useRef<HTMLInputElement>(null)

    const handleChange = (field: keyof typeof emptyForm) => (event: React.ChangeEvent<HTMLInputElement>) => {
        setForm((prev) => ({ ...prev, [field]: event.target.value }))
    }

    const startEdit = (account: BankAccountData) => {
        setEditingId(account.id)
        setForm({
            bankName: account.bankName,
            ownerName: account.ownerName,
            accountNumber: account.accountNumber,
            idNumber: account.idNumber,
            accountType: account.accountType,
            email: account.email ?? '',
            logoUrl: account.logoUrl ?? '',
        })
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const cancelEdit = () => {
        setEditingId(null)
        setForm(emptyForm)
    }

    const handleLogoFile = async (file: File) => {
        setIsUploadingLogo(true)
        try {
            const formData = new FormData()
            formData.append('file', file)
            const response = await fetch('/admin/media/api/upload', {
                method: 'POST',
                body: formData,
            })
            const result = await response.json()
            if (!response.ok || !result.ok) {
                toast.error(result.error ?? 'No se pudo subir el logo.')
                return
            }
            setForm((prev) => ({ ...prev, logoUrl: result.asset.url }))
            toast.success('Logo cargado')
        } catch {
            toast.error('Ocurrio un error al subir el logo.')
        } finally {
            setIsUploadingLogo(false)
        }
    }

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        const result = BankAccountSchema.safeParse(form)
        if (!result.success) {
            showIssues(result.error.issues)
            return
        }

        startTransition(async () => {
            const response = editingId
                ? await updateBankAccount({ ...result.data, id: editingId })
                : await createBankAccount(result.data)

            if (response?.errors) {
                response.errors.forEach((error) => toast.error(error.message))
                return
            }
            toast.success(editingId ? 'Cuenta bancaria actualizada' : 'Cuenta bancaria agregada')
            setForm(emptyForm)
            setEditingId(null)
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
            if (editingId === id) cancelEdit()
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
                <h2 className="text-lg font-bold text-slate-900">
                    {editingId ? 'Editar cuenta bancaria' : 'Nueva cuenta bancaria'}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                    Registra las cuentas donde tus clientes pueden realizar el pago. Se mostraran en el sitio publico.
                </p>

                <div className="mt-4 space-y-3">
                    <div className="space-y-1.5">
                        <span className="text-sm font-semibold text-slate-800">Logo del banco (opcional)</span>
                        <input
                            ref={logoInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="sr-only"
                            onChange={(event) => {
                                const file = event.target.files?.[0]
                                if (file) void handleLogoFile(file)
                                event.target.value = ''
                            }}
                        />
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => logoInputRef.current?.click()}
                                disabled={isUploadingLogo}
                                className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-dashed border-slate-300 bg-slate-50 text-slate-400 transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {form.logoUrl ? (
                                    <Image src={form.logoUrl} alt="Logo del banco" fill className="object-cover" />
                                ) : (
                                    <TbPhotoPlus size={22} />
                                )}
                            </button>
                            <div className="text-xs text-slate-500">
                                {isUploadingLogo ? (
                                    <p className="font-semibold text-slate-700">Subiendo...</p>
                                ) : (
                                    <>
                                        <p>JPG, PNG o WEBP.</p>
                                        <p>Se muestra junto al banco en el sitio publico.</p>
                                    </>
                                )}
                                {form.logoUrl && !isUploadingLogo ? (
                                    <button
                                        type="button"
                                        onClick={() => setForm((prev) => ({ ...prev, logoUrl: '' }))}
                                        className="mt-1 font-semibold text-red-600 hover:underline"
                                    >
                                        Quitar logo
                                    </button>
                                ) : null}
                            </div>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label htmlFor="bankName" className="text-sm font-semibold text-slate-800">Banco</label>
                        <input id="bankName" type="text" value={form.bankName} onChange={handleChange('bankName')} placeholder="Ej. Banco Pichincha" className={inputClass} />
                    </div>
                    <div className="space-y-1.5">
                        <label htmlFor="ownerName" className="text-sm font-semibold text-slate-800">Titular de la cuenta</label>
                        <input id="ownerName" type="text" value={form.ownerName} onChange={handleChange('ownerName')} placeholder="Ej. Maria Perez" className={inputClass} />
                    </div>
                    <div className="space-y-1.5">
                        <label htmlFor="accountNumber" className="text-sm font-semibold text-slate-800">Numero de cuenta</label>
                        <input id="accountNumber" type="text" value={form.accountNumber} onChange={handleChange('accountNumber')} placeholder="Ej. 2200123456" className={inputClass} />
                    </div>
                    <div className="space-y-1.5">
                        <label htmlFor="idNumber" className="text-sm font-semibold text-slate-800">Cedula</label>
                        <input id="idNumber" type="text" value={form.idNumber} onChange={handleChange('idNumber')} placeholder="Ej. 1712345678" className={inputClass} />
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

                <div className="mt-5 flex gap-2">
                    {editingId ? (
                        <button
                            type="button"
                            onClick={cancelEdit}
                            className="w-full rounded-md border border-slate-200 bg-white p-3 font-semibold text-slate-700 transition-all hover:bg-slate-50 active:scale-[0.99]"
                        >
                            Cancelar
                        </button>
                    ) : null}
                    <button
                        type="submit"
                        disabled={isPending || isUploadingLogo}
                        className="w-full rounded-md bg-slate-900 p-3 font-semibold text-white transition-all hover:bg-slate-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isPending ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Agregar cuenta'}
                    </button>
                </div>
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
                                <div className="flex min-w-0 gap-3">
                                    <div className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white text-slate-400">
                                        {account.logoUrl ? (
                                            <Image src={account.logoUrl} alt={`Logo de ${account.bankName}`} fill className="object-cover" />
                                        ) : (
                                            <TbBuildingBank size={20} />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-semibold text-slate-900">{account.bankName}</p>
                                        <p className="text-sm text-slate-700">{account.ownerName}</p>
                                        <p className="text-xs text-slate-500">
                                            {account.accountType} - Cuenta: {account.accountNumber || 'Sin registrar'}
                                        </p>
                                        <p className="text-xs text-slate-500">Cedula: {account.idNumber}</p>
                                        {account.email ? (
                                            <p className="break-all text-xs text-slate-500">{account.email}</p>
                                        ) : null}
                                    </div>
                                </div>
                                <div className="flex shrink-0 flex-col gap-2">
                                    <button
                                        type="button"
                                        onClick={() => startEdit(account)}
                                        className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-100"
                                    >
                                        Editar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(account.id)}
                                        disabled={isPending && deletingId === account.id}
                                        className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-700 transition-colors hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {isPending && deletingId === account.id ? 'Eliminando...' : 'Eliminar'}
                                    </button>
                                </div>
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
