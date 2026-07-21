import Heading from "@/components/ui/Heading"
import ProfileForm from "@/components/profile/ProfileForm"
import BankAccountManager from "@/components/profile/BankAccountManager"
import InstructionsEditor from "@/components/profile/InstructionsEditor"
import ChangePasswordForm from "@/components/profile/ChangePasswordForm"
import { getBusinessProfile } from "@/src/lib/business-profile"
import { getBankAccounts } from "@/src/lib/bank-accounts"

export const dynamic = 'force-dynamic'

const ProfilePage = async () => {
    const [profile, bankAccounts] = await Promise.all([getBusinessProfile(), getBankAccounts()])

    return (
        <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white/85 p-5 shadow-[0_16px_50px_rgba(15,23,42,0.07)] backdrop-blur sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">Administracion</p>
                        <Heading>Mi perfil</Heading>
                        <p className="-mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
                            Actualiza el nombre, la imagen y la informacion de contacto de tu negocio. Estos datos se reflejan en el sitio publico.
                        </p>
                    </div>
                </div>
            </section>

            <ProfileForm profile={profile} />

            <section className="rounded-3xl border border-slate-200 bg-white/85 p-5 shadow-[0_16px_50px_rgba(15,23,42,0.07)] backdrop-blur sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">Sitio publico</p>
                <Heading>Instrucciones del pedido</Heading>
                <p className="-mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
                    Estos pasos aparecen en la cinta animada del inicio y del catalogo. Puedes editarlos, reordenarlos, agregar o quitar pasos.
                </p>
            </section>

            <InstructionsEditor steps={profile.instructionSteps} />

            <section className="rounded-3xl border border-slate-200 bg-white/85 p-5 shadow-[0_16px_50px_rgba(15,23,42,0.07)] backdrop-blur sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">Pagos</p>
                <Heading>Cuentas bancarias</Heading>
                <p className="-mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
                    Estas cuentas se muestran a tus clientes para que realicen el pago y suban su comprobante al ordenar.
                </p>
            </section>

            <BankAccountManager accounts={bankAccounts} />

            <section className="rounded-3xl border border-slate-200 bg-white/85 p-5 shadow-[0_16px_50px_rgba(15,23,42,0.07)] backdrop-blur sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">Seguridad</p>
                <Heading>Cambiar contrasena</Heading>
                <p className="-mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
                    Actualiza la contrasena de tu cuenta de administrador. Se cerraran las demas sesiones activas por seguridad.
                </p>
            </section>

            <ChangePasswordForm />
        </div>
    )
}

export default ProfilePage
