import { prisma } from "@/src/lib/prisma"

export const defaultTagline =
    "Tus productos de siempre, al alcance de un clic. Explora el catalogo, arma tu pedido y recogelo listo."

export const defaultInstructionSteps = [
    "Selecciona los productos",
    "Elige el tipo de retiro",
    "Realiza tu pago por transferencia bancaria",
    "Sube una foto clara de tu comprobante de pago en el carrito",
    "Completa los datos de tu Orden",
    "Confirma tu pedido y listo!",
]

export type BusinessProfileData = {
    id: string | null
    name: string
    image: string | null
    tagline: string | null
    phone: string | null
    email: string | null
    address: string | null
    googleReviewsUrl: string | null
    instructionSteps: string[]
}

export const defaultBusinessProfile: BusinessProfileData = {
    id: null,
    name: "Mi Tienda de Abarrotes",
    image: null,
    tagline: defaultTagline,
    phone: "+52 000 000 0000",
    email: "contacto@mitienda.com",
    address: "Calle Principal 123, Centro",
    googleReviewsUrl: null,
    instructionSteps: defaultInstructionSteps,
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
            tagline: profile.tagline ?? defaultTagline,
            phone: profile.phone,
            email: profile.email,
            address: profile.address,
            googleReviewsUrl: profile.googleReviewsUrl,
            instructionSteps:
                profile.instructionSteps && profile.instructionSteps.length > 0
                    ? profile.instructionSteps
                    : defaultInstructionSteps,
        }
    } catch {
        return defaultBusinessProfile
    }
}

export const getBusinessLogo = (image: string | null | undefined) =>
    image && (image.startsWith('http') || image.startsWith('/')) ? image : '/logo.png'
