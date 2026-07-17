import { categories as seedCategories } from '@/prisma/data/categories'
import { products as seedProducts } from '@/prisma/data/products'

const categoryById = Object.fromEntries(
  seedCategories.map((category) => [category.id, category]),
)

const productByCategoryId = Object.fromEntries(
  seedProducts.map((product, index) => [
    `${product.categoryId}-${index}`,
    {
      id: `${product.categoryId}-${index}`,
      name: product.name,
      price: product.price,
      image: product.image,
      categoryId: product.categoryId,
      category: categoryById[product.categoryId],
    },
  ]),
)

export const demoCategories = seedCategories

export const demoProducts = Object.values(productByCategoryId)

export const demoPendingOrders = [
  {
    id: 'demo-order-pending-1',
    name: 'Cliente Demo',
    total: 5.9,
    date: new Date('2026-05-20T12:00:00.000Z'),
    status: false,
    orderReadyAt: null,
    orderProducts: [
      {
        id: 'demo-order-product-1',
        quantity: 2,
        product: {
          id: 'cat-abarrotes-0',
          name: 'Arroz Blanco 1 kg',
          price: 1.5,
          image: 'arroz',
          categoryId: 'cat-abarrotes',
        },
      },
      {
        id: 'demo-order-product-2',
        quantity: 1,
        product: {
          id: 'cat-abarrotes-1',
          name: 'Aceite Vegetal 1 L',
          price: 2.8,
          image: 'aceite',
          categoryId: 'cat-abarrotes',
        },
      },
    ],
  },
]

export const demoReadyOrders = [
  {
    id: 'demo-order-ready-1',
    name: 'Laura Gomez',
    total: 4.3,
    date: new Date('2026-05-20T11:15:00.000Z'),
    status: true,
    orderReadyAt: new Date('2026-05-20T11:28:00.000Z'),
    orderProducts: [
      {
        id: 'demo-order-ready-product-1',
        quantity: 1,
        product: {
          id: 'cat-bebidas-3',
          name: 'Refresco de Cola 2 L',
          price: 2.2,
          image: 'refresco_cola',
          categoryId: 'cat-bebidas',
        },
      },
      {
        id: 'demo-order-ready-product-2',
        quantity: 1,
        product: {
          id: 'cat-limpieza-5',
          name: 'Jabon de Barra',
          price: 0.75,
          image: 'jabon',
          categoryId: 'cat-limpieza',
        },
      },
    ],
  },
]
