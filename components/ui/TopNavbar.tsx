import Link from "next/link"

const links = [
  { href: "/", label: "Inicio" },
  { href: "/order/abarrotes", label: "Comprar" },
  { href: "/admin/orders", label: "Admin" },
]

const TopNavbar = () => {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <nav
        aria-label="Navegacion principal"
        className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8"
      >
        <Link href="/" className="shrink-0 text-sm font-black uppercase tracking-[0.16em] text-slate-900">
          FastFood
        </Link>

        <div className="ml-auto flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-1 text-sm font-semibold text-slate-700 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded border border-slate-200 bg-slate-50 px-3 py-1.5 transition-colors hover:border-amber-300 hover:bg-amber-50 hover:text-amber-900"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  )
}

export default TopNavbar
