import Logo from "../ui/Logo"
import AdminRoute from "./AdminRoute"
import LogoutButton from "./LogoutButton"
import { getBusinessProfile } from "@/src/lib/business-profile"

const adminNavigation = [
    { url: '/admin/orders', text: 'Ordenes pendientes', blank: false },
    { url: '/admin/completed', text: 'Ordenes completadas', blank: false },
    { url: '/admin/products', text: 'Productos', blank: false },
    { url: '/admin/categories', text: 'Categorias', blank: false },
    { url: '/admin/media', text: 'Galeria de imagenes', blank: false },
    { url: '/admin/profile', text: 'Mi perfil', blank: false },
    { url: '/order/abarrotes', text: 'Ver catalogo', blank: true },
]

export default async function AdminSidebar() {
    const profile = await getBusinessProfile()

    return (
        <div className="flex h-full flex-col px-4 py-4 sm:px-5 sm:py-5">
            <div className="rounded-3xl border border-slate-200 bg-[linear-gradient(145deg,_#ffffff,_#f8fafc)] p-4 shadow-sm">
                <Logo />
                <div className="text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Panel de control</p>
                    <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">{profile.name}</h2>
                    <p className="mt-2 text-sm text-slate-600">Gestiona productos y pedidos desde un solo lugar.</p>
                </div>
            </div>

            <div className="mt-5 flex-1 space-y-3">
                <p className="text-center text-xs font-bold uppercase tracking-[0.18em] text-gray-500">Navegacion</p>
                <nav className="flex flex-col" aria-label="Navegación de administración">
                    {adminNavigation.map((item) => (
                        <AdminRoute
                            key={item.url}
                            link={item}
                        />
                    ))}
                </nav>
            </div>

            <div className="pt-3">
                <LogoutButton />
            </div>
        </div>

    )
}
