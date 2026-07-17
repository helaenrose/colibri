'use server'

import { prisma } from '@/src/lib/prisma'
import { CategoryImportRowSchema } from '@/src/schema'
import { parseCsv, slugify } from '@/src/lib/categories'
import { isAdminAuthenticated } from '@/src/lib/admin-auth'
import { revalidatePath } from 'next/cache'

type ImportResult = {
    success?: boolean
    errors?: { message: string }[]
    summary?: {
        departments: number
        categories: number
        subcategories: number
        rows: number
    }
}

// Encabezados esperados (flexibles a acentos/mayusculas)
const normalizeHeader = (value: string) =>
    slugify(value).replace(/-/g, '')

const HEADER_MAP: Record<string, 'department' | 'category' | 'subcategory' | 'code'> = {
    departamento: 'department',
    categoria: 'category',
    subcategoria: 'subcategory',
    codigosubcategoria: 'code',
    codigo: 'code',
}

export const importCategories = async (csvText: string): Promise<ImportResult> => {
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
    const colIndex: Partial<Record<'department' | 'category' | 'subcategory' | 'code', number>> = {}
    header.forEach((h, idx) => {
        const key = HEADER_MAP[h]
        if (key && colIndex[key] === undefined) colIndex[key] = idx
    })

    const missing = (['department', 'category', 'subcategory', 'code'] as const).filter(
        (k) => colIndex[k] === undefined,
    )
    if (missing.length > 0) {
        return {
            errors: [
                {
                    message:
                        'Faltan columnas en el CSV. Se requieren: Departamento, Categoria, Subcategoria, codigo subcategoria.',
                },
            ],
        }
    }

    // Validar filas
    const errors: { message: string }[] = []
    const parsedRows: { department: string; category: string; subcategory: string; code: string }[] = []
    const codesInFile = new Map<string, number>()

    for (let i = 1; i < rows.length; i++) {
        const raw = rows[i]
        const candidate = {
            department: (raw[colIndex.department!] ?? '').trim(),
            category: (raw[colIndex.category!] ?? '').trim(),
            subcategory: (raw[colIndex.subcategory!] ?? '').trim(),
            code: (raw[colIndex.code!] ?? '').trim(),
        }

        const result = CategoryImportRowSchema.safeParse(candidate)
        if (!result.success) {
            errors.push({ message: `Fila ${i + 1}: ${result.error.issues[0].message}` })
            continue
        }

        // Codigos duplicados dentro del propio archivo
        const codeUpper = result.data.code.toUpperCase()
        if (codesInFile.has(codeUpper)) {
            errors.push({
                message: `Fila ${i + 1}: el codigo "${result.data.code}" esta repetido (tambien en la fila ${codesInFile.get(codeUpper)}).`,
            })
        } else {
            codesInFile.set(codeUpper, i + 1)
        }

        parsedRows.push(result.data)
    }

    if (errors.length > 0) {
        return { errors }
    }

    // Validar que ningun codigo del archivo pertenezca a una subcategoria distinta ya existente
    const existingWithCodes = await prisma.category.findMany({
        where: { code: { in: parsedRows.map((r) => r.code) } },
        select: { code: true, name: true, slug: true },
    })
    const existingByCode = new Map(existingWithCodes.map((c) => [c.code!.toUpperCase(), c]))

    for (const row of parsedRows) {
        const existing = existingByCode.get(row.code.toUpperCase())
        // El slug de una subcategoria es "departamento-categoria-subcategoria".
        // Si el codigo ya existe en OTRA subcategoria (slug distinto) es un conflicto real.
        const rowSubSlug = slugify(`${row.department}-${row.category}-${row.subcategory}`)
        if (existing && existing.slug !== rowSubSlug) {
            errors.push({
                message: `El codigo "${row.code}" ya pertenece a la subcategoria "${existing.name}". No se puede reasignar.`,
            })
        }
    }
    if (errors.length > 0) {
        return { errors }
    }

    // Upsert jerarquico
    const departmentsSeen = new Set<string>()
    const categoriesSeen = new Set<string>()
    const subcategoriesSeen = new Set<string>()

    try {
        await prisma.$transaction(async (tx) => {
            for (const row of parsedRows) {
                // Departamento
                const depSlug = slugify(row.department)
                const department = await tx.category.upsert({
                    where: { slug: depSlug },
                    update: { name: row.department, level: 'DEPARTMENT', parentId: null },
                    create: { name: row.department, slug: depSlug, level: 'DEPARTMENT' },
                })
                departmentsSeen.add(department.id)

                // Categoria (hija del departamento)
                const catSlug = slugify(`${row.department}-${row.category}`)
                const category = await tx.category.upsert({
                    where: { slug: catSlug },
                    update: { name: row.category, level: 'CATEGORY', parentId: department.id },
                    create: { name: row.category, slug: catSlug, level: 'CATEGORY', parentId: department.id },
                })
                categoriesSeen.add(category.id)

                // Subcategoria (hija de la categoria, con codigo unico)
                const subSlug = slugify(`${row.department}-${row.category}-${row.subcategory}`)
                const subcategory = await tx.category.upsert({
                    where: { slug: subSlug },
                    update: {
                        name: row.subcategory,
                        level: 'SUBCATEGORY',
                        parentId: category.id,
                        code: row.code,
                    },
                    create: {
                        name: row.subcategory,
                        slug: subSlug,
                        level: 'SUBCATEGORY',
                        parentId: category.id,
                        code: row.code,
                    },
                })
                subcategoriesSeen.add(subcategory.id)
            }
        })
    } catch (error) {
        console.log('[v0] importCategories error:', error)
        return { errors: [{ message: 'No se pudo importar el CSV. Revisa que los codigos no esten duplicados.' }] }
    }

    revalidatePath('/admin/categories')
    revalidatePath('/admin/products')
    revalidatePath('/')

    return {
        success: true,
        summary: {
            departments: departmentsSeen.size,
            categories: categoriesSeen.size,
            subcategories: subcategoriesSeen.size,
            rows: parsedRows.length,
        },
    }
}
