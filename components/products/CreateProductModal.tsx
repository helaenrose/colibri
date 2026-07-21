'use client'

import { createProduct } from "@/actions/create-product-action"
import { ProductSchema } from "@/src/schema"
import { useToastZodErrors } from "@/src/hooks/useToastZodErrors"
import { FormEvent, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "react-toastify"
import Modal from "@/components/ui/Modal"

// Boton que abre un modal para crear un producto de forma unitaria.
// Recibe el formulario (ProductForm, componente de servidor) como children.
const CreateProductModal = ({ children }: { children: React.ReactNode }) => {
    const router = useRouter()
    const { showIssues } = useToastZodErrors()
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        const formData = new FormData(event.currentTarget)
        const data = {
            name: formData.get('name'),
            price: formData.get('price'),
            stock: formData.get('stock'),
            categoryId: formData.get('categoryId'),
            image: formData.get('image'),
            supplier: formData.get('supplier'),
        }

        const result = ProductSchema.safeParse(data)
        if (!result.success) {
            showIssues(result.error.issues)
            return
        }

        startTransition(async () => {
            const response = await createProduct(result.data)
            if (response?.errors) {
                response.errors.forEach((error) => toast.error(error.message))
                return
            }
            toast.success('Producto creado')
            setOpen(false)
            router.refresh()
        })
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="w-full rounded-2xl bg-slate-900 px-6 py-3 text-center font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-slate-800 lg:w-auto"
            >
                Crear producto
            </button>

            <Modal
                open={open}
                onClose={() => setOpen(false)}
                title="Nuevo producto"
                description="Agrega un producto al catalogo de forma individual."
            >
                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                    {/* ProductForm es un componente de servidor que trae las categorias */}
                    {children}

                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full rounded-md bg-slate-900 p-3 font-semibold text-white transition-all hover:bg-slate-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isPending ? 'Guardando...' : 'Crear producto'}
                    </button>
                </form>
            </Modal>
        </>
    )
}

export default CreateProductModal
