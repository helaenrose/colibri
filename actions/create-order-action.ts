'use server'

import { prisma } from "@/src/lib/prisma"
import { OrderSchema } from "@/src/schema"
import { createDemoOrder } from "@/src/demo/demo-store"
import { withTimeout } from "@/src/lib/with-timeout"
import { isDemoFallbackEnabled } from "@/src/lib/demo-fallback"

export const handleCreateOrder = async (data: unknown) => {

    const result = OrderSchema.safeParse(data)
    if (!result.success) {
        return {
            errors: result.error.errors
        }
    }

    try {
        await withTimeout(prisma.order.create({
            data: {
                name: result.data.name,
                phone: result.data.phone,
                email: result.data.email || null,
                deliveryType: result.data.deliveryType,
                address: result.data.deliveryType === "DELIVERY" ? (result.data.address || null) : null,
                receiptUrl: result.data.receiptUrl,
                receiptId: result.data.receiptId,
                total: result.data.total,
                orderProducts: {
                    create: result.data.order.map(product => ({
                        product: {
                            connect: { id: String(product.id) }
                        },
                        quantity: product.quantity
                    }))
                }
            }
        }))
        return { success: true }
    } catch (error) {
        if (isDemoFallbackEnabled) {
            createDemoOrder(result.data)
            return { success: true, demo: true }
        }

        console.error('Error creating order', error)
        return {
            success: false,
            errors: [{ message: 'No se pudo crear el pedido. Intenta de nuevo.' }]
        }
    }

}
