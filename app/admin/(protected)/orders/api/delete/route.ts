import { prisma } from "@/src/lib/prisma"
import { OrderIdSchema } from "@/src/schema"
import { deleteDemoOrder } from "@/src/demo/demo-store"
import { withTimeout } from "@/src/lib/with-timeout"
import { isDemoFallbackEnabled } from "@/src/lib/demo-fallback"
import { NextRequest } from "next/server"
import { isAdminAuthenticated } from "@/src/lib/admin-auth"
import { deleteReceipt } from "@/src/lib/cloudinary"

export const dynamic = 'force-dynamic'

export const POST = async (request: NextRequest) => {
  if (!(await isAdminAuthenticated())) {
    return Response.json(
      { success: false, errors: [{ message: 'No autorizado para eliminar ordenes.' }] },
      { status: 403 },
    )
  }

  const payload = await request.json().catch(() => null)
  const result = OrderIdSchema.safeParse(payload)

  if (!result.success) {
    return Response.json({ success: false, errors: result.error.issues }, { status: 400 })
  }

  try {
    const order = await withTimeout(prisma.order.findUnique({
      where: { id: result.data.orderId },
      select: { id: true, receiptId: true },
    }))

    if (!order) {
      return Response.json({ success: false, errors: [{ message: 'La orden no existe' }] }, { status: 404 })
    }

    // Elimina primero los productos de la orden y luego la orden
    await withTimeout(prisma.orderProducts.deleteMany({ where: { orderId: order.id } }))
    await withTimeout(prisma.order.delete({ where: { id: order.id } }))

    // Al eliminar la orden se elimina tambien el comprobante de pago
    await deleteReceipt(order.receiptId)

    return Response.json({ success: true })
  } catch (error) {
    if (isDemoFallbackEnabled) {
      const removed = deleteDemoOrder(result.data.orderId)
      if (!removed) {
        return Response.json({ success: false, errors: [{ message: 'No se pudo eliminar la orden' }] }, { status: 404 })
      }
      return Response.json({ success: true, demo: true })
    }

    console.error('Error deleting order', error)
    return Response.json({ success: false, errors: [{ message: 'No se pudo eliminar la orden' }] }, { status: 500 })
  }
}
