import { prisma } from "@/src/lib/prisma"
import { getDemoPendingOrders } from "@/src/demo/demo-store"
import { isDemoFallbackEnabled } from "@/src/lib/demo-fallback"

export const dynamic = 'force-dynamic'
export const GET = async () => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        status: false
      },
      include: {
        orderProducts: {
          include: {
            product: true
          }
        }
      }
    })
    return Response.json(orders)
  } catch (error) {
    if (isDemoFallbackEnabled) {
      return Response.json(getDemoPendingOrders())
    }

    console.error('Error loading pending orders', error)
    return Response.json({ message: 'No se pudieron cargar las ordenes pendientes' }, { status: 500 })
  }
}
