import ProductSearch from '@/components/products/ProductSearch';
import ProductTable from '@/components/products/ProductTable';
import Heading from '@/components/ui/Heading'
import { prisma } from '@/src/lib/prisma'
import EmptyState from '@/components/ui/EmptyState'
import { getDemoProductsBySearch } from '@/src/demo/demo-store'

const searchProducts = async (searchTerm: string) => {
    try {
        return await prisma.product.findMany({
            where: {
                name: {
                    contains: searchTerm,
                    mode: "insensitive"
                }
            },
            include: {
                category: true
            }
        })
    } catch {
        return getDemoProductsBySearch(searchTerm)
    }
}

const SearchPage = async ({ searchParams }: { searchParams: Promise<{ search: string }> }) => {
    const { search } = await searchParams
    const products = await searchProducts(search)
    return (
        <div>
            <Heading>Resultados de búsqueda: {search}</Heading>
            <div className="flex flex-col lg:flex-row lg:justify-end gap-5">
                <ProductSearch />
            </div>
            {products.length ? (
                <ProductTable products={products} />
            ) : <EmptyState message="No hay resultados" />}
        </div>
    )
}

export default SearchPage