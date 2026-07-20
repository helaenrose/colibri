'use server'

import { prisma } from '@/src/lib/prisma'
import { parseCsv, slugify } from '@/src/lib/category-utils'
import { isAdminAuthenticated } from '@/src/lib/admin-auth'
import { revalidatePath } from 'next/cache'

// Imagen placeholder para productos creados en carga masiva (sin imagen).
const PLACEHOLDER_IMAGE = '/icon_generic.png'

type ImportResult = {
    success?: boolean
    errors?: { message: string }[]
    summary?: {
        created: number
        rows: number
    }
}

const normalizeHeader = (value: string) => slugify(value).replace(/-/g, '')

const HEADER_MAP: Record<string, 'name' | 'price' | 'stock' | 'code'> = {
    nombre: 'name',
    producto: 'name',
    precio: 'price',
    stock: 'stock',
    inventario: 'stock',
    codigosubcategoria: 'code',
    codigo: 'code',
}

export const importProducts = async (csvText: string): Promise<ImportResult> => {
    if (!(await isAdminAuthenticated())) {
        return { errors: [{ message: 'No autorizado: inicia sesion como administrador.' }] }
    }

    if (!csvText || csvText.trim() === '') {
        return { errors: [{ message: 'El archivo CSV esta vacio.' }] }
    }

    const rows = parseCsv(csvText)
    if (rows.length < 2) {
        return { errors: [{ message: 'El CSV debe tener un encabezado y al menos una fila de datos.' }] }
    }

    // Mapear columnas por encabezado
    const header = rows[0].map((h) => normalizeHeader(h))
    const colIndex: Partial<Record<'name' | 'price' | 'stock' | 'code', number>> = {}
    header.forEach((h, idx) => {
        const key = HEADER_MAP[h]
        if (key && colIndex[key] === undefined) colIndex[key] = idx
    })

    const missing = (['name', 'price', 'stock', 'code'] as const).filter((k) => colIndex[k] === undefined)
    if (missing.length > 0) {
        return {
            errors: [
                {
                    message:
                        'Faltan columnas en el CSV. Se requieren: Nombre, Precio, Stock, codigo subcategoria.',
                },
            ],
        }
    }

    // Validar filas
    const errors: { message: string }[] = []
    const parsedRows: { name: string; price: number; stock: number; code: string }[] = []

    for (let i = 1; i < rows.length; i++) {
        const raw = rows[i]
        const name = (raw[colIndex.name!] ?? '').trim()
        const priceRaw = (raw[colIndex.price!] ?? '').trim().replace(',', '.')
        const stockRaw = (raw[colIndex.stock!] ?? '').trim()
        const code = (raw[colIndex.code!] ?? '').trim()

        if (!name) {
            errors.push({ message: `Fila ${i + 1}: el nombre del producto es obligatorio.` })
            continue
        }
        const price = Number(priceRaw)
        if (!Number.isFinite(price) || price <= 0) {
            errors.push({ message: `Fila ${i + 1}: precio no valido ("${priceRaw}").` })
            continue
        }
        const stock = Number(stockRaw)
        if (!Number.isInteger(stock) || stock < 0) {
            errors.push({ message: `Fila ${i + 1}: inventario no valido ("${stockRaw}"). Debe ser un entero >= 0.` })
            continue
        }
        if (!code) {
            errors.push({ message: `Fila ${i + 1}: el codigo de subcategoria es obligatorio.` })
            continue
        }

        parsedRows.push({ name, price, stock, code })
    }

    if (errors.length > 0) {
        return { errors }
    }

    // Resolver los codigos a subcategorias existentes
    const codes = [...new Set(parsedRows.map((r) => r.code.toUpperCase()))]
    const categories = await prisma.category.findMany({
        where: { code: { in: parsedRows.map((r) => r.code) } },
        select: { id: true, code: true, level: true, name: true },
    })
    const byCode = new Map(categories.filter((c) => c.code).map((c) => [c.code!.toUpperCase(), c]))

    // Verificar que todos los codigos existan
    const unknownCodes = codes.filter((c) => !byCode.has(c))
    if (unknownCodes.length > 0) {
        return {
            errors: unknownCodes.slice(0, 8).map((c) => ({
                message: `El codigo de subcategoria "${c}" no existe. Crea primero la subcategoria o importa las categorias.`,
            })),
        }
    }

    // Crear los productos
    let created = 0
    try {
        await prisma.$transaction(async (tx) => {
            for (const row of parsedRows) {
                const category = byCode.get(row.code.toUpperCase())!
                await tx.product.create({
                    data: {
                        name: row.name,
                        price: row.price,
                        stock: row.stock,
                        image: PLACEHOLDER_IMAGE,
                        categoryId: category.id,
                    },
                })
                created++
            }
        })
    } catch (error) {
        console.log('[v0] importProducts error:', error)
        return { errors: [{ message: 'No se pudieron importar los productos. Intenta de nuevo.' }] }
    }

    revalidatePath('/admin/products')
    revalidatePath('/')

    return {
        success: true,
        summary: { created, rows: parsedRows.length },
    }
}
