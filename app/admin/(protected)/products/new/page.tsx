import AddProductForm from '@/components/products/AddProductForm'
import ProductForm from '@/components/products/ProductForm'
import Heading from '@/components/ui/Heading'
import React from 'react'

const CreateProductPage = () => {
    return (
        <div>
            <Heading>Nuevo producto</Heading>

            <AddProductForm>
                <ProductForm />
            </AddProductForm>
        </div>
    )
}

export default CreateProductPage