import Heading from '@/components/ui/Heading'
import Link from 'next/link'
import React from 'react'

const NotFound = () => {
    return (
        <div className='text-center'>
            <Heading>El producto no fue encontrado</Heading>
            <Link
                className='bg-black hover:bg-black/80 p-4 rounded shadow text-white'
                href="/admin/products">Volver a la lista de productos</Link>
        </div>
    )
}

export default NotFound