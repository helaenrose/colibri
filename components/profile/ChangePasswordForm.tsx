'use client'

import { authClient } from "@/src/lib/auth-client"
import { FormEvent, useState } from "react"
import { toast } from "react-toastify"

const inputClass =
    "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-amber-400 focus:bg-white"

const ChangePasswordForm = () => {
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        if (newPassword.length < 8) {
            toast.error('La nueva contrasena debe tener al menos 8 caracteres.')
            return
        }
        if (newPassword !== confirmPassword) {
            toast.error('La confirmacion no coincide con la nueva contrasena.')
            return
        }
        if (newPassword === currentPassword) {
            toast.error('La nueva contrasena debe ser distinta de la actual.')
            return
        }

        setLoading(true)
        const { error } = await authClient.changePassword({
            currentPassword,
            newPassword,
            revokeOtherSessions: true,
        })
        setLoading(false)

        if (error) {
            // Ocurre si la contrasena actual es incorrecta o si entraste con el
            // acceso de emergencia (contrasena maestra), que no se puede cambiar aqui.
            toast.error(
                error.message ??
                    'No se pudo cambiar la contrasena. Verifica tu contrasena actual.',
            )
            return
        }

        toast.success('Contrasena actualizada correctamente.')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
    }

    return (
        <form
            onSubmit={handleSubmit}
            noValidate
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_16px_50px_rgba(15,23,42,0.06)] sm:p-6"
        >
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                    <label htmlFor="currentPassword" className="text-sm font-semibold text-slate-800">
                        Contrasena actual
                    </label>
                    <input
                        id="currentPassword"
                        name="currentPassword"
                        type="password"
                        autoComplete="current-password"
                        required
                        value={currentPassword}
                        onChange={(event) => setCurrentPassword(event.target.value)}
                        className={inputClass}
                        placeholder="Tu contrasena actual"
                    />
                </div>

                <div className="space-y-1.5">
                    <label htmlFor="newPassword" className="text-sm font-semibold text-slate-800">
                        Nueva contrasena
                    </label>
                    <input
                        id="newPassword"
                        name="newPassword"
                        type="password"
                        autoComplete="new-password"
                        required
                        minLength={8}
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                        className={inputClass}
                        placeholder="Minimo 8 caracteres"
                    />
                </div>

                <div className="space-y-1.5">
                    <label htmlFor="confirmPassword" className="text-sm font-semibold text-slate-800">
                        Confirmar nueva contrasena
                    </label>
                    <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        required
                        minLength={8}
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        className={inputClass}
                        placeholder="Repite la nueva contrasena"
                    />
                </div>
            </div>

            <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Esto cambia solo la contrasena de tu cuenta de administrador. La contrasena maestra de
                emergencia se define en variables de entorno del servidor y no se modifica aqui.
            </p>

            <button
                type="submit"
                disabled={loading}
                className="mt-5 w-full rounded-md bg-slate-900 p-3 font-semibold text-white transition-all hover:bg-slate-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-8"
            >
                {loading ? 'Guardando...' : 'Cambiar contrasena'}
            </button>
        </form>
    )
}

export default ChangePasswordForm
