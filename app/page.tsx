import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { prisma } from "@/src/lib/prisma"
import { categories as seedCategories } from "@/prisma/data/categories"
import { getBusinessProfile, getBusinessLogo } from "@/src/lib/business-profile"
import CategoryIcon from "@/components/ui/CategoryIcon"

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getBusinessProfile()
  return {
    title: `${profile.name} | Catalogo en linea`,
    description: `Compra en linea en ${profile.name}. Explora nuestras categorias de productos y arma tu pedido.`,
  }
}

const getCategories = async () => {
  try {
    const categories = await prisma.category.findMany({ orderBy: { name: "asc" } })
    return categories.length > 0 ? categories : seedCategories
  } catch {
    return seedCategories
  }
}

export default async function Home() {
  const [profile, categories] = await Promise.all([getBusinessProfile(), getCategories()])
  const logoSrc = getBusinessLogo(profile.image)
  const logoUnoptimized = logoSrc.startsWith("http") && !logoSrc.includes("res.cloudinary.com")
  const firstCategory = categories[0]?.slug ?? "abarrotes"

  const contactItems = [
    profile.phone ? { label: "Telefono", value: profile.phone, href: `tel:${profile.phone.replace(/\s+/g, "")}` } : null,
    profile.email ? { label: "Email", value: profile.email, href: `mailto:${profile.email}` } : null,
    profile.address ? { label: "Direccion", value: profile.address, href: null } : null,
  ].filter(Boolean) as { label: string; value: string; href: string | null }[]

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.16),_transparent_40%),linear-gradient(180deg,_#f8fafc_0%,_#eef2f7_100%)] text-slate-900">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        {/* Hero */}
        <div className="grid gap-8 rounded-[2rem] border border-white/60 bg-white/85 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:p-10">
          <div className="flex flex-col items-center gap-5 text-center lg:items-start lg:text-left">
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
                Tus productos de siempre, al alcance de un clic. Explora el catalogo, arma tu pedido y recogelo listo.
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

          {/* Categorías */}
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Nuestras categorias</p>
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {categories.map((category) => (
                <CategoryIcon key={category.id} category={category} />
              ))}
            </div>
          </div>
        </div>

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
      </section>
    </main>
  )
}
