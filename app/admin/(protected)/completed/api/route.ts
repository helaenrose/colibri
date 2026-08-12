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
      take: 200,
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

    // Se marca si la orden no tiene un ingreso activo en Finanzas: ya sea porque fue
    // archivado (eliminado) o porque nunca se creo (p.ej. ordenes completadas antes de
    // existir este modulo), para poder ofrecer la opcion de recuperarlo desde la orden.
    const activeEntries = await prisma.financeEntry.findMany({
      where: { orderId: { in: orders.map((order) => order.id) }, deletedAt: null },
      select: { orderId: true },
    })
    const activeOrderIds = new Set(activeEntries.map((entry) => entry.orderId))

    const ordersWithFinanceState = orders.map((order) => ({
      ...order,
      missingFinanceEntry: !activeOrderIds.has(order.id),
    }))

    return Response.json(ordersWithFinanceState)
  } catch (error) {
    if (isDemoFallbackEnabled) {
      return Response.json(getDemoReadyOrders())
    }

    console.error('Error loading ready orders', error)
    return Response.json({ message: 'No se pudieron cargar las ordenes listas' }, { status: 500 })
  }
}
