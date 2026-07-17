import { prisma } from "@/src/lib/prisma"
import { getDemoReadyOrders } from "@/src/demo/demo-store"
import { isDemoFallbackEnabled } from "@/src/lib/demo-fallback"
import { isAdminAuthenticated } from "@/src/lib/admin-auth"

export const dynamic = 'force-dynamic'

export const GET = async () => {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ message: 'No autorizado' }, { status: 401 })
  }

  try {
    const orders = await prisma.order.findMany({
      take: 10,
      where: {
        orderReadyAt: {
          not: null
        }
      },
      orderBy: {
        orderReadyAt: 'desc'
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
      return Response.json(getDemoReadyOrders())
    }

    console.error('Error loading ready orders', error)
    return Response.json({ message: 'No se pudieron cargar las ordenes listas' }, { status: 500 })
  }
}
