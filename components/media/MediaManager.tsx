"use client"

import { useMemo, useRef, useState, useTransition } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { toast } from "react-toastify"
import {
    renameMediaAsset,
    deleteMediaAssets,
    addProductAssociation,
    removeProductAssociation,
    addCategoryAssociation,
    removeCategoryAssociation,
} from "@/actions/media-actions"
import type { MediaAssetWithRelations } from "@/src/lib/media"
import type { MediaProductOption, MediaCategoryOption } from "@/app/admin/(protected)/media/page"

interface Props {
    assets: MediaAssetWithRelations[]
    products: MediaProductOption[]
    categories: MediaCategoryOption[]
}

const levelLabel: Record<string, string> = {
    DEPARTMENT: "Departamento",
    CATEGORY: "Categoria",
    SUBCATEGORY: "Subcategoria",
}

const isUnoptimized = (url: string) => url.startsWith("http") && !url.includes("res.cloudinary.com")

const MediaManager = ({ assets, products, categories }: Props) => {
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [uploading, setUploading] = useState(false)
    const [selected, setSelected] = useState<Set<string>>(new Set())
    const [detailId, setDetailId] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    const detail = useMemo(() => assets.find((a) => a.id === detailId) ?? null, [assets, detailId])

    const toggle = (id: string) => {
        setSelected((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const handleUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return
        setUploading(true)
        let ok = 0
        let fail = 0
        for (const file of Array.from(files)) {
            try {
                const formData = new FormData()
                formData.append("file", file)
                const res = await fetch("/admin/media/api/upload", { method: "POST", body: formData })
                if (res.ok) ok += 1
                else fail += 1
            } catch {
                fail += 1
            }
        }
        setUploading(false)
        if (fileInputRef.current) fileInputRef.current.value = ""
        if (ok > 0) toast.success(`${ok} ${ok === 1 ? "imagen subida" : "imagenes subidas"}`)
        if (fail > 0) toast.error(`${fail} ${fail === 1 ? "imagen fallo" : "imagenes fallaron"}`)
        router.refresh()
    }

    const handleDeleteSelected = () => {
        if (selected.size === 0) return
        if (!confirm(`Eliminar ${selected.size} ${selected.size === 1 ? "imagen" : "imagenes"}? Se quitaran sus asociaciones.`)) return
        const ids = Array.from(selected)
        startTransition(async () => {
            const result = await deleteMediaAssets(ids)
            if (result.success) {
                const n = result.deleted ?? ids.length
                toast.success(`${n} ${n === 1 ? "imagen eliminada" : "imagenes eliminadas"}`)
                setSelected(new Set())
                if (detailId && ids.includes(detailId)) setDetailId(null)
                router.refresh()
            } else {
                toast.error(result.message ?? "No se pudieron eliminar")
            }
        })
    }

    const handleRename = (id: string, current: string) => {
        const name = prompt("Nuevo nombre para la imagen:", current)
        if (name === null) return
        const trimmed = name.trim()
        if (trimmed.length === 0) {
            toast.error("El nombre no puede estar vacio")
            return
        }
        startTransition(async () => {
            const result = await renameMediaAsset(id, trimmed)
            if (result.success) {
                toast.success("Nombre actualizado")
                router.refresh()
            } else {
                toast.error(result.message ?? "No se pudo renombrar")
            }
        })
    }

    const runAssoc = (fn: () => Promise<{ success: boolean; message?: string }>, okMsg: string) => {
        startTransition(async () => {
            const result = await fn()
            if (result.success) {
                toast.success(okMsg)
                router.refresh()
            } else {
                toast.error(result.message ?? "Ocurrio un error")
            }
        })
    }

    const associatedProductIds = new Set(detail?.products.map((p) => p.product.id) ?? [])
    const associatedCategoryIds = new Set(detail?.categories.map((c) => c.category.id) ?? [])
    const availableProducts = products.filter((p) => !associatedProductIds.has(p.id))
    const availableCategories = categories.filter((c) => !associatedCategoryIds.has(c.id))

    return (
        <div className="space-y-4">
            {/* Barra de acciones */}
            <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                    >
                        {uploading ? "Subiendo..." : "Subir imagenes"}
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        hidden
                        onChange={(e) => handleUpload(e.target.files)}
                    />
                    {selected.size > 0 ? (
                        <span className="text-sm text-slate-600">
                            {selected.size} {selected.size === 1 ? "seleccionada" : "seleccionadas"}
                        </span>
                    ) : null}
                </div>

                {selected.size > 0 ? (
                    <button
                        type="button"
                        onClick={handleDeleteSelected}
                        disabled={isPending}
                        className="inline-flex items-center justify-center rounded-full border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                    >
                        Eliminar seleccionadas
                    </button>
                ) : null}
            </div>

            {assets.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
                    <p className="text-sm text-slate-500">Aun no has subido imagenes. Sube tu primera imagen para empezar.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {assets.map((asset) => {
                        const isSelected = selected.has(asset.id)
                        const usageCount = asset.products.length + asset.categories.length
                        return (
                            <div
                                key={asset.id}
                                className={`group relative overflow-hidden rounded-2xl border bg-white shadow-sm transition ${isSelected ? "border-amber-500 ring-2 ring-amber-300" : "border-slate-200"}`}
                            >
                                <label className="absolute left-2 top-2 z-10 flex size-6 cursor-pointer items-center justify-center rounded-md bg-white/90 shadow">
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => toggle(asset.id)}
                                        className="size-4 cursor-pointer accent-amber-500"
                                        aria-label={`Seleccionar ${asset.name}`}
                                    />
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setDetailId(asset.id)}
                                    className="block w-full text-left"
                                >
                                    <span className="relative block aspect-square w-full bg-slate-100">
                                        <Image
                                            src={asset.url}
                                            alt={asset.name}
                                            fill
                                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                            unoptimized={isUnoptimized(asset.url)}
                                            className="object-cover"
                                        />
                                    </span>
                                    <span className="block p-3">
                                        <span className="block truncate text-sm font-semibold text-slate-900">{asset.name}</span>
                                        <span className="mt-1 block text-xs text-slate-500">
                                            {usageCount === 0 ? "Sin asociaciones" : `${usageCount} ${usageCount === 1 ? "uso" : "usos"}`}
                                        </span>
                                    </span>
                                </button>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Panel de detalle */}
            {detail ? (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true">
                    <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-6">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <span className="relative size-16 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                                    <Image
                                        src={detail.url}
                                        alt={detail.name}
                                        fill
                                        sizes="64px"
                                        unoptimized={isUnoptimized(detail.url)}
                                        className="object-cover"
                                    />
                                </span>
                                <div className="min-w-0">
                                    <p className="truncate font-semibold text-slate-900">{detail.name}</p>
                                    <button
                                        type="button"
                                        onClick={() => handleRename(detail.id, detail.name)}
                                        className="mt-1 text-sm font-semibold text-amber-700 hover:underline"
                                    >
                                        Renombrar
                                    </button>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setDetailId(null)}
                                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                aria-label="Cerrar"
                            >
                                <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                                </svg>
                            </button>
                        </div>

                        {/* Productos asociados */}
                        <div className="mt-6">
                            <p className="text-sm font-semibold text-slate-800">Productos asociados</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {detail.products.length === 0 ? (
                                    <span className="text-sm text-slate-500">Ninguno</span>
                                ) : (
                                    detail.products.map((p) => (
                                        <span key={p.product.id} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 py-1 pl-3 pr-1 text-xs font-semibold text-slate-700">
                                            {p.product.name}
                                            <button
                                                type="button"
                                                onClick={() => runAssoc(() => removeProductAssociation(detail.id, p.product.id), "Asociacion eliminada")}
                                                disabled={isPending}
                                                className="flex size-5 items-center justify-center rounded-full text-slate-500 transition hover:bg-red-100 hover:text-red-600"
                                                aria-label={`Quitar ${p.product.name}`}
                                            >
                                                <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                    <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                                                </svg>
                                            </button>
                                        </span>
                                    ))
                                )}
                            </div>
                            {availableProducts.length > 0 ? (
                                <select
                                    value=""
                                    disabled={isPending}
                                    onChange={(e) => {
                                        if (e.target.value) runAssoc(() => addProductAssociation(detail.id, e.target.value), "Producto asociado")
                                    }}
                                    className="mt-3 w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                                    aria-label="Asociar a un producto"
                                >
                                    <option value="">+ Asociar a un producto...</option>
                                    {availableProducts.map((p) => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            ) : null}
                        </div>

                        {/* Categorias asociadas */}
                        <div className="mt-6">
                            <p className="text-sm font-semibold text-slate-800">Categorias asociadas</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {detail.categories.length === 0 ? (
                                    <span className="text-sm text-slate-500">Ninguna</span>
                                ) : (
                                    detail.categories.map((c) => (
                                        <span key={c.category.id} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 py-1 pl-3 pr-1 text-xs font-semibold text-slate-700">
                                            {c.category.name}
                                            <span className="text-[10px] font-normal uppercase tracking-wide text-slate-400">{levelLabel[c.category.level]}</span>
                                            <button
                                                type="button"
                                                onClick={() => runAssoc(() => removeCategoryAssociation(detail.id, c.category.id), "Asociacion eliminada")}
                                                disabled={isPending}
                                                className="flex size-5 items-center justify-center rounded-full text-slate-500 transition hover:bg-red-100 hover:text-red-600"
                                                aria-label={`Quitar ${c.category.name}`}
                                            >
                                                <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                    <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                                                </svg>
                                            </button>
                                        </span>
                                    ))
                                )}
                            </div>
                            {availableCategories.length > 0 ? (
                                <select
                                    value=""
                                    disabled={isPending}
                                    onChange={(e) => {
                                        if (e.target.value) runAssoc(() => addCategoryAssociation(detail.id, e.target.value), "Categoria asociada")
                                    }}
                                    className="mt-3 w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                                    aria-label="Asociar a una categoria"
                                >
                                    <option value="">+ Asociar a una categoria...</option>
                                    {availableCategories.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name} ({levelLabel[c.level]})</option>
                                    ))}
                                </select>
                            ) : null}
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    )
}

export default MediaManager
