'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState } from 'react'


interface Props {
    category: {
        id: string
        name: string
        slug: string
        image?: string | null
    }
}

const isRenderableSrc = (value: string) => value.startsWith('/') || value.startsWith('http')

const CategoryIcon = ({ category }: Props) => {

    const urlParams = useParams<{ category: string }>()
    const isActive = urlParams.category === category.slug
    // Prioriza la imagen subida por el admin; si no hay, usa el icono por slug y luego el generico
    const [iconSrc, setIconSrc] = useState(
        category.image && isRenderableSrc(category.image) ? category.image : `/icon_${category.slug}.png`
    )

    return (
        <div className={`shrink-0 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-200 hover:bg-amber-50 md:w-full md:rounded-none md:border-0 md:border-t md:border-gray-200 md:p-2 md:shadow-none md:hover:translate-y-0 md:hover:border-gray-200 ${isActive ? 'ring-2 ring-amber-300 md:bg-amber-200 md:ring-0 md:shadow' : ''}`}>
            <div className='flex min-w-[7rem] flex-col items-center gap-2 md:min-w-0 md:flex-row md:gap-3'>
                <div className='relative size-10 sm:size-11 md:size-14'>
                <Image
                    fill
                    src={iconSrc}
                    alt={category.name}
                    sizes="56px"
                    className="object-contain"
                    onError={() => setIconSrc('/icon_generic.png')}
                />
                </div>
                <Link
                    href={`/order/${category.slug}`}
                    aria-current={isActive ? 'page' : undefined}
                    className='w-full rounded-sm py-1 text-center text-xs font-bold uppercase tracking-[0.08em] text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400 md:py-2 md:text-left md:text-sm md:tracking-normal'>
                    {category.name}
                </Link>
            </div>
        </div>
    )
}

export default CategoryIcon
