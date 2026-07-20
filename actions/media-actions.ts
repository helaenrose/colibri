'use server'

import { prisma } from '@/src/lib/prisma'
import { deleteImage } from '@/src/lib/cloudinary'
import { isAdminAuthenticated } from '@/src/lib/admin-auth'
import { revalidatePath } from 'next/cache'

const PLACEHOLDER_IMAGE = '/icon_generic.png'

type ActionResult = {
    success?: boolean
    errors?: { message: string }[]
    deleted?: number
}

const revalidateAll = () => {
    revalidatePath('/admin/media')
    revalidatePath('/admin/products')
    revalidatePath('/admin/categories')
    revalidatePath('/')
}

// Renombra una imagen de la galeria
export const renameMediaAsset = async (id: string, name: string): Promise<ActionResult> => {
    if (!(await isAdminAuthenticated())) {
        return { errors: [{ message: 'No autorizado.' }] }
    }
    const clean = name.trim()
    if (!clean) return { errors: [{ message: 'El nombre no puede ir vacio.' }] }

    try {
        await prisma.mediaAsset.update({ where: { id }, data: { name: clean } })
        revalidatePath('/admin/media')
        return { success: true }
    } catch (error) {
        console.log('[v0] renameMediaAsset error:', error)
        return { errors: [{ message: 'No se pudo renombrar la imagen.' }] }
    }
}

// Elimina multiples imagenes: borra de Cloudinary, de la BD (cascade en las relaciones)
// y repara las imagenes primarias de productos/categorias que apuntaban a esas URLs.
export const deleteMediaAssets = async (ids: string[]): Promise<ActionResult> => {
    if (!(await isAdminAuthenticated())) {
        return { errors: [{ message: 'No autorizado.' }] }
    }
    const uniqueIds = [...new Set((ids ?? []).filter(Boolean))]
    if (uniqueIds.length === 0) return { errors: [{ message: 'Selecciona al menos una imagen.' }] }

    try {
        const assets = await prisma.mediaAsset.findMany({
            where: { id: { in: uniqueIds } },
            select: { id: true, url: true, publicId: true },
        })
        const urls = assets.map((a) => a.url)

        // Cualquier producto/categoria que use estas URLs como imagen primaria vuelve al placeholder
        if (urls.length > 0) {
            await prisma.product.updateMany({
                where: { image: { in: urls } },
                data: { image: PLACEHOLDER_IMAGE },
            })
            await prisma.category.updateMany({
                where: { image: { in: urls } },
                data: { image: null },
            })
        }

        // Borrar de la BD (ProductImage/CategoryImage se eliminan en cascada)
        await prisma.mediaAsset.deleteMany({ where: { id: { in: uniqueIds } } })

        // Borrar de Cloudinary (best-effort)
        await Promise.all(assets.map((a) => deleteImage(a.publicId)))

        revalidateAll()
        return { success: true, deleted: assets.length }
    } catch (error) {
        console.log('[v0] deleteMediaAssets error:', error)
        return { errors: [{ message: 'No se pudieron eliminar las imagenes.' }] }
    }
}

// Asocia una imagen a un producto y la fija como imagen principal de visualizacion
export const addProductAssociation = async (mediaId: string, productId: string): Promise<ActionResult> => {
    if (!(await isAdminAuthenticated())) return { errors: [{ message: 'No autorizado.' }] }
    try {
        const media = await prisma.mediaAsset.findUnique({ where: { id: mediaId } })
        if (!media) return { errors: [{ message: 'La imagen no existe.' }] }

        await prisma.productImage.upsert({
            where: { mediaId_productId: { mediaId, productId } },
            update: {},
            create: { mediaId, productId },
        })
        // La imagen recien asociada pasa a ser la imagen visible del producto
        await prisma.product.update({ where: { id: productId }, data: { image: media.url } })

        revalidateAll()
        return { success: true }
    } catch (error) {
        console.log('[v0] addProductAssociation error:', error)
        return { errors: [{ message: 'No se pudo asociar la imagen al producto.' }] }
    }
}

// Quita la asociacion imagen-producto. Si era la imagen principal, cae a otra asociada o al placeholder.
export const removeProductAssociation = async (mediaId: string, productId: string): Promise<ActionResult> => {
    if (!(await isAdminAuthenticated())) return { errors: [{ message: 'No autorizado.' }] }
    try {
        const media = await prisma.mediaAsset.findUnique({ where: { id: mediaId } })
        await prisma.productImage.deleteMany({ where: { mediaId, productId } })

        if (media) {
            const product = await prisma.product.findUnique({ where: { id: productId }, select: { image: true } })
            if (product?.image === media.url) {
                const remaining = await prisma.productImage.findFirst({
                    where: { productId },
                    include: { media: { select: { url: true } } },
                    orderBy: { createdAt: 'desc' },
                })
                await prisma.product.update({
                    where: { id: productId },
                    data: { image: remaining?.media.url ?? PLACEHOLDER_IMAGE },
                })
            }
        }

        revalidateAll()
        return { success: true }
    } catch (error) {
        console.log('[v0] removeProductAssociation error:', error)
        return { errors: [{ message: 'No se pudo quitar la asociacion.' }] }
    }
}

// Asocia una imagen a una categoria (cualquier nivel) y la fija como imagen de la categoria
export const addCategoryAssociation = async (mediaId: string, categoryId: string): Promise<ActionResult> => {
    if (!(await isAdminAuthenticated())) return { errors: [{ message: 'No autorizado.' }] }
    try {
        const media = await prisma.mediaAsset.findUnique({ where: { id: mediaId } })
        if (!media) return { errors: [{ message: 'La imagen no existe.' }] }

        await prisma.categoryImage.upsert({
            where: { mediaId_categoryId: { mediaId, categoryId } },
            update: {},
            create: { mediaId, categoryId },
        })
        await prisma.category.update({ where: { id: categoryId }, data: { image: media.url } })

        revalidateAll()
        return { success: true }
    } catch (error) {
        console.log('[v0] addCategoryAssociation error:', error)
        return { errors: [{ message: 'No se pudo asociar la imagen a la categoria.' }] }
    }
}

// Quita la asociacion imagen-categoria. Si era la imagen de la categoria, cae a otra asociada o a null.
export const removeCategoryAssociation = async (mediaId: string, categoryId: string): Promise<ActionResult> => {
    if (!(await isAdminAuthenticated())) return { errors: [{ message: 'No autorizado.' }] }
    try {
        const media = await prisma.mediaAsset.findUnique({ where: { id: mediaId } })
        await prisma.categoryImage.deleteMany({ where: { mediaId, categoryId } })

        if (media) {
            const category = await prisma.category.findUnique({ where: { id: categoryId }, select: { image: true } })
            if (category?.image === media.url) {
                const remaining = await prisma.categoryImage.findFirst({
                    where: { categoryId },
                    include: { media: { select: { url: true } } },
                    orderBy: { createdAt: 'desc' },
                })
                await prisma.category.update({
                    where: { id: categoryId },
                    data: { image: remaining?.media.url ?? null },
                })
            }
        }

        revalidateAll()
        return { success: true }
    } catch (error) {
        console.log('[v0] removeCategoryAssociation error:', error)
        return { errors: [{ message: 'No se pudo quitar la asociacion.' }] }
    }
}
