import { NextRequest } from "next/server"
import { uploadReceipt } from "@/src/lib/cloudinary"

export const dynamic = "force-dynamic"

const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp"]

export const POST = async (request: NextRequest) => {
    try {
        const formData = await request.formData()
        const file = formData.get("file")

        if (!(file instanceof File)) {
            return Response.json({ error: "No se envio ningun archivo" }, { status: 400 })
        }

        if (!ALLOWED.includes(file.type)) {
            return Response.json({ error: "Formato no valido. Usa JPG, PNG o WEBP" }, { status: 400 })
        }

        if (file.size > MAX_SIZE) {
            return Response.json({ error: "La imagen supera los 5MB" }, { status: 400 })
        }

        const { secureUrl, publicId } = await uploadReceipt(file)
        return Response.json({ url: secureUrl, publicId })
    } catch (error) {
        console.log("[v0] Error al subir comprobante:", error)
        return Response.json({ error: "No se pudo subir el comprobante" }, { status: 500 })
    }
}
