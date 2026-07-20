'use client'

import { importProducts } from '@/actions/import-products-action'
import { parseCsv } from '@/src/lib/category-utils'
import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'

const TEMPLATE =
    'Nombre,Precio,Stock,código subcategoría\n' +
    'Arroz Superior 1kg,1.25,50,CAT-0001\n' +
    'Arroz Integral 1kg,1.60,30,CAT-0002\n' +
    'Fideo Tallarin 400g,0.90,80,CAT-0003\n'

type PreviewRow = { name: string; price: string; stock: string; code: string }

const ProductCsvImport = () => {
    const router = useRouter()
    const inputRef = useRef<HTMLInputElement>(null)
    const [open, setOpen] = useState(false)
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
        const dataRows = rows.slice(1, 6).map((r) => ({
            name: (r[0] ?? '').trim(),
            price: (r[1] ?? '').trim(),
            stock: (r[2] ?? '').trim(),
            code: (r[3] ?? '').trim(),
        }))
        setPreview(dataRows)
    }

    const onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) handleFile(file)
    }

    const resetForm = () => {
        setFileName('')
        setCsvText('')
        setPreview([])
        if (inputRef.current) inputRef.current.value = ''
    }

    const handleImport = () => {
        if (!csvText) {
            toast.error('Selecciona un archivo CSV primero.')
            return
        }
        startTransition(async () => {
            const response = await importProducts(csvText)
            if (response?.errors) {
                response.errors.slice(0, 6).forEach((error) => toast.error(error.message))
                return
            }
            const s = response.summary
            toast.success(`Se importaron ${s?.created ?? 0} productos.`)
            resetForm()
            router.refresh()
        })
    }

    const downloadTemplate = () => {
        const blob = new Blob([TEMPLATE], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'plantilla-productos.csv'
        link.click()
        URL.revokeObjectURL(url)
    }

    return (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_16px_50px_rgba(15,23,42,0.06)] sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h2 className="text-lg font-bold text-slate-900">Carga masiva de productos</h2>
                    <p className="mt-1 max-w-2xl text-sm text-slate-600">
                        Sube un CSV con las columnas{' '}
                        <span className="font-semibold">Nombre, Precio, Stock, codigo subcategoria</span>. Los
                        productos se crean con una imagen generica que puedes cambiar luego desde la galeria.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setOpen((v) => !v)}
                    className="shrink-0 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                    aria-expanded={open}
                >
                    {open ? 'Ocultar' : 'Abrir carga masiva'}
                </button>
            </div>

            {open ? (
                <div className="mt-4 border-t border-slate-100 pt-4">
                    <button
                        type="button"
                        onClick={downloadTemplate}
                        className="mb-3 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                    >
                        Descargar plantilla
                    </button>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <input
                            ref={inputRef}
                            type="file"
                            accept=".csv,text/csv"
                            onChange={onInputChange}
                            aria-label="Archivo CSV de productos"
                            className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-md file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-800"
                        />
                        <button
                            type="button"
                            onClick={handleImport}
                            disabled={isPending || !csvText}
                            className="shrink-0 rounded-md bg-amber-500 px-5 py-2.5 text-sm font-bold text-slate-900 transition-all hover:bg-amber-400 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isPending ? 'Importando...' : 'Importar productos'}
                        </button>
                    </div>

                    {fileName ? <p className="mt-2 text-xs text-slate-500">Archivo: {fileName}</p> : null}

                    {preview.length > 0 ? (
                        <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200">
                            <table className="min-w-full divide-y divide-slate-200 text-sm">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-semibold text-slate-600">Nombre</th>
                                        <th className="px-3 py-2 text-left font-semibold text-slate-600">Precio</th>
                                        <th className="px-3 py-2 text-left font-semibold text-slate-600">Stock</th>
                                        <th className="px-3 py-2 text-left font-semibold text-slate-600">Codigo</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {preview.map((row, index) => (
                                        <tr key={index}>
                                            <td className="px-3 py-2 text-slate-700">{row.name}</td>
                                            <td className="px-3 py-2 text-slate-700">{row.price}</td>
                                            <td className="px-3 py-2 text-slate-700">{row.stock}</td>
                                            <td className="px-3 py-2 font-mono text-slate-700">{row.code}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <p className="bg-slate-50 px-3 py-2 text-xs text-slate-500">Vista previa (primeras filas)</p>
                        </div>
                    ) : null}
                </div>
            ) : null}
        </section>
    )
}

export default ProductCsvImport
