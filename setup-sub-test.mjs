import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const dept = await prisma.category.findFirst({ where: { name: { contains: 'Café' }, level: 'DEPARTMENT' } })
const cat = await prisma.category.findFirst({ where: { parentId: dept.id } })
const sub = await prisma.category.findFirst({ where: { parentId: cat.id } })
console.log('Dept:', dept.name, dept.slug)
console.log('Cat:', cat.name, cat.slug)
console.log('Sub:', sub.name, sub.slug)

const product = await prisma.product.findFirst()
console.log('Producto de prueba:', product.name, product.id, 'categoria original:', product.categoryId)

await prisma.product.update({
  where: { id: product.id },
  data: { categoryId: sub.id, active: true, stock: 10 },
})
console.log('OK - producto movido temporalmente a', sub.name)
console.log('PRODUCT_ID:', product.id, 'ORIGINAL_CATEGORY_ID:', product.categoryId)
await prisma.$disconnect()
