'use client'

import { OrderWithProducts } from '@/src/types'
import React from 'react'
import OrderInfo from './OrderInfo'
import DeleteOrderButton from './DeleteOrderButton'

interface LatestOrderItemProps {
    order: OrderWithProducts
    index: number
}
const LatestOrderItem = ({ order, index }: LatestOrderItemProps) => {
    return (
        <article className='rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-5'>
            <div className='flex items-start justify-between gap-3'>
                <p className='line-clamp-1 pr-2 text-lg font-bold text-slate-900 sm:text-xl'>
                    {order.name}
                </p>
                <span className='rounded-full bg-rose-500 px-2.5 py-1 text-xs font-bold text-white shadow-sm sm:px-3 sm:text-sm'>
                    #{index + 1 < 10 ? `0${index + 1}` : index + 1}
                </span>
            </div>

            <p className='mt-2 text-sm text-slate-500'>Pedido listo para entregar</p>

            <ul
                className='mt-4 divide-y divide-slate-200 border-t border-gray-200 text-sm font-medium text-slate-600'
                role='list'
            >
                {order.orderProducts.map(product => (
                    <li
                        key={product.id}
                        className='flex items-center justify-between gap-3 py-4'
                    >
                        <p className='line-clamp-2 text-sm font-medium text-slate-700 sm:text-base'>{product.product.name}</p>
                        <span className='shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700'>
                            x{product.quantity}
                        </span>
                    </li>
                ))}
            </ul>

            <OrderInfo order={order} />

            <DeleteOrderButton orderId={order.id} mutateKey="/admin/completed/api" />
        </article>
    )
}

export default LatestOrderItem
