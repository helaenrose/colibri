'use client'

import { useRef, useState } from "react"
import Image from "next/image"
import { toast } from "react-toastify"
import { mutate } from "swr"
import { Turnstile } from "@marsidev/react-turnstile"
import { useStore } from "@/src/store/store"
import { notifyOrderUpdate } from "@/src/hooks/useOrderChannelSync"
import { compressImage } from "@/src/lib/compress-image"
import UnavailableItemsDialog from "./UnavailableItemsDialog"

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
    const customer = useStore((state) => state.customer)
    const setCustomer = useStore((state) => state.setCustomer)
    const cleanOrder = useStore((state) => state.cleanOrder)
    const removeItemFromCart = useStore((state) => state.removeItemFromCart)

    const [isUploading, setIsUploading] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Archivo seleccionado localmente — solo se sube a Cloudinary al confirmar el pedido.
    const [receiptFile, setReceiptFile] = useState<File | null>(null)
    // URL local para previsualizar sin subir nada.
    const [receiptPreview, setReceiptPreview] = useState<string | null>(null)

    // Diálogo de productos no disponibles detectados al momento de confirmar.
    const [unavailableNames, setUnavailableNames] = useState<string[]>([])
    // Función guardada para re-ejecutar el submit después de que el usuario confirme.
    const pendingSubmitRef = useRef<(() => Promise<void>) | null>(null)

    // Sube el archivo a Cloudinary y devuelve { url, publicId } o lanza error.
    const uploadReceiptNow = async (file: File): Promise<{ url: string; publicId: string }> => {
        const optimized = await compressImage(file)
        const formData = new FormData()
        formData.append("file", optimized)
        const res = await fetch("/order/api/receipt", { method: "POST", body: formData })
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error ?? "No se pudo subir el comprobante")
        return { url: data.url, publicId: data.publicId }
    }

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        const MAX_SIZE = 5 * 1024 * 1024
        if (file.size > MAX_SIZE) {
            toast.error("La imagen supera los 5MB. Elige un archivo mas pequeno.")
            return
        }

        // Revocar la URL anterior si existia para liberar memoria.
        if (receiptPreview) URL.revokeObjectURL(receiptPreview)

        setReceiptFile(file)
        setReceiptPreview(URL.createObjectURL(file))
        // Limpiar cualquier URL de Cloudinary previa del estado del cliente.
        setCustomer({ receiptUrl: "", receiptId: "" })
    }

    const removeReceipt = () => {
        if (receiptPreview) URL.revokeObjectURL(receiptPreview)
        setReceiptFile(null)
        setReceiptPreview(null)
        setCustomer({ receiptUrl: "", receiptId: "" })
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        if (order.length === 0) {
            toast.error("Agrega al menos un producto al pedido")
            return
        }

        const name = customer.name.trim()
        const phone = customer.phone.trim()
        const email = customer.email.trim()
        const address = customer.address.trim()
        const deliveryType = customer.deliveryType

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
        if (!receiptFile && !customer.receiptUrl) {
            toast.error("Sube el comprobante de pago para continuar")
            return
        }

        // Verificar disponibilidad de productos antes de enviar.
        // Si la API no está disponible, continuamos para no bloquear al usuario.
        try {
            const validationRes = await fetch('/order/api/validate-cart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: order.map((i) => i.id) }),
            })
            if (validationRes.ok) {
                const { unavailable } = await validationRes.json() as { unavailable: string[] }
                if (unavailable.length > 0) {
                    // Obtener los nombres de los productos no disponibles.
                    const names = order
                        .filter((i) => unavailable.includes(i.id))
                        .map((i) => i.name)

                    // Guardar un callback para que el diálogo pueda reanudar el envío
                    // después de que el usuario elimine los productos y confirme.
                    pendingSubmitRef.current = async () => {
                        unavailable.forEach((id) => removeItemFromCart(id))
                    }
                    setUnavailableNames(names)
                    return
                }
            }
        } catch {
            // Fallo silencioso: si la validación falla, intentamos enviar igual.
        }

        if (!turnstileToken) {
            toast.error("Completa la verificacion de seguridad para continuar")
            return
        }

        setIsSubmitting(true)

        // Subir el comprobante a Cloudinary solo en este momento.
        // Si ya fue subido en un intento anterior (receiptUrl presente), lo reutilizamos.
        let receiptUrl = customer.receiptUrl
        let receiptId = customer.receiptId
        if (receiptFile && !receiptUrl) {
            setIsUploading(true)
            try {
                const uploaded = await uploadReceiptNow(receiptFile)
                receiptUrl = uploaded.url
                receiptId = uploaded.publicId
                setCustomer({ receiptUrl, receiptId })
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "No se pudo subir el comprobante")
                setIsUploading(false)
                setIsSubmitting(false)
                return
            } finally {
                setIsUploading(false)
            }
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
            turnstileToken,
            order: order.map((item: OrderItem) => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                subTotal: item.price * item.quantity,
            })),
        }

        let response: { success?: boolean; errors?: { message: string }[]; unavailableIds?: string[] }
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

        // Si el servidor devuelve IDs no disponibles (segunda linea de defensa),
        // mostramos el dialogo igual que si lo hubiera detectado el cliente.
        if (response?.unavailableIds && response.unavailableIds.length > 0) {
            const names = order
                .filter((i) => response.unavailableIds!.includes(i.id))
                .map((i) => i.name)
            pendingSubmitRef.current = async () => {
                response.unavailableIds!.forEach((id) => removeItemFromCart(id))
            }
            setUnavailableNames(names)
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
        // Limpia el carrito y los datos del cliente guardados en localStorage.
        cleanOrder()
        if (fileInputRef.current) fileInputRef.current.value = ""
        if (receiptPreview) URL.revokeObjectURL(receiptPreview)
        setReceiptFile(null)
        setReceiptPreview(null)
        setTurnstileToken(null)
        setIsSubmitting(false)
        onSuccess()
    }

    const inputClass =
        "w-full rounded-md border border-gray-200 bg-white p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"

    return (
        <form onSubmit={handleSubmit} className="mt-3 w-full space-y-3" noValidate>
            <div className="space-y-2">
                <input
                    type="text"
                    name="name"
                    placeholder="Tu nombre *"
                    aria-label="Nombre"
                    className={inputClass}
                    value={customer.name}
                    onChange={(e) => setCustomer({ name: e.target.value })}
                />
                <input
                    type="tel"
                    name="phone"
                    placeholder="Tu celular *"
                    aria-label="Celular"
                    className={inputClass}
                    value={customer.phone}
                    onChange={(e) => setCustomer({ phone: e.target.value })}
                />
                <input
                    type="email"
                    name="email"
                    placeholder="Tu correo (opcional)"
                    aria-label="Correo"
                    className={inputClass}
                    value={customer.email}
                    onChange={(e) => setCustomer({ email: e.target.value })}
                />
            </div>

            <fieldset className="space-y-2">
                <legend className="text-sm font-semibold text-slate-700">Tipo de entrega</legend>
                <div className="grid grid-cols-2 gap-2">
                    <label
                        className={`flex cursor-pointer items-center justify-center rounded-md border px-2 py-2 text-sm font-medium transition ${customer.deliveryType === "PICKUP" ? "border-slate-900 bg-slate-900 text-white" : "border-gray-200 bg-white text-slate-700"}`}
                    >
                        <input
                            type="radio"
                            name="deliveryType"
                            value="PICKUP"
                            className="sr-only"
                            checked={customer.deliveryType === "PICKUP"}
                            onChange={() => setCustomer({ deliveryType: "PICKUP" })}
                        />
                        Retiro en tienda
                    </label>
                    <label
                        className={`flex cursor-pointer items-center justify-center rounded-md border px-2 py-2 text-sm font-medium transition ${customer.deliveryType === "DELIVERY" ? "border-slate-900 bg-slate-900 text-white" : "border-gray-200 bg-white text-slate-700"}`}
                    >
                        <input
                            type="radio"
                            name="deliveryType"
                            value="DELIVERY"
                            className="sr-only"
                            checked={customer.deliveryType === "DELIVERY"}
                            onChange={() => setCustomer({ deliveryType: "DELIVERY" })}
                        />
                        Envio a domicilio
                    </label>
                </div>
            </fieldset>

            {customer.deliveryType === "DELIVERY" && (
                <div className="space-y-2">
                    <textarea
                        name="address"
                        rows={2}
                        placeholder="Direccion de entrega *"
                        aria-label="Direccion de entrega"
                        className={inputClass}
                        value={customer.address}
                        onChange={(e) => setCustomer({ address: e.target.value })}
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
                {receiptPreview ? (
                    <div className="space-y-2">
                        <div className="relative h-40 w-full overflow-hidden rounded-md border border-gray-200 bg-gray-50">
                            <Image src={receiptPreview} alt="Vista previa del comprobante" fill className="object-contain" />
                        </div>
                        <p className="text-xs text-slate-500">El comprobante se enviara junto con tu pedido.</p>
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
                            disabled={isSubmitting}
                        />
                        <span className="font-semibold text-slate-700">Subir comprobante</span>
                        <span>JPG, PNG o WEBP</span>
                    </label>
                )}
            </div>

            <div
                role="alert"
                className="rounded-md border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-800"
            >
                Solo se despachara despues de que el pago se haga efectivo, por favor tomar esto en cuenta sobre todo en transferencias interbancarias.
            </div>

            {/* Widget de verificacion anti-bots de Cloudflare Turnstile */}
            {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ? (
                <Turnstile
                    siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                    onSuccess={setTurnstileToken}
                    onExpire={() => setTurnstileToken(null)}
                    onError={() => {
                        setTurnstileToken(null)
                        toast.error("Error en la verificacion de seguridad. Recarga la pagina.")
                    }}
                    options={{ theme: "light", size: "flexible" }}
                    className="w-full overflow-hidden rounded-md"
                />
            ) : null}

            <button
                type="submit"
                disabled={
                    isSubmitting ||
                    isUploading ||
                    (!!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !turnstileToken)
                }
                className="w-full cursor-pointer rounded-md bg-gray-800 py-2.5 text-center text-sm font-semibold uppercase text-white transition-all hover:bg-gray-950 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
                {isSubmitting ? "Enviando..." : "Confirmar pedido"}
            </button>

            <UnavailableItemsDialog
                unavailableNames={unavailableNames}
                onProceed={() => {
                    if (pendingSubmitRef.current) {
                        void pendingSubmitRef.current()
                        pendingSubmitRef.current = null
                    }
                    setUnavailableNames([])
                }}
                onCancel={() => {
                    pendingSubmitRef.current = null
                    setUnavailableNames([])
                }}
            />
        </form>
    )
}

export default OrderCheckoutForm
