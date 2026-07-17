'use client'

import useSWR from 'swr'
import LatestOrderItem from '@/components/order/LatestOrderItem'
import Heading from '@/components/ui/Heading'
import { OrderWithProducts } from '@/src/types'
import Loading from '@/components/ui/Loading'
import ErrorState from '@/components/ui/ErrorState'
import EmptyState from '@/components/ui/EmptyState'
import { useOrderChannelSync } from '@/src/hooks/useOrderChannelSync'

const CompletedOrdersPage = () => {

    const url = '/admin/completed/api'
    const fetcher = async () => {
        const response = await fetch(url)
        if (!response.ok) {
            throw new Error('No se pudieron cargar las ordenes completadas')
        }

        const data = await response.json()
        if (!Array.isArray(data)) {
            throw new Error('Respuesta invalida de ordenes completadas')
        }

        return data
    }
    const { data, error, isLoading } = useSWR<OrderWithProducts[]>(url, fetcher, {
        revalidateOnFocus: false
    })
    const readyOrders = data?.filter(order => order.status === true) ?? []

    useOrderChannelSync(url)

    if (isLoading) return <Loading message="Cargando ordenes..." />
    if (error) return <ErrorState message="Hubo un error al cargar las ordenes." />
    if (data) return (
        <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white/85 p-5 shadow-[0_16px_50px_rgba(15,23,42,0.07)] backdrop-blur sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">Historial</p>
                        <Heading>Ordenes completadas</Heading>
                        <p className="-mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
                            Consulta los pedidos que ya fueron marcados como listos para entregar.
                        </p>
                    </div>

                    <div className="inline-flex items-center gap-2 self-start rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                        <span>{readyOrders.length}</span>
                        <span>{readyOrders.length === 1 ? 'orden completada' : 'ordenes completadas'}</span>
                    </div>
                </div>
            </section>

            {readyOrders.length ? (
                <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
                    {readyOrders.map((order, index) => (
                        <LatestOrderItem key={order.id} order={order} index={index} />
                    ))}
                </div>
            ) : (
                <EmptyState message="No hay ordenes completadas por ahora" />
            )}
        </div>
    )
}

export default CompletedOrdersPage
