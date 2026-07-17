'use client'

import { updateBusinessProfile } from "@/actions/update-profile-action"
import { BusinessProfileSchema } from "@/src/schema"
import { useToastZodErrors } from "@/src/hooks/useToastZodErrors"
import { FormEvent, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "react-toastify"
import ProfileImageUpload from "./ProfileImageUpload"
import type { BusinessProfileData } from "@/src/lib/business-profile"

const ProfileForm = ({ profile }: { profile: BusinessProfileData }) => {

    const router = useRouter()
    const { showIssues } = useToastZodErrors()
    const [isPending, startTransition] = useTransition()
    const [image, setImage] = useState(profile.image ?? '')

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        const formData = new FormData(event.currentTarget)
        const data = {
            name: formData.get('name'),
            phone: formData.get('phone'),
            email: formData.get('email'),
            address: formData.get('address'),
            googleReviewsUrl: formData.get('googleReviewsUrl'),
            image,
        }

        const result = BusinessProfileSchema.safeParse(data)
        if (!result.success) {
            showIssues(result.error.issues)
            return
        }

        startTransition(async () => {
            const response = await updateBusinessProfile(result.data)
            if (response?.errors) {
                response.errors.forEach((error) => toast.error(error.message))
                return
            }
            toast.success('Perfil actualizado')
            router.refresh()
        })
    }

    return (
        <form
            onSubmit={handleSubmit}
            noValidate
            className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]"
        >
            <div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_16px_50px_rgba(15,23,42,0.06)] sm:p-6">
                <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-semibold text-slate-800">Nombre del negocio</label>
                    <input
                        id="name"
                        name="name"
                        type="text"
                        defaultValue={profile.name}
                        placeholder="Nombre de tu tienda"
                        className="block w-full rounded-md border border-slate-200 bg-slate-100 p-3 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="phone" className="text-sm font-semibold text-slate-800">Telefono</label>
                    <input
                        id="phone"
                        name="phone"
                        type="text"
                        defaultValue={profile.phone ?? ''}
                        placeholder="+52 000 000 0000"
                        className="block w-full rounded-md border border-slate-200 bg-slate-100 p-3 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-semibold text-slate-800">Correo de contacto</label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        defaultValue={profile.email ?? ''}
                        placeholder="contacto@mitienda.com"
                        className="block w-full rounded-md border border-slate-200 bg-slate-100 p-3 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="address" className="text-sm font-semibold text-slate-800">Direccion</label>
                    <input
                        id="address"
                        name="address"
                        type="text"
                        defaultValue={profile.address ?? ''}
                        placeholder="Calle Principal 123, Centro"
                        className="block w-full rounded-md border border-slate-200 bg-slate-100 p-3 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="googleReviewsUrl" className="text-sm font-semibold text-slate-800">Enlace de resenas de Google</label>
                    <input
                        id="googleReviewsUrl"
                        name="googleReviewsUrl"
                        type="url"
                        inputMode="url"
                        defaultValue={profile.googleReviewsUrl ?? ''}
                        placeholder="https://maps.app.goo.gl/..."
                        className="block w-full rounded-md border border-slate-200 bg-slate-100 p-3 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                    <p className="text-xs text-slate-500">
                        Pega el enlace para que tus clientes dejen resenas en Google.
                    </p>
                </div>

                <button
                    type="submit"
                    disabled={isPending}
                    className="w-full rounded-md bg-slate-900 p-3 font-semibold text-white transition-all hover:bg-slate-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isPending ? 'Guardando...' : 'Guardar cambios'}
                </button>
            </div>

            <div className="h-fit rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_16px_50px_rgba(15,23,42,0.06)] sm:p-6">
                <ProfileImageUpload image={profile.image} onChange={setImage} />
                <p className="mt-3 text-xs text-slate-500">
                    Esta imagen se usara como logo del negocio en el catalogo y el panel.
                </p>
            </div>
        </form>
    )
}

export default ProfileForm
