'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import type { CategoryNode } from '@/src/lib/category-utils'

interface Props {
    tree: CategoryNode[]
}

// Encuentra la cadena de slugs (ancestros) hasta el nodo activo, para auto-expandir
const findActivePath = (nodes: CategoryNode[], activeSlug: string, path: string[] = []): string[] | null => {
    for (const node of nodes) {
        const nextPath = [...path, node.slug]
        if (node.slug === activeSlug) return nextPath
        const childPath = findActivePath(node.children, activeSlug, nextPath)
        if (childPath) return childPath
    }
    return null
}

const DepartmentIcon = ({ slug, name }: { slug: string; name: string }) => {
    const [src, setSrc] = useState(`/icon_${slug}.png`)
    return (
        <span className="relative size-8 shrink-0 md:size-10">
            <Image fill src={src} alt="" aria-hidden onError={() => setSrc('/icon_generic.png')} className="object-contain" />
            <span className="sr-only">{name}</span>
        </span>
    )
}

const CategoryTreeNav = ({ tree }: Props) => {
    const params = useParams<{ category: string }>()
    const activeSlug = params?.category ?? ''

    const activePath = useMemo(() => findActivePath(tree, activeSlug) ?? [], [tree, activeSlug])
    const [openSlugs, setOpenSlugs] = useState<Set<string>>(new Set(activePath))

    const toggle = (slug: string) => {
        setOpenSlugs((prev) => {
            const next = new Set(prev)
            if (next.has(slug)) next.delete(slug)
            else next.add(slug)
            return next
        })
    }

    return (
        <div className="px-2 py-2 md:px-0 md:py-0">
            {tree.map((department) => {
                const isOpen = openSlugs.has(department.slug) || activePath.includes(department.slug)
                const isActive = activeSlug === department.slug
                return (
                    <div key={department.id} className="border-t border-gray-200 first:border-t-0">
                        <div className="flex items-center gap-1">
                            <Link
                                href={`/order/${department.slug}`}
                                aria-current={isActive ? 'page' : undefined}
                                className={`flex flex-1 items-center gap-3 px-3 py-3 text-sm font-bold uppercase tracking-[0.06em] text-slate-800 transition-colors hover:bg-amber-50 ${isActive ? 'bg-amber-100' : ''}`}
                            >
                                <DepartmentIcon slug={department.slug} name={department.name} />
                                <span className="text-left">{department.name}</span>
                            </Link>
                            {department.children.length > 0 ? (
                                <button
                                    type="button"
                                    onClick={() => toggle(department.slug)}
                                    aria-expanded={isOpen}
                                    aria-label={`${isOpen ? 'Contraer' : 'Expandir'} ${department.name}`}
                                    className="mr-2 grid size-8 shrink-0 place-items-center rounded-md text-slate-500 transition-colors hover:bg-slate-100"
                                >
                                    <svg
                                        className={`size-4 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                        aria-hidden
                                    >
                                        <path fillRule="evenodd" d="M7.05 4.55a.75.75 0 0 1 1.06 0l4.6 4.6a.75.75 0 0 1 0 1.06l-4.6 4.6a.75.75 0 1 1-1.06-1.06L11.19 10 7.05 5.86a.75.75 0 0 1 0-1.31z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            ) : null}
                        </div>

                        {isOpen && department.children.length > 0 ? (
                            <div className="bg-slate-50/70 pb-1">
                                {department.children.map((cat) => {
                                    const catOpen = openSlugs.has(cat.slug) || activePath.includes(cat.slug)
                                    const catActive = activeSlug === cat.slug
                                    return (
                                        <div key={cat.id}>
                                            <div className="flex items-center gap-1">
                                                <Link
                                                    href={`/order/${cat.slug}`}
                                                    aria-current={catActive ? 'page' : undefined}
                                                    className={`flex-1 py-2 pl-6 pr-2 text-sm font-semibold text-slate-700 transition-colors hover:text-amber-700 ${catActive ? 'text-amber-700' : ''}`}
                                                >
                                                    {cat.name}
                                                </Link>
                                                {cat.children.length > 0 ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => toggle(cat.slug)}
                                                        aria-expanded={catOpen}
                                                        aria-label={`${catOpen ? 'Contraer' : 'Expandir'} ${cat.name}`}
                                                        className="mr-2 grid size-7 shrink-0 place-items-center rounded-md text-slate-400 transition-colors hover:bg-slate-200"
                                                    >
                                                        <svg
                                                            className={`size-3.5 transition-transform ${catOpen ? 'rotate-90' : ''}`}
                                                            viewBox="0 0 20 20"
                                                            fill="currentColor"
                                                            aria-hidden
                                                        >
                                                            <path fillRule="evenodd" d="M7.05 4.55a.75.75 0 0 1 1.06 0l4.6 4.6a.75.75 0 0 1 0 1.06l-4.6 4.6a.75.75 0 1 1-1.06-1.06L11.19 10 7.05 5.86a.75.75 0 0 1 0-1.31z" clipRule="evenodd" />
                                                        </svg>
                                                    </button>
                                                ) : null}
                                            </div>

                                            {catOpen && cat.children.length > 0 ? (
                                                <div className="pb-1">
                                                    {cat.children.map((sub) => {
                                                        const subActive = activeSlug === sub.slug
                                                        return (
                                                            <Link
                                                                key={sub.id}
                                                                href={`/order/${sub.slug}`}
                                                                aria-current={subActive ? 'page' : undefined}
                                                                className={`flex items-center justify-between gap-2 py-1.5 pl-10 pr-3 text-sm text-slate-600 transition-colors hover:text-amber-700 ${subActive ? 'font-semibold text-amber-700' : ''}`}
                                                            >
                                                                <span>{sub.name}</span>
                                                                {sub.code ? (
                                                                    <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">{sub.code}</span>
                                                                ) : null}
                                                            </Link>
                                                        )
                                                    })}
                                                </div>
                                            ) : null}
                                        </div>
                                    )
                                })}
                            </div>
                        ) : null}
                    </div>
                )
            })}
        </div>
    )
}

export default CategoryTreeNav
