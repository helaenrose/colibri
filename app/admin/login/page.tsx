"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { authClient } from "@/src/lib/auth-client"
import { emergencyLogin } from "@/actions/admin-session-actions"

const LoginForm = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextParam = searchParams.get("next")
  const safeNext = nextParam?.startsWith("/admin") ? nextParam : "/admin/products"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [showEmergency, setShowEmergency] = useState(false)
  const [emUser, setEmUser] = useState("")
  const [emPassword, setEmPassword] = useState("")
  const [emError, setEmError] = useState<string | null>(null)
  const [emLoading, setEmLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setLoading(true)

    const { error: signInError } = await authClient.signIn.email({
      email: email.trim(),
      password,
    })

    if (signInError) {
      setLoading(false)
      setError("Credenciales invalidas. Intenta nuevamente.")
      return
    }

    router.push(safeNext)
    router.refresh()
  }

  const handleEmergencySubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setEmError(null)
    setEmLoading(true)

    const result = await emergencyLogin(emUser, emPassword)

    if (!result.ok) {
      setEmLoading(false)
      setEmError(result.error)
      return
    }

    router.push(safeNext)
    router.refresh()
  }

  return (
    <div className="mx-auto flex min-h-[70dvh] w-full max-w-xl items-center justify-center px-3 py-8 sm:px-4">
      <section className="w-full rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Admin</p>
        <h1 className="mt-2 text-2xl font-black text-slate-950">Ingresar al panel</h1>
        <p className="mt-2 text-sm text-slate-600">Acceso exclusivo para administradores.</p>

        {error ? (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            {error}
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-semibold text-slate-700">
              Correo
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-amber-400 focus:bg-white"
              placeholder="admin@colibri.com"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-semibold text-slate-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-amber-400 focus:bg-white"
              placeholder="Tu password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Ingresando..." : "Entrar al admin"}
          </button>
        </form>

        <Link href="/" className="mt-4 inline-flex text-sm font-semibold text-amber-700 hover:text-amber-800">
          Volver al inicio
        </Link>

        <div className="mt-6 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={() => setShowEmergency((value) => !value)}
            className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 transition hover:text-slate-700"
          >
            {showEmergency ? "Ocultar acceso de emergencia" : "Olvide mi contrasena"}
          </button>

          {showEmergency ? (
            <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-600">
                Acceso de emergencia con las credenciales configuradas en el servidor.
              </p>

              {emError ? (
                <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                  {emError}
                </p>
              ) : null}

              <form onSubmit={handleEmergencySubmit} className="mt-3 space-y-3">
                <div className="space-y-1.5">
                  <label htmlFor="em-user" className="text-sm font-semibold text-slate-700">
                    Usuario
                  </label>
                  <input
                    id="em-user"
                    name="em-user"
                    type="text"
                    required
                    value={emUser}
                    onChange={(event) => setEmUser(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-amber-400"
                    placeholder="Usuario de emergencia"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="em-password" className="text-sm font-semibold text-slate-700">
                    Password
                  </label>
                  <input
                    id="em-password"
                    name="em-password"
                    type="password"
                    required
                    value={emPassword}
                    onChange={(event) => setEmPassword(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-amber-400"
                    placeholder="Password de emergencia"
                  />
                </div>

                <button
                  type="submit"
                  disabled={emLoading}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-amber-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {emLoading ? "Ingresando..." : "Entrar con acceso de emergencia"}
                </button>
              </form>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  )
}

const LoginPage = () => (
  <Suspense fallback={null}>
    <LoginForm />
  </Suspense>
)

export default LoginPage
