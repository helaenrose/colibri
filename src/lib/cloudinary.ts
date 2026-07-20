import { v2 as cloudinary } from "cloudinary"

// El SDK de Cloudinary auto-detecta CLOUDINARY_URL (cloudinary://api_key:api_secret@cloud_name),
// que ya incluye las tres credenciales. Solo forzamos HTTPS; el resto lo resuelve el SDK.
if (!process.env.CLOUDINARY_URL) {
    console.log("[v0] Falta la variable de entorno CLOUDINARY_URL; las subidas a Cloudinary fallaran.")
}

cloudinary.config({ secure: true })

export const RECEIPTS_FOLDER = "colibri/comprobantes"
export const MEDIA_FOLDER = "colibri/galeria"

type UploadResult = {
    secureUrl: string
    publicId: string
}

type MediaUploadResult = {
    secureUrl: string
    publicId: string
    width?: number
    height?: number
    bytes?: number
    format?: string
}

// Sube una imagen a la galeria general (fuente de verdad en la tabla MediaAsset)
export const uploadMedia = async (file: File): Promise<MediaUploadResult> => {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    return new Promise<MediaUploadResult>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: MEDIA_FOLDER, resource_type: "image" },
            (error, result) => {
                if (error || !result) {
                    reject(error ?? new Error("No se pudo subir la imagen"))
                    return
                }
                resolve({
                    secureUrl: result.secure_url,
                    publicId: result.public_id,
                    width: result.width,
                    height: result.height,
                    bytes: result.bytes,
                    format: result.format,
                })
            },
        )
        stream.end(buffer)
    })
}

// Elimina una imagen de Cloudinary por su publicId
export const deleteImage = async (publicId: string | null | undefined) => {
    if (!publicId) return
    try {
        await cloudinary.uploader.destroy(publicId, { resource_type: "image" })
    } catch (error) {
        console.log("[v0] Error al eliminar imagen de Cloudinary:", error)
    }
}

export const uploadReceipt = async (file: File): Promise<UploadResult> => {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    return new Promise<UploadResult>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: RECEIPTS_FOLDER, resource_type: "image" },
            (error, result) => {
                if (error || !result) {
                    reject(error ?? new Error("No se pudo subir el comprobante"))
                    return
                }
                resolve({ secureUrl: result.secure_url, publicId: result.public_id })
            },
        )
        stream.end(buffer)
    })
}

export const deleteReceipt = async (publicId: string | null | undefined) => {
    if (!publicId) return
    try {
        await cloudinary.uploader.destroy(publicId, { resource_type: "image" })
    } catch (error) {
        console.log("[v0] Error al eliminar comprobante de Cloudinary:", error)
    }
}

export default cloudinary
