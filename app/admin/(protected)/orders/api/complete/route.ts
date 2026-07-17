import { prisma } from "@/src/lib/prisma"
import { OrderIdSchema } from "@/src/schema"
import { completeDemoOrder } from "@/src/demo/demo-store"
import { withTimeout } from "@/src/lib/with-timeout"
import { isDemoFallbackEnabled } from "@/src/lib/demo-fallback"
import { NextRequest } from "next/server"
import { isAdminAuthenticated } from "@/src/lib/admin-auth"

export const dynamic = 'force-dynamic'

export const POST = async (request: NextRequest) => {
  if (!(await isAdminAuthenticated())) {
    return Response.json(
      { success: false, errors: [{ message: 'No autorizado para completar ordenes.' }] },
      { status: 403 },
    )
  }

  const payload = await request.json().catch(() => null)
  const result = OrderIdSchema.safeParse(payload)

  if (!result.success) {
    return Response.json({ success: false, errors: result.error.issues }, { status: 400 })
  }

  try {
    await withTimeout(prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: result.data.orderId },
        include: { orderProducts: true },
      })

      if (!order) {
        throw new Error('Orden no encontrada')
      }

      // El inventario se descuenta unicamente al aprobar la orden (y solo una vez)
      if (!order.status) {
        for (const item of order.orderProducts) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          })
        }
      }

      await tx.order.update({
        where: { id: order.id },
        data: {
          status: true,
          orderReadyAt: new Date(Date.now()),
        },
      })
    }))

    return Response.json({ success: true })
  } catch (error) {
    if (isDemoFallbackEnabled) {
      const updated = completeDemoOrder(result.data.orderId)
      if (!updated) {
        return Response.json({ success: false, errors: [{ message: 'No se pudo completar la orden' }] }, { status: 404 })
      }

      return Response.json({ success: true, demo: true })
    }

    console.error('Error completing order', error)
    return Response.json({ success: false, errors: [{ message: 'No se pudo completar la orden' }] }, { status: 500 })
  }
}
