import { prisma } from '@/src/lib/prisma'
import { notFound } from 'next/navigation'
import Heading from '@/components/ui/Heading'
import EditProductForm from '@/components/products/EditProductForm'
import ProductForm from '@/components/products/ProductForm'
import GoBackButton from '@/components/ui/GoBackButton'
import { getDemoProductById } from '@/src/demo/demo-store'

const getProductById = async (id: string) => {
    try {
        return await prisma.product.findUnique({
            where: {
                id
            }
        })
    } catch {
        return getDemoProductById(id) ?? null
    }
}

const EditProduct = async ({ params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params
    const product = await getProductById(id)
    if (!product) {
        notFound()
    }

    return (
        <div>
            <Heading>Editar producto: {product.name}</Heading>

            <GoBackButton href="/admin/products" />

            <EditProductForm>
                <ProductForm product={product} />
            </EditProductForm>

        </div>
    )
}

export default EditProduct
