'use client'

import { createCategory } from "@/actions/create-category-action"
import { deleteCategory } from "@/actions/delete-category-action"
import { CategorySchema } from "@/src/schema"
import { useToastZodErrors } from "@/src/hooks/useToastZodErrors"
import { FormEvent, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "react-toastify"
import Image from "next/image"
import ProfileImageUpload from "@/components/profile/ProfileImageUpload"
import Modal from "@/components/ui/Modal"
import type { AdminCategoryItem } from "@/app/admin/(protected)/categories/page"

type Level = 'DEPARTMENT' | 'CATEGORY' | 'SUBCATEGORY'

const levelLabels: Record<Level, string> = {
    DEPARTMENT: 'Departamento',
    CATEGORY: 'Categoria',
    SUBCATEGORY: 'Subcategoria',
}

const levelBadge: Record<Level, string> = {
    DEPARTMENT: 'bg-slate-900 text-white',
    CATEGORY: 'bg-amber-100 text-amber-800',
    SUBCATEGORY: 'bg-emerald-100 text-emerald-700',
}

const CategoryManager = ({ categories }: { categories: AdminCategoryItem[] }) => {

    const router = useRouter()
    const { showIssues } = useToastZodErrors()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [name, setName] = useState('')
    const [level, setLevel] = useState<Level>('DEPARTMENT')
    const [parentId, setParentId] = useState('')
    const [code, setCode] = useState('')
    const [image, setImage] = useState('')
    // Cambia para forzar el remount del componente de imagen y limpiarlo tras crear
    const [uploadKey, setUploadKey] = useState(0)
    const [isPending, startTransition] = useTransition()
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const departments = useMemo(() => categories.filter((c) => c.level === 'DEPARTMENT'), [categories])
    const categoryNodes = useMemo(() => categories.filter((c) => c.level === 'CATEGORY'), [categories])

    // Opciones de padre segun el nivel elegido
    const parentOptions = useMemo(() => {
        if (level === 'CATEGORY') return departments
        if (level === 'SUBCATEGORY') return categoryNodes
        return []
    }, [level, departments, categoryNodes])

    // Construir arbol para el listado
    const tree = useMemo(() => {
        const byParent = new Map<string | null, AdminCategoryItem[]>()
        categories.forEach((c) => {
            const list = byParent.get(c.parentId) ?? []
            list.push(c)
            byParent.set(c.parentId, list)
        })
        byParent.forEach((list) => list.sort((a, b) => a.name.localeCompare(b.name)))
        return byParent
    }, [categories])

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        const data = {
            name,
            level,
            parentId: level === 'DEPARTMENT' ? '' : parentId,
            code: level === 'SUBCATEGORY' ? code : '',
            image,
        }
        const result = CategorySchema.safeParse(data)
        if (!result.success) {
            showIssues(result.error.issues)
            return
        }

        startTransition(async () => {
            const response = await createCategory(result.data)
            if (response?.errors) {
                response.errors.forEach((error) => toast.error(error.message))
                return
            }
            toast.success(`${levelLabels[level]} creada`)
            setName('')
            setCode('')
            setImage('')
            setUploadKey((k) => k + 1)
            setIsModalOpen(false)
            router.refresh()
        })
    }

    const handleDelete = (id: string) => {
        setDeletingId(id)
        startTransition(async () => {
            const response = await deleteCategory(id)
            if (response?.errors) {
                response.errors.forEach((error) => toast.error(error.message))
                setDeletingId(null)
                return
            }
            toast.success('Elemento eliminado')
            setDeletingId(null)
            router.refresh()
        })
    }

    const renderNode = (node: AdminCategoryItem, depth: number) => {
        const children = tree.get(node.id) ?? []
        return (
            <li key={node.id} className="space-y-2">
                <div
                    className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                    style={{ marginLeft: depth * 16 }}
                >
                    <div className="flex min-w-0 items-center gap-3">
                        {node.image ? (
                            <span className="relative size-10 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
                                <Image
                                    src={node.image}
                                    alt={node.name}
                                    fill
                                    sizes="40px"
                                    unoptimized={node.image.startsWith('http') && !node.image.includes('res.cloudinary.com')}
                                    className="object-cover"
                                />
                            </span>
                        ) : null}
                        <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${levelBadge[node.level]}`}>
                                {levelLabels[node.level]}
                            </span>
                            <p className="truncate font-semibold text-slate-900">{node.name}</p>
                            {node.code ? (
                                <span className="rounded-md bg-white px-2 py-0.5 font-mono text-xs text-slate-600 ring-1 ring-slate-200">
                                    {node.code}
                                </span>
                            ) : null}
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500">
                            {node.productCount} {node.productCount === 1 ? 'producto' : 'productos'}
                        </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => handleDelete(node.id)}
                        disabled={isPending && deletingId === node.id}
                        className="shrink-0 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-700 transition-colors hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isPending && deletingId === node.id ? 'Eliminando...' : 'Eliminar'}
                    </button>
                </div>
                {children.length > 0 ? (
                    <ul className="space-y-2">{children.map((child) => renderNode(child, depth + 1))}</ul>
                ) : null}
            </li>
        )
    }

    const roots = tree.get(null) ?? []

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-600">
                    Crea un Departamento, Categoria o Subcategoria, o revisa la jerarquia actual.
                </p>
                <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-6 py-3 font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-slate-800 sm:w-auto"
                >
                    Crear categoria
                </button>
            </div>

            <Modal
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Nuevo elemento"
                description="Agrega un Departamento, Categoria o Subcategoria manualmente."
            >
                <form onSubmit={handleSubmit} noValidate>
                <div className="mt-1 space-y-2">
                    <label htmlFor="category-level" className="text-sm font-semibold text-slate-800">
                        Nivel
                    </label>
                    <select
                        id="category-level"
                        value={level}
                        onChange={(event) => {
                            setLevel(event.target.value as Level)
                            setParentId('')
                        }}
                        className="block w-full rounded-md border border-slate-200 bg-slate-100 p-3 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    >
                        <option value="DEPARTMENT">Departamento</option>
                        <option value="CATEGORY">Categoria</option>
                        <option value="SUBCATEGORY">Subcategoria</option>
                    </select>
                </div>

                {level !== 'DEPARTMENT' ? (
                    <div className="mt-4 space-y-2">
                        <label htmlFor="category-parent" className="text-sm font-semibold text-slate-800">
                            {level === 'CATEGORY' ? 'Departamento padre' : 'Categoria padre'}
                        </label>
                        <select
                            id="category-parent"
                            value={parentId}
                            onChange={(event) => setParentId(event.target.value)}
                            className="block w-full rounded-md border border-slate-200 bg-slate-100 p-3 focus:outline-none focus:ring-2 focus:ring-amber-400"
                        >
                            <option value="">Selecciona...</option>
                            {parentOptions.map((option) => (
                                <option key={option.id} value={option.id}>
                                    {option.name}
                                </option>
                            ))}
                        </select>
                    </div>
                ) : null}

                <div className="mt-4 space-y-2">
                    <label htmlFor="category-name" className="text-sm font-semibold text-slate-800">
                        Nombre
                    </label>
                    <input
                        id="category-name"
                        type="text"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="Ej. Lacteos"
                        className="block w-full rounded-md border border-slate-200 bg-slate-100 p-3 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                </div>

                {level === 'SUBCATEGORY' ? (
                    <div className="mt-4 space-y-2">
                        <label htmlFor="category-code" className="text-sm font-semibold text-slate-800">
                            Codigo de subcategoria
                        </label>
                        <input
                            id="category-code"
                            type="text"
                            value={code}
                            onChange={(event) => setCode(event.target.value)}
                            placeholder="Ej. CAT-0001"
                            className="block w-full rounded-md border border-slate-200 bg-slate-100 p-3 font-mono focus:outline-none focus:ring-2 focus:ring-amber-400"
                        />
                    </div>
                ) : null}

                <div className="mt-4">
                    <ProfileImageUpload
                        key={uploadKey}
                        label={`Foto de ${levelLabels[level].toLowerCase()} (opcional)`}
                        onChange={setImage}
                    />
                </div>

                <button
                    type="submit"
                    disabled={isPending}
                    className="mt-5 w-full rounded-md bg-slate-900 p-3 font-semibold text-white transition-all hover:bg-slate-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isPending ? 'Guardando...' : `Crear ${levelLabels[level].toLowerCase()}`}
                </button>
                </form>
            </Modal>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_16px_50px_rgba(15,23,42,0.06)] sm:p-6">
                <h2 className="text-lg font-bold text-slate-900">Jerarquia actual</h2>
                {roots.length ? (
                    <ul className="mt-4 space-y-2">{roots.map((node) => renderNode(node, 0))}</ul>
                ) : (
                    <p className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-slate-600">
                        Aun no hay categorias. Crea la primera o importa un CSV.
                    </p>
                )}
            </div>
        </div>
    )
}

export default CategoryManager
