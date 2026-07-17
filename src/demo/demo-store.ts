import { categories as seedCategories } from '@/prisma/data/categories'
import { products as seedProducts } from '@/prisma/data/products'

type DemoCategory = (typeof seedCategories)[number]

type DemoProduct = {
  id: string
  name: string
  price: number
  image: string
  stock: number
  categoryId: string
  category: DemoCategory
}

type DemoOrderProduct = {
  id: string
  quantity: number
  product: {
    id: string
    name: string
    price: number
    image: string
    categoryId: string
  }
}

type DemoOrder = {
  id: string
  name: string
  phone: string
  email: string | null
  address: string | null
  deliveryType: 'PICKUP' | 'DELIVERY'
  receiptUrl: string
  receiptId: string
  total: number
  date: Date
  status: boolean
  orderReadyAt: Date | null
  orderProducts: DemoOrderProduct[]
}

const DEMO_RECEIPT = 'https://res.cloudinary.com/demo/image/upload/sample.jpg'

type DemoState = {
  categories: typeof seedCategories
  products: DemoProduct[]
  pendingOrders: DemoOrder[]
  readyOrders: DemoOrder[]
}

const categoryById = new Map(seedCategories.map((category) => [category.id, category]))

const initialDemoProducts: DemoProduct[] = seedProducts.map((product, index) => ({
  id: `${product.categoryId}-${index}`,
  name: product.name,
  price: product.price,
  image: product.image,
  stock: product.stock ?? 0,
  categoryId: product.categoryId,
  category: categoryById.get(product.categoryId)!,
}))

const initialPendingOrders: DemoOrder[] = [
  {
    id: 'demo-order-pending-1',
    name: 'Cliente Demo',
    phone: '+52 55 1234 5678',
    email: 'cliente@demo.com',
    address: 'Av. Siempre Viva 742',
    deliveryType: 'DELIVERY',
    receiptUrl: DEMO_RECEIPT,
    receiptId: 'demo/comprobantes/sample',
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

const initialReadyOrders: DemoOrder[] = [
  {
    id: 'demo-order-ready-1',
    name: 'Laura Gomez',
    phone: '+52 55 8899 0011',
    email: null,
    address: null,
    deliveryType: 'PICKUP',
    receiptUrl: DEMO_RECEIPT,
    receiptId: 'demo/comprobantes/sample',
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

const createInitialState = (): DemoState => ({
  categories: seedCategories,
  products: [...initialDemoProducts],
  pendingOrders: [...initialPendingOrders],
  readyOrders: [...initialReadyOrders],
})

declare global {
  var __FASTFOOD_DEMO_STATE__: DemoState | undefined
}

const state = globalThis.__FASTFOOD_DEMO_STATE__ ?? createInitialState()
globalThis.__FASTFOOD_DEMO_STATE__ = state

const createId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`

export const getDemoCategories = () => state.categories

export const getDemoProducts = () => state.products

export const getDemoProductsBySearch = (searchTerm: string) =>
  state.products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

export const getDemoProductById = (id: string) => state.products.find((product) => product.id === id)

export const getDemoProductsByCategory = (slug: string) =>
  state.products.filter((product) => product.category.slug === slug)

export const getDemoPendingOrders = () => state.pendingOrders

export const getDemoReadyOrders = () => state.readyOrders

export const createDemoProduct = (data: { name: string; price: number; stock: number; categoryId: string; image: string }) => {
  const category = state.categories.find((item) => item.id === data.categoryId)
  if (!category) return null

  const product = {
    id: createId('demo-product'),
    ...data,
    category,
  }

  state.products = [product, ...state.products]
  return product
}

export const updateDemoProduct = (
  id: string,
  data: { name: string; price: number; stock: number; categoryId: string; image: string },
) => {
  const category = state.categories.find((item) => item.id === data.categoryId)
  if (!category) return null

  const updatedProduct = {
    id,
    ...data,
    category,
  }

  state.products = state.products.map((product) => (product.id === id ? updatedProduct : product))
  return updatedProduct
}

export const createDemoOrder = (data: {
  name: string
  phone: string
  email?: string
  address?: string
  deliveryType: 'PICKUP' | 'DELIVERY'
  receiptUrl: string
  receiptId: string
  total: number
  order: { id: string; name: string; price: number; quantity: number; subTotal: number }[]
}) => {
  const order = {
    id: createId('demo-order'),
    name: data.name,
    phone: data.phone,
    email: data.email || null,
    address: data.deliveryType === 'DELIVERY' ? (data.address || null) : null,
    deliveryType: data.deliveryType,
    receiptUrl: data.receiptUrl,
    receiptId: data.receiptId,
    total: data.total,
    date: new Date(),
    status: false,
    orderReadyAt: null,
    orderProducts: data.order.map((item) => ({
      id: createId('demo-order-product'),
      quantity: item.quantity,
      product: {
        id: item.id,
        name: item.name,
        price: item.price,
        image: 'arroz',
        categoryId: state.categories[0]?.id ?? '',
      },
    })),
  }

  state.pendingOrders = [order, ...state.pendingOrders]
  return order
}

export const completeDemoOrder = (orderId: string) => {
  const order = state.pendingOrders.find((item) => item.id === orderId)
  if (!order) return null

  // El inventario se descuenta unicamente al aprobar la orden
  order.orderProducts.forEach((item) => {
    state.products = state.products.map((product) =>
      product.id === item.product.id
        ? { ...product, stock: Math.max(0, product.stock - item.quantity) }
        : product,
    )
  })

  const completedOrder = {
    ...order,
    status: true,
    orderReadyAt: new Date(),
  }

  state.pendingOrders = state.pendingOrders.filter((item) => item.id !== orderId)
  state.readyOrders = [completedOrder, ...state.readyOrders]
  return completedOrder
}

export const deleteDemoOrder = (orderId: string) => {
  const order =
    state.pendingOrders.find((item) => item.id === orderId) ??
    state.readyOrders.find((item) => item.id === orderId)
  if (!order) return null

  state.pendingOrders = state.pendingOrders.filter((item) => item.id !== orderId)
  state.readyOrders = state.readyOrders.filter((item) => item.id !== orderId)
  return order
}
