import { prisma } from "@/src/lib/prisma"
import { getDemoProducts } from "@/src/demo/demo-store"
import { isDemoFallbackEnabled } from "@/src/lib/demo-fallback"

export const dynamic = 'force-dynamic'

/**
 * POST /order/api/validate-cart
 * Body: { ids: string[] }
 * Response: { unavailable: string[] }  — IDs que ya no están disponibles
 * (producto inactivo, sin stock, o eliminado).
 */
export const POST = async (request: Request) => {
    const body = await request.json().catch(() => null) as { ids?: unknown } | null
    const ids = Array.isArray(body?.ids) ? (body.ids as unknown[]).filter((id): id is string => typeof id === 'string') : []

    if (ids.length === 0) {
        return Response.json({ unavailable: [] })
    }

    try {
        // Traemos solo los productos que siguen activos y con stock.
        const available = await prisma.product.findMany({
            where: { id: { in: ids }, active: true, stock: { gt: 0 } },
            select: { id: true },
        })

        const availableSet = new Set(available.map((p) => p.id))
        const unavailable = ids.filter((id) => !availableSet.has(id))

        return Response.json({ unavailable })
    } catch {
        // En modo demo comparamos contra los productos del store en memoria.
        if (isDemoFallbackEnabled) {
            const availableSet = new Set(
                getDemoProducts()
                    .filter((p: { active: boolean; stock: number; id: string }) => p.active && p.stock > 0)
                    .map((p: { id: string }) => p.id),
            )
            const unavailable = ids.filter((id) => !availableSet.has(id))
            return Response.json({ unavailable })
        }

        // Si falla la BD devolvemos array vacío para no bloquear al usuario.
        return Response.json({ unavailable: [] })
    }
}
