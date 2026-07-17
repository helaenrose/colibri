import AdminSidebar from "@/components/admin/AdminSidebar";
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
        redirect('/admin/login')
    }

    return (
        <>
            <div className="min-h-screen md:flex bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.14),_transparent_35%),linear-gradient(180deg,_#f8fafc_0%,_#eef2f7_100%)]">
                <aside className="border-b border-gray-200 bg-white/95 backdrop-blur md:h-screen md:w-80 md:sticky md:top-0 md:border-b-0 md:border-r">
                    <AdminSidebar />
                </aside>

                <main className="p-3 sm:p-4 md:flex-1 md:h-screen md:overflow-y-scroll md:p-6" role="main">
                    {children}
                </main>
            </div>

            <Notification />
        </>
    )
}
