'use client'
import { updateProduct } from "@/actions/update-product-actions"
import { ProductSchema } from "@/src/schema"
import { useParams, useRouter } from "next/navigation"
import { toast } from "react-toastify"
import { useToastZodErrors } from "@/src/hooks/useToastZodErrors"

const EditProductForm = ({ children }: { children: React.ReactNode }) => {

    const router = useRouter()
    const { showIssues } = useToastZodErrors()
    const params = useParams()
    const id = Array.isArray(params.id) ? params.id[0] : params.id!;
    const handleSubmit = async (formData: FormData) => {
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

        const response = await updateProduct(result.data, id)
        if (response?.errors) {
            response.errors.forEach(error => {
                toast.error(error.message)
            })
            return;
        }
        toast.success('Producto actualizado correctamente')
        router.push('/admin/products')
    }
    return (
        <div className="bg-white mt-10 px-5 py-10 rounded-md shadow-md max-w-3xl mx-auto">
            <form
                action={handleSubmit}
                className="space-y-5"
                noValidate>

                {/* Permite renderizar componente de servidor o de cliente */}
                {children}

                <input type="submit" className="bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] transition-all text-white w-full mt-5 p-3 font-semibold cursor-pointer rounded-md"
                    value={'Guardar cambios'}
                />
            </form>
        </div>
    )
}

export default EditProductForm;
