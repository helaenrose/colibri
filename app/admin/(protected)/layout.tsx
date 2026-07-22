import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminMobileNav from "@/components/admin/AdminMobileNav";
import Notification from "@/components/ui/Notification";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/src/lib/admin-auth";

export default async function AdminLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const authenticated = await isAdminAuthenticated()

    if (!authenticated) {
        // ?expired=1 evita el bucle de redirecciones cuando el navegador conserva
        // una cookie de sesion que ya fue revocada (por ejemplo, tras cambiar la
        // contrasena en otro dispositivo con "cerrar las demas sesiones").
        redirect('/admin/login?expired=1')
    }

    return (
        <>
            <div className="min-h-screen md:flex bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.14),_transparent_35%),linear-gradient(180deg,_#f8fafc_0%,_#eef2f7_100%)]">
                {/* Sidebar de escritorio */}
                <aside className="hidden bg-white/95 backdrop-blur md:block md:w-80 md:sticky md:top-[63px] md:h-[calc(100vh-63px)] md:self-start md:overflow-y-auto md:border-r md:border-gray-200">
                    <AdminSidebar />
                </aside>

                {/* Navegacion movil (barra superior + cajon) */}
                <AdminMobileNav>
                    <AdminSidebar />
                </AdminMobileNav>

                <main className="p-3 sm:p-4 md:flex-1 md:p-6" role="main">
                    {children}
                </main>
            </div>

            <Notification />
        </>
    )
}
