import { NextRequest } from "next/server"
import { isAdminAuthenticated } from "@/src/lib/admin-auth"
import { uploadMedia } from "@/src/lib/cloudinary"
import { prisma } from "@/src/lib/prisma"

export const dynamic = "force-dynamic"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]
const MAX_BYTES = 6 * 1024 * 1024 // 6MB

export const POST = async (request: NextRequest) => {
    if (!(await isAdminAuthenticated())) {
        return Response.json({ ok: false, error: "No autorizado." }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
        return Response.json({ ok: false, error: "No se recibio ningun archivo." }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
        return Response.json({ ok: false, error: "Formato no valido. Usa JPG, PNG, WEBP o GIF." }, { status: 400 })
    }

    if (file.size > MAX_BYTES) {
        return Response.json({ ok: false, error: "La imagen supera el limite de 6MB." }, { status: 400 })
    }

    try {
        const uploaded = await uploadMedia(file)

        // La tabla MediaAsset es la fuente de verdad de las imagenes subidas.
        const asset = await prisma.mediaAsset.create({
            data: {
                url: uploaded.secureUrl,
                publicId: uploaded.publicId,
                name: file.name.replace(/\.[^.]+$/, "") || "Imagen",
                width: uploaded.width ?? null,
                height: uploaded.height ?? null,
                bytes: uploaded.bytes ?? null,
                format: uploaded.format ?? null,
            },
        })

        return Response.json({ ok: true, asset })
    } catch (error) {
        console.log("[v0] media upload error:", error)
        return Response.json({ ok: false, error: "No se pudo subir la imagen." }, { status: 500 })
    }
}
