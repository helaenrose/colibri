import Link from "next/link"

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">Error 404</p>
        <h1 className="text-3xl font-bold text-slate-900 text-balance sm:text-4xl">
          No encontramos la pagina que buscas
        </h1>
        <p className="mx-auto max-w-md text-pretty text-sm text-slate-600 sm:text-base">
          Es posible que el enlace este roto o que la pagina se haya movido. Vuelve al inicio para seguir navegando.
        </p>
      </div>
      <Link
        href="/"
        className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
      >
        Volver al inicio
      </Link>
    </main>
  )
}
