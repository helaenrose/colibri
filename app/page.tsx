import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { prisma } from "@/src/lib/prisma"
import { categories as seedCategories } from "@/prisma/data/categories"
import { getBusinessProfile, getBusinessLogo } from "@/src/lib/business-profile"
import { getBankAccounts } from "@/src/lib/bank-accounts"
import CategoryIcon from "@/components/ui/CategoryIcon"

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getBusinessProfile()
  return {
    title: `${profile.name} | Catalogo en linea`,
    description: `Compra en linea en ${profile.name}. Explora nuestras categorias de productos y arma tu pedido.`,
  }
}

const getDepartments = async () => {
  try {
    const departments = await prisma.category.findMany({
      where: { level: "DEPARTMENT" },
      orderBy: { name: "asc" },
    })
    if (departments.length > 0) return departments
    return seedCategories.filter((c) => c.level === "DEPARTMENT")
  } catch {
    return seedCategories.filter((c) => c.level === "DEPARTMENT")
  }
}

export default async function Home() {
  const [profile, departments, bankAccounts] = await Promise.all([
    getBusinessProfile(),
    getDepartments(),
    getBankAccounts(),
  ])
  const logoSrc = getBusinessLogo(profile.image)
  const logoUnoptimized = logoSrc.startsWith("http") && !logoSrc.includes("res.cloudinary.com")
  const firstCategory = departments[0]?.slug ?? "abarrotes-secos"

  const contactItems = [
    profile.phone ? { label: "Telefono", value: profile.phone, href: `tel:${profile.phone.replace(/\s+/g, "")}` } : null,
    profile.email ? { label: "Email", value: profile.email, href: `mailto:${profile.email}` } : null,
    profile.address ? { label: "Direccion", value: profile.address, href: null } : null,
  ].filter(Boolean) as { label: string; value: string; href: string | null }[]

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.16),_transparent_40%),linear-gradient(180deg,_#f8fafc_0%,_#eef2f7_100%)] text-slate-900">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        {/* Hero */}
        <div className="rounded-[2rem] border border-white/60 bg-white/85 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8 lg:p-10">
          <div className="flex flex-col items-center gap-5 text-center">
            <span className="relative h-28 w-28 overflow-hidden rounded-full bg-slate-900 sm:h-32 sm:w-32">
              <Image
                fill
                priority
                unoptimized={logoUnoptimized}
                src={logoSrc}
                alt={`Logotipo de ${profile.name}`}
                sizes="128px"
                className="object-contain p-3"
              />
            </span>
            <div className="space-y-3">
              <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
                Tienda de abarrotes
              </span>
              <h1 className="text-balance text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                {profile.name}
              </h1>
              <p className="max-w-md text-pretty text-base leading-relaxed text-slate-600">
                {profile.tagline}
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3 lg:justify-start">
              <Link
                href={`/order/${firstCategory}`}
                className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
              >
                Ver catalogo
              </Link>
              {contactItems.find((c) => c.label === "Telefono") ? (
                <a
                  href={contactItems.find((c) => c.label === "Telefono")!.href!}
                  className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:-translate-y-0.5 hover:border-slate-950"
                >
                  Llamar ahora
                </a>
              ) : null}
              {profile.googleReviewsUrl ? (
                <a
                  href={profile.googleReviewsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-amber-300 bg-amber-50 px-6 py-3 text-sm font-semibold text-amber-800 transition hover:-translate-y-0.5 hover:border-amber-400"
                >
                  Danos tu resena en Google
                </a>
              ) : null}
            </div>
          </div>
        </div>

        {/* Datos para pago */}
        {bankAccounts.length > 0 ? (
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_50px_rgba(15,23,42,0.06)] sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Datos para pago</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              Realiza tu pago y sube el comprobante
            </h2>
            <p className="mt-2 max-w-2xl text-pretty text-sm text-slate-600">
              Transfiere a cualquiera de estas cuentas y adjunta tu comprobante al confirmar el pedido.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {bankAccounts.map((account) => (
                <article
                  key={account.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                >
                  <h3 className="text-lg font-black text-slate-900">{account.bankName}</h3>
                  <dl className="mt-3 space-y-2 text-sm">
                    <div className="flex flex-col">
                      <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Titular</dt>
                      <dd className="font-medium text-slate-800">{account.ownerName}</dd>
                    </div>
                    <div className="flex flex-col">
                      <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Cedula</dt>
                      <dd className="font-medium text-slate-800">{account.idNumber}</dd>
                    </div>
                    <div className="flex flex-col">
                      <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Tipo de cuenta</dt>
                      <dd className="font-medium text-slate-800">{account.accountType}</dd>
                    </div>
                    {account.email ? (
                      <div className="flex flex-col">
                        <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Correo</dt>
                        <dd className="font-medium text-slate-800 break-all">{account.email}</dd>
                      </div>
                    ) : null}
                  </dl>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {/* Contacto */}
        {contactItems.length > 0 ? (
          <footer className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_50px_rgba(15,23,42,0.06)] sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Contacto</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              Visitanos o escribenos
            </h2>
            <div className="mt-6 flex flex-wrap gap-4">
              {contactItems.map((item) => {
                const content = (
                  <>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{item.label}</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{item.value}</p>
                  </>
                )
                return item.href ? (
                  <a
                    key={item.label}
                    href={item.href}
                    className="min-w-[12rem] flex-1 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white"
                  >
                    {content}
                  </a>
                ) : (
                  <div
                    key={item.label}
                    className="min-w-[12rem] flex-1 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    {content}
                  </div>
                )
              })}
            </div>
          </footer>
        ) : null}

        {/* Departamentos */}
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_50px_rgba(15,23,42,0.06)] sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Nuestros departamentos</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            Explora el catalogo
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {departments.map((department) => (
              <CategoryIcon key={department.id} category={department} />
            ))}
          </div>
        </section>
      </section>
    </main>
  )
}
