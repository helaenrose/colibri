import { prisma } from "@/src/lib/prisma"
import ImageUpload from "./ImageUpload"
import { Product } from "@prisma/client"
import { getDemoCategories } from "@/src/demo/demo-store"

type FlatCategory = {
    id: string
    name: string
    level: 'DEPARTMENT' | 'CATEGORY' | 'SUBCATEGORY'
    code: string | null
    parentId: string | null
}

const getCategories = async (): Promise<FlatCategory[]> => {
    try {
        const rows = await prisma.category.findMany()
        return rows.map((c) => ({
            id: c.id,
            name: c.name,
            level: c.level,
            code: c.code,
            parentId: c.parentId,
        }))
    } catch {
        return getDemoCategories().map((c) => ({
            id: c.id,
            name: c.name,
            level: c.level,
            code: c.code ?? null,
            parentId: c.parentId ?? null,
        }))
    }
}

// Ordena y aplana la jerarquia: Departamento -> Categoria -> Subcategoria
const buildOrderedOptions = (categories: FlatCategory[]) => {
    const childrenOf = (parentId: string | null) =>
        categories
            .filter((c) => c.parentId === parentId)
            .sort((a, b) => a.name.localeCompare(b.name))

    const options: { id: string; label: string }[] = []
    const walk = (parentId: string | null, depth: number) => {
        childrenOf(parentId).forEach((node) => {
            const indent = '\u00A0\u00A0'.repeat(depth)
            const codeSuffix = node.code ? ` (${node.code})` : ''
            options.push({ id: node.id, label: `${indent}${node.name}${codeSuffix}` })
            walk(node.id, depth + 1)
        })
    }
    walk(null, 0)
    return options
}


interface ProductFormProps {
    product?: Product
}

const ProductForm = async ({ product }: ProductFormProps) => {

    const categories = await getCategories()
    const options = buildOrderedOptions(categories)

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
                    {options.map((option) => (
                        <option key={option.id} value={option.id}>{option.label}</option>
                    ))}

                </select>
                <p className="text-xs text-slate-500">Puedes asignar el producto a un Departamento, Categoria o Subcategoria.</p>
            </div>

            <div className="space-y-2">
                <label
                    className="text-slate-800"
                    htmlFor="supplier"
                >Proveedor (opcional):</label>
                <input
                    id="supplier"
                    type="text"
                    name="supplier"
                    maxLength={120}
                    className="block w-full p-3 bg-slate-100 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="Nombre del proveedor"
                    defaultValue={product?.supplier ?? ''}
                />
                <p className="text-xs text-slate-500">Uso interno: te ayuda a saber a quien le compras este producto.</p>
            </div>

            <ImageUpload
                image={product?.image}
            />

        </>
    )
}

export default ProductForm
