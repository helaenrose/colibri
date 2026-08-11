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
    <nav className='flex w-full flex-wrap items-center justify-center gap-1.5 px-4 py-10'>

      {page > 1 && (
        <Link href={buildHref(page - 1)}
          className='rounded-md bg-white px-3 py-1.5 text-sm text-gray-900 ring-1 ring-inset ring-gray-300 focus:z-20 focus:outline-offset-0 sm:px-4 sm:py-2'
        >
          &laquo;
        </Link>
      )}
      {pages.map((p) => (
        <Link
          className={`rounded-md bg-white px-3 py-1.5 text-sm text-gray-900 ring-1 ring-inset ring-gray-300 focus:z-20 focus:outline-offset-0 sm:px-4 sm:py-2 ${p === page ? 'bg-gray-200 font-bold shadow text-black' : ''}`}
          key={p}
          href={buildHref(p)}
        >
          {p}
        </Link>
      ))
      }
      {page < totalPages && (
        <Link
          className='rounded-md bg-white px-3 py-1.5 text-sm text-gray-900 ring-1 ring-inset ring-gray-300 focus:z-20 focus:outline-offset-0 sm:px-4 sm:py-2'
          href={buildHref(page + 1)}>
          &raquo;
        </Link>
      )}
    </nav>
  )
}

export default ProductPagination
