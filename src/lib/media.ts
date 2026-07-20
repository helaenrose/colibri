import { prisma } from "@/src/lib/prisma"

// Trae todas las imagenes de la galeria con sus asociaciones a productos y categorias.
export const getMediaAssets = async () => {
    try {
        return await prisma.mediaAsset.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                products: {
                    include: { product: { select: { id: true, name: true } } },
                },
                categories: {
                    include: { category: { select: { id: true, name: true, level: true } } },
                },
            },
        })
    } catch (error) {
        console.log("[v0] getMediaAssets error:", error)
        return []
    }
}

export type MediaAssetWithRelations = Awaited<ReturnType<typeof getMediaAssets>>[number]
