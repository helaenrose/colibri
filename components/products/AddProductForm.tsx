'use client'

import { createProduct } from "@/actions/create-product-action"
import { ProductSchema } from "@/src/schema"
import { useRouter } from "next/navigation"
import { toast } from "react-toastify"
import { useToastZodErrors } from "@/src/hooks/useToastZodErrors"
import { FormEvent } from "react"

const AddProductForm = ({ children }: { children: React.ReactNode }) => {

    const router = useRouter()
    const { showIssues } = useToastZodErrors()

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        const formData = new FormData(event.currentTarget)
        const data = {
            name: formData.get('name'),
            price: formData.get('price'),
            stock: formData.get('stock'),
            categoryId: formData.get('categoryId'),
            image: formData.get('image'),
            supplier: formData.get('supplier')
        }

        const result = ProductSchema.safeParse(data)
        if (!result.success) {
            showIssues(result.error.issues)
            return;
        }

        const response = await createProduct(result.data)
        if (response?.errors) {
            response.errors.forEach(error => {
                toast.error(error.message)
            })
            return;
        }
        toast.success('Producto creado')
        router.push('/admin/products')
    }
    return (
        <div className="bg-white mt-10 px-5 py-10 rounded-md shadow-md max-w-3xl mx-auto">
            <form
                onSubmit={handleSubmit}
                className="space-y-5"
                noValidate>

                {/* Permite renderizar componente de servidor o de cliente */}
                {children}

                <input type="submit" className="bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] transition-all text-white w-full mt-5 p-3 font-semibold cursor-pointer rounded-md"
                    value={'Crear producto'}
                />
            </form>
        </div>
    )
}

export default AddProductForm
