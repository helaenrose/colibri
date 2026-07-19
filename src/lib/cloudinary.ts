import { v2 as cloudinary } from "cloudinary"

// El SDK de Cloudinary auto-detecta CLOUDINARY_URL (cloudinary://api_key:api_secret@cloud_name),
// que ya incluye las tres credenciales. Solo forzamos HTTPS; el resto lo resuelve el SDK.
if (!process.env.CLOUDINARY_URL) {
    console.log("[v0] Falta la variable de entorno CLOUDINARY_URL; las subidas a Cloudinary fallaran.")
}

cloudinary.config({ secure: true })

export const RECEIPTS_FOLDER = "colibri/comprobantes"

type UploadResult = {
    secureUrl: string
    publicId: string
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
