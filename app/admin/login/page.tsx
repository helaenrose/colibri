"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { authClient } from "@/src/lib/auth-client"

const LoginForm = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextParam = searchParams.get("next")
  const safeNext = nextParam?.startsWith("/admin") ? nextParam : "/admin/products"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

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
