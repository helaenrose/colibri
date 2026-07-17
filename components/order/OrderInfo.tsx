import Image from "next/image"
import { OrderWithProducts } from "@/src/types"

interface OrderInfoProps {
    order: OrderWithProducts
}

const OrderInfo = ({ order }: OrderInfoProps) => {
    const isDelivery = order.deliveryType === "DELIVERY"

    return (
        <div className="mt-4 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm">
            <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Entrega</span>
                <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${isDelivery ? "bg-sky-100 text-sky-800" : "bg-emerald-100 text-emerald-800"}`}
                >
                    {isDelivery ? "Envio a domicilio" : "Retiro en tienda"}
                </span>
            </div>

            <dl className="space-y-1.5 text-slate-700">
                <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Celular</dt>
                    <dd className="text-right font-medium">{order.phone}</dd>
                </div>
                {order.email ? (
                    <div className="flex justify-between gap-3">
                        <dt className="text-slate-500">Correo</dt>
                        <dd className="break-all text-right font-medium">{order.email}</dd>
                    </div>
                ) : null}
                {isDelivery && order.address ? (
                    <div className="flex justify-between gap-3">
                        <dt className="text-slate-500">Direccion</dt>
                        <dd className="text-right font-medium">{order.address}</dd>
                    </div>
                ) : null}
            </dl>

            <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Comprobante de pago</p>
                <a
                    href={order.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block overflow-hidden rounded-xl border border-slate-200"
                >
                    <span className="relative block h-40 w-full bg-white">
                        <Image
                            src={order.receiptUrl}
                            alt={`Comprobante de pago de ${order.name}`}
                            fill
                            sizes="(max-width: 640px) 100vw, 320px"
                            className="object-contain transition group-hover:scale-105"
                        />
                    </span>
                </a>
            </div>
        </div>
    )
}

export default OrderInfo
