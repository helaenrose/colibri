import Heading from "@/components/ui/Heading"
import MediaManager from "@/components/media/MediaManager"
import { getMediaAssets, type MediaAssetWithRelations } from "@/src/lib/media"
import { prisma } from "@/src/lib/prisma"

export const dynamic = "force-dynamic"

export type MediaProductOption = { id: string; name: string }
export type MediaCategoryOption = { id: string; name: string; level: "DEPARTMENT" | "CATEGORY" | "SUBCATEGORY" }

const getData = async (): Promise<{
    assets: MediaAssetWithRelations[]
    products: MediaProductOption[]
    categories: MediaCategoryOption[]
}> => {
    try {
        const [assets, products, categories] = await Promise.all([
            getMediaAssets(),
            prisma.product.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
            prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, level: true } }),
        ])
        return { assets, products, categories }
    } catch {
        return { assets: [], products: [], categories: [] }
    }
}

const MediaPage = async () => {
    const { assets, products, categories } = await getData()

    return (
        <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white/85 p-5 shadow-[0_16px_50px_rgba(15,23,42,0.07)] backdrop-blur sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">Administracion</p>
                        <Heading>Galeria de imagenes</Heading>
                        <p className="-mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
                            Sube y administra tus imagenes. Una misma imagen puede asociarse a varios productos y a varias
                            categorias de cualquier nivel.
                        </p>
                    </div>

                    <span className="inline-flex items-center gap-2 self-start rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800">
                        {assets.length} {assets.length === 1 ? "imagen" : "imagenes"}
                    </span>
                </div>
            </section>

            <MediaManager assets={assets} products={products} categories={categories} />
        </div>
    )
}

export default MediaPage
