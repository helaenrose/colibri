import Link from 'next/link'

interface Props {
  page: number
  totalPages: number
  params?: Record<string, string | undefined>
}

const ProductPagination = ({ page, totalPages, params = {} }: Props) => {

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  // Conserva los filtros activos en los enlaces de paginacion
  const buildHref = (targetPage: number) => {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value) query.set(key, value)
    })
    query.set('page', String(targetPage))
    return `/admin/products?${query.toString()}`
  }

  if (totalPages <= 1) return null

  return (
    <nav className='flex justify-center py-10'>

      {page > 1 && (
        <Link href={buildHref(page - 1)}
          className='bg-white px-4 py-2 text-sm text-gray-900 ring-1 ring-inset ring-gray-300 focus:z-20 focus:outline-offset-0'
        >
          &laquo;
        </Link>
      )}
      {pages.map((p) => (
        <Link
          className={`bg-white px-4 py-2 text-sm text-gray-900 ring-1 ring-inset ring-gray-300 focus:z-20 focus:outline-offset-0 ${p === page ? 'bg-gray-200 font-bold shadow text-black' : ''}`}
          key={p}
          href={buildHref(p)}
        >
          {p}
        </Link>
      ))
      }
      {page < totalPages && (
        <Link
          className='bg-white px-4 py-2 text-sm text-gray-900 ring-1 ring-inset ring-gray-300 focus:z-20 focus:outline-offset-0'
          href={buildHref(page + 1)}>
          &raquo;
        </Link>
      )}
    </nav>
  )
}

export default ProductPagination
