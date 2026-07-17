'use client'

import { importCategories } from '@/actions/import-categories-action'
import { parseCsv } from '@/src/lib/category-utils'
import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'

const TEMPLATE =
    'Departamento,Categoría,Subcategoría,código subcategoría\n' +
    'Abarrotes secos,Arroz,Arroz blanco,CAT-0001\n' +
    'Abarrotes secos,Arroz,Arroz integral,CAT-0002\n' +
    'Abarrotes secos,Arroz,Arroz precocido,CAT-0003\n'

type PreviewRow = { department: string; category: string; subcategory: string; code: string }

const CategoryCsvImport = () => {
    const router = useRouter()
    const inputRef = useRef<HTMLInputElement>(null)
    const [fileName, setFileName] = useState('')
    const [csvText, setCsvText] = useState('')
    const [preview, setPreview] = useState<PreviewRow[]>([])
    const [isPending, startTransition] = useTransition()

    const handleFile = async (file: File) => {
        const text = await file.text()
        setCsvText(text)
        setFileName(file.name)

        const rows = parseCsv(text)
        if (rows.length < 2) {
            setPreview([])
            toast.error('El CSV debe tener encabezado y al menos una fila.')
            return
        }
        // Vista previa (primeras 5 filas de datos), asumiendo el orden de columnas del ejemplo
        const dataRows = rows.slice(1, 6).map((r) => ({
            department: (r[0] ?? '').trim(),
            category: (r[1] ?? '').trim(),
            subcategory: (r[2] ?? '').trim(),
            code: (r[3] ?? '').trim(),
        }))
        setPreview(dataRows)
    }

    const onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) handleFile(file)
    }

    const handleImport = () => {
        if (!csvText) {
            toast.error('Selecciona un archivo CSV primero.')
            return
        }
        startTransition(async () => {
            const response = await importCategories(csvText)
            if (response?.errors) {
                response.errors.slice(0, 6).forEach((error) => toast.error(error.message))
                return
            }
            const s = response.summary
            toast.success(
                `Importado: ${s?.departments ?? 0} departamentos, ${s?.categories ?? 0} categorias, ${s?.subcategories ?? 0} subcategorias.`,
            )
            setFileName('')
            setCsvText('')
            setPreview([])
            if (inputRef.current) inputRef.current.value = ''
            router.refresh()
        })
    }

    const downloadTemplate = () => {
        const blob = new Blob([TEMPLATE], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'plantilla-categorias.csv'
        link.click()
        URL.revokeObjectURL(url)
    }

    return (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_16px_50px_rgba(15,23,42,0.06)] sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h2 className="text-lg font-bold text-slate-900">Importar desde CSV</h2>
                    <p className="mt-1 max-w-2xl text-sm text-slate-600">
                        Sube un archivo con las columnas <span className="font-semibold">Departamento, Categoria, Subcategoria, codigo subcategoria</span>.
                        Se crea lo que no existe y se actualiza lo existente (no se duplica).
                    </p>
                </div>
                <button
                    type="button"
                    onClick={downloadTemplate}
                    className="shrink-0 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                    Descargar plantilla
                </button>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                    ref={inputRef}
                    type="file"
                    accept=".csv,text/csv"
                    onChange={onInputChange}
                    aria-label="Archivo CSV de categorias"
                    className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-md file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-800"
                />
                <button
                    type="button"
                    onClick={handleImport}
                    disabled={isPending || !csvText}
                    className="shrink-0 rounded-md bg-amber-500 px-5 py-2.5 text-sm font-bold text-slate-900 transition-all hover:bg-amber-400 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isPending ? 'Importando...' : 'Importar CSV'}
                </button>
            </div>

            {fileName ? (
                <p className="mt-2 text-xs text-slate-500">Archivo: {fileName}</p>
            ) : null}

            {preview.length > 0 ? (
                <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-3 py-2 text-left font-semibold text-slate-600">Departamento</th>
                                <th className="px-3 py-2 text-left font-semibold text-slate-600">Categoria</th>
                                <th className="px-3 py-2 text-left font-semibold text-slate-600">Subcategoria</th>
                                <th className="px-3 py-2 text-left font-semibold text-slate-600">Codigo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {preview.map((row, index) => (
                                <tr key={index}>
                                    <td className="px-3 py-2 text-slate-700">{row.department}</td>
                                    <td className="px-3 py-2 text-slate-700">{row.category}</td>
                                    <td className="px-3 py-2 text-slate-700">{row.subcategory}</td>
                                    <td className="px-3 py-2 font-mono text-slate-700">{row.code}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <p className="bg-slate-50 px-3 py-2 text-xs text-slate-500">Vista previa (primeras filas)</p>
                </div>
            ) : null}
        </section>
    )
}

export default CategoryCsvImport
