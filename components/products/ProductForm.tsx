import { prisma } from "@/src/lib/prisma"
import ImageUpload from "./ImageUpload"
import { Product } from "@prisma/client"
import { getDemoCategories } from "@/src/demo/demo-store"

const getCategories = async () => {
    try {
        return await prisma.category.findMany()
    } catch {
        return getDemoCategories()
    }
}


interface ProductFormProps {
    product?: Product
}

const ProductForm = async ({ product }: ProductFormProps) => {

    const categories = await getCategories()

    return (
        <>
            <div className="space-y-2">
                <label
                    className="text-slate-800"
                    htmlFor="name"
                >Nombre:</label>
                <input
                    id="name"
                    type="text"
                    name="name"
                    required
                    minLength={2}
                    className="block w-full p-3 bg-slate-100 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="Nombre Producto"
                    defaultValue={product?.name}
                />
            </div>

            <div className="space-y-2">
                <label
                    className="text-slate-800"
                    htmlFor="price"
                >Precio:</label>
                <input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0.01"
                    name="price"
                    required
                    className="block w-full p-3 bg-slate-100 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="Precio Producto"
                    defaultValue={product?.price}
                />
            </div>

            <div className="space-y-2">
                <label
                    className="text-slate-800"
                    htmlFor="stock"
                >Inventario (unidades disponibles):</label>
                <input
                    id="stock"
                    type="number"
                    step="1"
                    min="0"
                    name="stock"
                    required
                    className="block w-full p-3 bg-slate-100 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="Cantidad en inventario"
                    defaultValue={product?.stock ?? 0}
                />
                <p className="text-xs text-slate-500">El inventario se descuenta automaticamente cuando apruebas la orden.</p>
            </div>

            <div className="space-y-2">
                <label
                    className="text-slate-800"
                    htmlFor="categoryId"
                >Categoría:</label>
                <select
                    className="block w-full p-3 bg-slate-100 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    id="categoryId"
                    name="categoryId"
                    required
                    defaultValue={product?.categoryId}
                >
                    <option value="">-- Seleccione --</option>
                    {categories.map((category) => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                    ))}

                </select>
            </div>
            <ImageUpload
                image={product?.image}
            />

        </>
    )
}

export default ProductForm
