import { prisma } from '@/src/lib/prisma'
import type { Category } from '@prisma/client'
import { buildCategoryTree, type CategoryNode } from '@/src/lib/category-utils'

export * from '@/src/lib/category-utils'

export const getCategoryTree = async (): Promise<CategoryNode[]> => {
    const categories = await prisma.category.findMany()
    return buildCategoryTree(categories)
}

export const getDepartments = async (): Promise<Category[]> => {
    return prisma.category.findMany({
        where: { level: 'DEPARTMENT' },
        orderBy: { name: 'asc' },
    })
}
