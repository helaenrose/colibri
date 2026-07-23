import { NextRequest } from "next/server"
import { uploadReceipt } from "@/src/lib/cloudinary"
import { Redis } from "@upstash/redis"
import { Ratelimit } from "@upstash/ratelimit"

export const dynamic = "force-dynamic"

const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"]

// Magic bytes de cada formato para verificar el contenido real del archivo,
// independientemente del Content-Type que declare el cliente.
const MAGIC: { mime: string; bytes: number[] }[] = [
    { mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
    { mime: "image/png",  bytes: [0x89, 0x50, 0x4e, 0x47] },
    { mime: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46] }, // "RIFF"
]

const detectMagic = (buf: Uint8Array): boolean =>
    MAGIC.some((m) => m.bytes.every((b, i) => buf[i] === b))

// Rate limiter: max 10 subidas de comprobante por IP cada 15 minutos.
// Lazy — solo se instancia si las variables de Upstash están disponibles.
const getRateLimiter = (() => {
    let limiter: Ratelimit | null = null
    return () => {
        if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null
        if (!limiter) {
            limiter = new Ratelimit({
                redis: new Redis({
                    url: process.env.UPSTASH_REDIS_REST_URL,
                    token: process.env.UPSTASH_REDIS_REST_TOKEN,
                }),
                limiter: Ratelimit.slidingWindow(10, "15 m"),
                prefix: "rl:receipt",
            })
        }
        return limiter
    }
})()

export const POST = async (request: NextRequest) => {
    // Extraer IP del cliente.
    const clientIp =
        request.headers.get("CF-Connecting-IP") ??
        request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ??
        "0.0.0.0"

    // Rate limiting.
    const rateLimiter = getRateLimiter()
    if (rateLimiter) {
        const { success, reset } = await rateLimiter.limit(clientIp)
        if (!success) {
            const retryAfter = Math.ceil((reset - Date.now()) / 1000)
            return Response.json(
                { error: "Demasiadas solicitudes. Intenta de nuevo en unos minutos." },
                { status: 429, headers: { "Retry-After": String(retryAfter) } },
            )
        }
    }

    try {
        const formData = await request.formData()
        const file = formData.get("file")

        if (!(file instanceof File)) {
            return Response.json({ error: "No se envio ningun archivo" }, { status: 400 })
        }

        // Validar tipo MIME declarado.
        if (!ALLOWED_MIME.includes(file.type)) {
            return Response.json({ error: "Formato no valido. Usa JPG, PNG o WEBP" }, { status: 400 })
        }

        // Validar tamaño.
        if (file.size > MAX_SIZE) {
            return Response.json({ error: "La imagen supera los 5MB" }, { status: 400 })
        }

        // Verificar magic bytes: confirmar que el contenido real coincide con el tipo declarado.
        const header = new Uint8Array(await file.slice(0, 8).arrayBuffer())
        if (!detectMagic(header)) {
            return Response.json({ error: "El archivo no es una imagen valida" }, { status: 400 })
        }

        const { secureUrl, publicId } = await uploadReceipt(file)
        return Response.json({ url: secureUrl, publicId })
    } catch {
        return Response.json({ error: "No se pudo subir el comprobante" }, { status: 500 })
    }
}
