'use client'

import { useRef, useState } from "react"
import Image from "next/image"
import { toast } from "react-toastify"
import { mutate } from "swr"
import { useStore } from "@/src/store/store"
import { notifyOrderUpdate } from "@/src/hooks/useOrderChannelSync"

type DeliveryType = "PICKUP" | "DELIVERY"

type OrderItem = {
    id: string
    name: string
    price: number
    quantity: number
}

type Props = {
    total: number
    onSuccess: () => void
}

const OrderCheckoutForm = ({ total, onSuccess }: Props) => {
    const order = useStore((state) => state.order)
    const cleanOrder = useStore((state) => state.cleanOrder)

    const [deliveryType, setDeliveryType] = useState<DeliveryType>("PICKUP")
    const [receiptUrl, setReceiptUrl] = useState<string>("")
    const [receiptId, setReceiptId] = useState<string>("")
    const [isUploading, setIsUploading] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const uploadReceipt = async (file: File) => {
        setIsUploading(true)
        try {
            const formData = new FormData()
            formData.append("file", file)
            const request = await fetch("/order/api/receipt", {
                method: "POST",
                body: formData,
            })
            const response = await request.json()
            if (!request.ok) {
                throw new Error(response?.error ?? "No se pudo subir el comprobante")
            }
            setReceiptUrl(response.url)
            setReceiptId(response.publicId)
            toast.success("Comprobante cargado")
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "No se pudo subir el comprobante")
        } finally {
            setIsUploading(false)
        }
    }

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            void uploadReceipt(file)
        }
    }

    const removeReceipt = () => {
        setReceiptUrl("")
        setReceiptId("")
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        if (order.length === 0) {
            toast.error("Agrega al menos un producto al pedido")
            return
        }

        const formData = new FormData(event.currentTarget)
        const name = String(formData.get("name") ?? "").trim()
        const phone = String(formData.get("phone") ?? "").trim()
        const email = String(formData.get("email") ?? "").trim()
        const address = String(formData.get("address") ?? "").trim()

        if (name.length < 3) {
            toast.error("Ingresa tu nombre")
            return
        }
        if (phone.length < 6) {
            toast.error("Ingresa tu celular")
            return
        }
        if (deliveryType === "DELIVERY" && address.length < 5) {
            toast.error("Ingresa la direccion de entrega")
            return
        }
        if (!receiptUrl || !receiptId) {
            toast.error("Sube el comprobante de pago para continuar")
            return
        }

        const data = {
            name,
            phone,
            email,
            deliveryType,
            address,
            receiptUrl,
            receiptId,
            total,
            order: order.map((item: OrderItem) => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                subTotal: item.price * item.quantity,
            })),
        }

        setIsSubmitting(true)
        let response: { success?: boolean; errors?: { message: string }[] }
        try {
            const request = await fetch("/order/api", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })
            response = await request.json()
            if (!request.ok && !response?.errors) {
                throw new Error("No se pudo crear el pedido")
            }
        } catch {
            toast.error("No se pudo crear el pedido")
            setIsSubmitting(false)
            return
        }

        if (response?.errors) {
            response.errors.forEach((issue) => toast.error(issue.message))
            setIsSubmitting(false)
            return
        }

        if (!response?.success) {
            toast.error("No se pudo crear el pedido")
            setIsSubmitting(false)
            return
        }

        toast.success("Pedido realizado con exito")
        mutate("/admin/orders/api")
        notifyOrderUpdate()
        cleanOrder()
        removeReceipt()
        setDeliveryType("PICKUP")
        setIsSubmitting(false)
        onSuccess()
    }

    const inputClass =
        "w-full rounded-md border border-gray-200 bg-white p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"

    return (
        <form onSubmit={handleSubmit} className="mt-3 w-full space-y-3" noValidate>
            <div className="space-y-2">
                <input type="text" name="name" placeholder="Tu nombre *" aria-label="Nombre" className={inputClass} />
                <input type="tel" name="phone" placeholder="Tu celular *" aria-label="Celular" className={inputClass} />
                <input type="email" name="email" placeholder="Tu correo (opcional)" aria-label="Correo" className={inputClass} />
            </div>

            <fieldset className="space-y-2">
                <legend className="text-sm font-semibold text-slate-700">Tipo de entrega</legend>
                <div className="grid grid-cols-2 gap-2">
                    <label
                        className={`flex cursor-pointer items-center justify-center rounded-md border px-2 py-2 text-sm font-medium transition ${deliveryType === "PICKUP" ? "border-slate-900 bg-slate-900 text-white" : "border-gray-200 bg-white text-slate-700"}`}
                    >
                        <input
                            type="radio"
                            name="deliveryType"
                            value="PICKUP"
                            className="sr-only"
                            checked={deliveryType === "PICKUP"}
                            onChange={() => setDeliveryType("PICKUP")}
                        />
                        Retiro en tienda
                    </label>
                    <label
                        className={`flex cursor-pointer items-center justify-center rounded-md border px-2 py-2 text-sm font-medium transition ${deliveryType === "DELIVERY" ? "border-slate-900 bg-slate-900 text-white" : "border-gray-200 bg-white text-slate-700"}`}
                    >
                        <input
                            type="radio"
                            name="deliveryType"
                            value="DELIVERY"
                            className="sr-only"
                            checked={deliveryType === "DELIVERY"}
                            onChange={() => setDeliveryType("DELIVERY")}
                        />
                        Envio a domicilio
                    </label>
                </div>
            </fieldset>

            {deliveryType === "DELIVERY" && (
                <div className="space-y-2">
                    <textarea
                        name="address"
                        rows={2}
                        placeholder="Direccion de entrega *"
                        aria-label="Direccion de entrega"
                        className={inputClass}
                    />
                    <div
                        role="alert"
                        className="rounded-md border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-800"
                    >
                        El costo extra del envio a domicilio se calcula y se paga al momento de recibir el pedido.
                    </div>
                </div>
            )}

            <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-700">Comprobante de pago *</p>
                {receiptUrl ? (
                    <div className="space-y-2">
                        <div className="relative h-40 w-full overflow-hidden rounded-md border border-gray-200 bg-gray-50">
                            <Image src={receiptUrl} alt="Comprobante de pago" fill className="object-contain" />
                        </div>
                        <button
                            type="button"
                            onClick={removeReceipt}
                            className="text-xs font-semibold text-red-600 hover:underline"
                        >
                            Quitar comprobante
                        </button>
                    </div>
                ) : (
                    <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-gray-300 bg-gray-50 p-4 text-center text-xs text-slate-500 transition hover:border-amber-400">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="sr-only"
                            onChange={handleFileChange}
                            disabled={isUploading}
                        />
                        <span className="font-semibold text-slate-700">
                            {isUploading ? "Subiendo..." : "Subir comprobante"}
                        </span>
                        <span>JPG, PNG o WEBP (max 5MB)</span>
                    </label>
                )}
            </div>

            <button
                type="submit"
                disabled={isSubmitting || isUploading}
                className="w-full cursor-pointer rounded-md bg-gray-800 py-2.5 text-center text-sm font-semibold uppercase text-white transition-all hover:bg-gray-950 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
                {isSubmitting ? "Enviando..." : "Confirmar pedido"}
            </button>
        </form>
    )
}

export default OrderCheckoutForm
