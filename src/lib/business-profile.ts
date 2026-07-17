import { prisma } from "@/src/lib/prisma"

export type BusinessProfileData = {
    id: string | null
    name: string
    image: string | null
    phone: string | null
    email: string | null
    address: string | null
}

export const defaultBusinessProfile: BusinessProfileData = {
    id: null,
    name: "Mi Tienda de Abarrotes",
    image: null,
    phone: "+52 000 000 0000",
    email: "contacto@mitienda.com",
    address: "Calle Principal 123, Centro",
}

export const getBusinessProfile = async (): Promise<BusinessProfileData> => {
    try {
        const profile = await prisma.businessProfile.findFirst({
            orderBy: { updatedAt: 'desc' },
        })
        if (!profile) return defaultBusinessProfile

        return {
            id: profile.id,
            name: profile.name,
            image: profile.image,
            phone: profile.phone,
            email: profile.email,
            address: profile.address,
        }
    } catch {
        return defaultBusinessProfile
    }
}

export const getBusinessLogo = (image: string | null | undefined) =>
    image && image.startsWith('http') ? image : '/logo.png'
