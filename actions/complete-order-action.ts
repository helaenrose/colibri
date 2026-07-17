'use server';
import { revalidatePath } from "next/cache";
import { prisma } from "@/src/lib/prisma";
import { OrderIdSchema } from "@/src/schema";
import { completeDemoOrder } from "@/src/demo/demo-store";
import { withTimeout } from "@/src/lib/with-timeout";
import { isDemoFallbackEnabled } from "@/src/lib/demo-fallback";

// Si es una accion hay que definirle que es server

export const completeOrder = async (formData: FormData) => {
    const data = {
        orderId: formData.get('order_id')!
    }

    const result = OrderIdSchema.safeParse(data)
    if (!result.success) {
        return { success: false, errors: result.error.issues }
    }

    try {
        await withTimeout(prisma.$transaction(async (tx) => {
            const order = await tx.order.findUnique({
                where: { id: result.data.orderId.toString() },
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
        revalidatePath('/admin/orders')
        return { success: true }
    } catch (error) {
        if (isDemoFallbackEnabled) {
            const updated = completeDemoOrder(result.data.orderId.toString())
            if (!updated) {
                return { success: false, errors: [{ message: 'No se pudo completar la orden' }] }
            }

            revalidatePath('/admin/orders')
            return { success: true, demo: true }
        }

        console.error('Error completing order', error)
        return { success: false, errors: [{ message: 'No se pudo completar la orden' }] }
    }
}
