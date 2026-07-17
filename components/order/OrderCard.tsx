import { OrderWithProducts } from '@/src/types'
import { formatCurrency } from '@/src/utils'
import OrderCardButton from './OrderCardButton'
import OrderInfo from './OrderInfo'
import DeleteOrderButton from './DeleteOrderButton'
import { mutate } from 'swr'
import { notifyOrderUpdate } from '@/src/hooks/useOrderChannelSync'
import { toast } from 'react-toastify'
import { useState } from 'react'


interface OrderCardProps {
    order: OrderWithProducts
}

const OrderCard = ({ order }: OrderCardProps) => {
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        if (isSubmitting) return
        setIsSubmitting(true)

        try {
            await mutate<OrderWithProducts[]>(
                '/admin/orders/api',
                async (currentOrders = []) => {
                    const request = await fetch('/admin/orders/api/complete', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ orderId: order.id }),
                    })

                    const response = await request.json()
                    if (!request.ok || !response?.success) {
                        throw new Error('No se pudo completar la orden')
                    }

                    notifyOrderUpdate()
                    return currentOrders.filter((currentOrder) => currentOrder.id !== order.id)
                },
                {
                    optimisticData: (currentOrders = []) => currentOrders.filter((currentOrder) => currentOrder.id !== order.id),
                    rollbackOnError: true,
                    revalidate: false,
                    populateCache: true,
                },
            )

            toast.success('Orden completada')
            mutate('/admin/completed/api')
        } catch {
            toast.error('No se pudo completar la orden')
        } finally {
            setIsSubmitting(false)
        }
    }


    return (
        <section
            aria-labelledby="summary-heading"
            className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-6"
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className='text-xs font-semibold uppercase tracking-[0.18em] text-slate-500'>Cliente</p>
                    <p className='mt-1 text-xl font-bold text-slate-900'>{order.name}</p>
                </div>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-800">
                    Pendiente
                </span>
            </div>

            <p className='mt-4 text-sm font-semibold uppercase tracking-[0.14em] text-slate-500'>Productos ordenados</p>
            <dl className="mt-3 space-y-3">
                {order.orderProducts.map((product) => (
                    <div key={product.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                        <dd className='text-sm font-medium text-slate-800'>{product.product.name}</dd>
                        <dt className='shrink-0 rounded-full bg-slate-200 px-2.5 py-1 text-xs font-bold text-slate-700'>
                            x{product.quantity}
                        </dt>
                    </div>

                ))}
                <div className="mt-4 flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-3 py-3">
                    <dt className="text-sm font-semibold uppercase tracking-wide text-amber-800">Total</dt>
                    <dd className="text-lg font-black text-amber-900">{formatCurrency(order.total)}</dd>
                </div>
            </dl>

            <OrderInfo order={order} />

            <form
                onSubmit={handleSubmit}
                aria-label={`Completar orden de ${order.name}`}
            >
                <input
                    type="text"
                    defaultValue={order.id}
                    className='hidden'
                    name='order_id' />
                <OrderCardButton pending={isSubmitting} />
            </form>

            <DeleteOrderButton orderId={order.id} mutateKey="/admin/orders/api" />
        </section>
    )
}

export default OrderCard
