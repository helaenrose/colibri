'use client'

import { createCategory } from "@/actions/create-category-action"
import { deleteCategory } from "@/actions/delete-category-action"
import { CategorySchema } from "@/src/schema"
import { useToastZodErrors } from "@/src/hooks/useToastZodErrors"
import { FormEvent, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "react-toastify"

type CategoryItem = {
    id: string
    name: string
    slug: string
    productCount: number
}

const CategoryManager = ({ categories }: { categories: CategoryItem[] }) => {

    const router = useRouter()
    const { showIssues } = useToastZodErrors()
    const [name, setName] = useState('')
    const [isPending, startTransition] = useTransition()
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        const data = { name }
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
            toast.success('Categoria creada')
            setName('')
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
            toast.success('Categoria eliminada')
            setDeletingId(null)
            router.refresh()
        })
    }

    return (
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <form
                onSubmit={handleSubmit}
                noValidate
                className="h-fit rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_16px_50px_rgba(15,23,42,0.06)] sm:p-6"
            >
                <h2 className="text-lg font-bold text-slate-900">Nueva categoria</h2>
                <p className="mt-1 text-sm text-slate-600">
                    Crea categorias para organizar tu catalogo. Luego podras asignarlas al crear o editar productos.
                </p>

                <div className="mt-4 space-y-2">
                    <label htmlFor="category-name" className="text-sm font-semibold text-slate-800">
                        Nombre de la categoria
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

                <button
                    type="submit"
                    disabled={isPending}
                    className="mt-5 w-full rounded-md bg-slate-900 p-3 font-semibold text-white transition-all hover:bg-slate-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isPending ? 'Guardando...' : 'Crear categoria'}
                </button>
            </form>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_16px_50px_rgba(15,23,42,0.06)] sm:p-6">
                <h2 className="text-lg font-bold text-slate-900">Categorias existentes</h2>
                {categories.length ? (
                    <ul className="mt-4 space-y-3">
                        {categories.map((category) => (
                            <li
                                key={category.id}
                                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                            >
                                <div>
                                    <p className="font-semibold text-slate-900">{category.name}</p>
                                    <p className="text-xs text-slate-500">
                                        /{category.slug} - {category.productCount}{' '}
                                        {category.productCount === 1 ? 'producto' : 'productos'}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleDelete(category.id)}
                                    disabled={isPending && deletingId === category.id}
                                    className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-700 transition-colors hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {isPending && deletingId === category.id ? 'Eliminando...' : 'Eliminar'}
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-slate-600">
                        Aun no hay categorias. Crea la primera con el formulario.
                    </p>
                )}
            </div>
        </div>
    )
}

export default CategoryManager
