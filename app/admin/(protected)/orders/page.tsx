'use client'

import useSWR from "swr"
import OrderCard from '@/components/order/OrderCard'
import Heading from '@/components/ui/Heading'
import { OrderWithProducts } from "@/src/types"
import Loading from '@/components/ui/Loading'
import ErrorState from '@/components/ui/ErrorState'
import EmptyState from '@/components/ui/EmptyState'
import { useOrderChannelSync } from "@/src/hooks/useOrderChannelSync"

const OrdersPage = () => {

    const url = '/admin/orders/api'
    const fetcher = async () => {
        const response = await fetch(url)
        if (!response.ok) {
            throw new Error('No se pudieron cargar las ordenes pendientes')
        }

        const data = await response.json()
        if (!Array.isArray(data)) {
            throw new Error('Respuesta invalida de ordenes pendientes')
        }

        return data
    }
    const { data, error, isLoading } = useSWR<OrderWithProducts[]>(url, fetcher, {
        refreshInterval: 600000,
        revalidateOnFocus: false
    })
    useOrderChannelSync('/admin/orders/api')
    
    if (isLoading) return <Loading message="Cargando órdenes..." />
    if (error) return <ErrorState message="Hubo un error al cargar las órdenes." />
    if (data) return (
        <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white/85 p-5 shadow-[0_16px_50px_rgba(15,23,42,0.07)] backdrop-blur sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">Operacion diaria</p>
                        <Heading>Órdenes pendientes</Heading>
                        <p className="-mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
                            Visualiza pedidos activos y complétalos cuando estén listos para entregar.
                        </p>
                    </div>

                    <div className="inline-flex items-center gap-2 self-start rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                        <span>{data.length}</span>
                        <span>{data.length === 1 ? 'orden pendiente' : 'ordenes pendientes'}</span>
                    </div>
                </div>
            </section>

            {data.length ? (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {data.map((order) => (
                        <OrderCard key={order.id} order={order} />
                    ))}
                </div>
            ) : <EmptyState message="No hay órdenes pendientes" />}
        </div>
    )
}

export default OrdersPage