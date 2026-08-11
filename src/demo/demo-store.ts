import { categories as seedCategories } from '@/prisma/data/categories'
import { products as seedProducts } from '@/prisma/data/products'

type DemoCategory = (typeof seedCategories)[number]

type DemoProduct = {
  id: string
  name: string
  price: number
  image: string
  stock: number
  active: boolean
  supplier: string | null
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

type DemoFinanceEntry = {
  id: string
  type: 'INCOME' | 'EXPENSE'
  amount: number
  description: string
  category: string | null
  date: Date
  orderId: string | null
  orderCustomerName: string | null
  deletedAt: Date | null
  createdAt: Date
}

type DemoState = {
  categories: typeof seedCategories
  products: DemoProduct[]
  pendingOrders: DemoOrder[]
  readyOrders: DemoOrder[]
  financeEntries: DemoFinanceEntry[]
}

const categoryById = new Map(seedCategories.map((category) => [category.id, category]))

const initialDemoProducts: DemoProduct[] = seedProducts.map((product, index) => ({
  id: `${product.categoryId}-${index}`,
  name: product.name,
  price: product.price,
  image: product.image,
  stock: product.stock ?? 0,
  active: true,
  supplier: null,
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
          id: 'sub-arroz-blanco-0',
          name: 'Arroz Blanco 1 kg',
          price: 1.5,
          image: 'arroz',
          categoryId: 'sub-arroz-blanco',
        },
      },
      {
        id: 'demo-order-product-2',
        quantity: 1,
        product: {
          id: 'sub-aceite-vegetal-2',
          name: 'Aceite Vegetal 1 L',
          price: 2.8,
          image: 'aceite',
          categoryId: 'sub-aceite-vegetal',
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
          id: 'sub-refresco-cola-4',
          name: 'Refresco de Cola 2 L',
          price: 2.2,
          image: 'refresco_cola',
          categoryId: 'sub-refresco-cola',
        },
      },
      {
        id: 'demo-order-ready-product-2',
        quantity: 1,
        product: {
          id: 'sub-jabon-6',
          name: 'Jabon de Barra',
          price: 0.75,
          image: 'jabon',
          categoryId: 'sub-jabon',
        },
      },
    ],
  },
]

const initialFinanceEntries: DemoFinanceEntry[] = [
  {
    id: 'demo-finance-income-1',
    type: 'INCOME',
    amount: initialReadyOrders[0].total,
    description: `Orden completada - ${initialReadyOrders[0].name}`,
    category: 'Ventas',
    date: initialReadyOrders[0].orderReadyAt ?? new Date(),
    orderId: initialReadyOrders[0].id,
    orderCustomerName: initialReadyOrders[0].name,
    deletedAt: null,
    createdAt: initialReadyOrders[0].orderReadyAt ?? new Date(),
  },
  {
    id: 'demo-finance-expense-1',
    type: 'EXPENSE',
    amount: 45,
    description: 'Compra de insumos de limpieza',
    category: 'Insumos',
    date: new Date('2026-05-20T09:00:00.000Z'),
    orderId: null,
    orderCustomerName: null,
    deletedAt: null,
    createdAt: new Date('2026-05-20T09:00:00.000Z'),
  },
]

const createInitialState = (): DemoState => ({
  categories: seedCategories,
  products: [...initialDemoProducts],
  pendingOrders: [...initialPendingOrders],
  readyOrders: [...initialReadyOrders],
  financeEntries: [...initialFinanceEntries],
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

export const getDemoDepartments = () =>
  state.categories.filter((category) => category.level === 'DEPARTMENT')

export const getDemoCategoryBySlug = (slug: string) =>
  state.categories.find((category) => category.slug === slug)

// Ids de un nodo + todos sus descendientes
const demoDescendantIds = (rootId: string): string[] => {
  const result: string[] = []
  const walk = (id: string) => {
    result.push(id)
    state.categories.filter((c) => c.parentId === id).forEach((c) => walk(c.id))
  }
  walk(rootId)
  return result
}

// Productos de una categoria y de todos sus descendientes (con stock disponible)
export const getDemoProductsByCategoryTree = (slug: string) => {
  const root = state.categories.find((c) => c.slug === slug)
  if (!root) return []
  const ids = new Set(demoDescendantIds(root.id))
  return state.products.filter((product) => ids.has(product.categoryId) && product.stock > 0)
}

export const getDemoPendingOrders = () => state.pendingOrders

export const getDemoReadyOrders = () =>
  state.readyOrders.map((order) => ({
    ...order,
    hasArchivedFinanceEntry: state.financeEntries.some(
      (entry) => entry.orderId === order.id && entry.deletedAt !== null,
    ),
  }))

export const createDemoProduct = (data: { name: string; price: number; stock: number; categoryId: string; image: string; supplier?: string | null }) => {
  const category = state.categories.find((item) => item.id === data.categoryId)
  if (!category) return null

  const product = {
    id: createId('demo-product'),
    ...data,
    supplier: data.supplier || null,
    active: true,
    category,
  }

  state.products = [product, ...state.products]
  return product
}

export const updateDemoProduct = (
  id: string,
  data: { name: string; price: number; stock: number; categoryId: string; image: string; supplier?: string | null },
) => {
  const category = state.categories.find((item) => item.id === data.categoryId)
  if (!category) return null

  const existing = state.products.find((product) => product.id === id)

  const updatedProduct = {
    id,
    ...data,
    supplier: data.supplier || null,
    active: existing?.active ?? true,
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

  const readyAt = new Date()
  const completedOrder = {
    ...order,
    status: true,
    orderReadyAt: readyAt,
  }

  state.pendingOrders = state.pendingOrders.filter((item) => item.id !== orderId)
  state.readyOrders = [completedOrder, ...state.readyOrders]

  // Se crea automaticamente el ingreso asociado a la orden completada
  state.financeEntries = [
    {
      id: createId('demo-finance-income'),
      type: 'INCOME',
      amount: completedOrder.total,
      description: `Orden completada - ${completedOrder.name}`,
      category: 'Ventas',
      date: readyAt,
      orderId: completedOrder.id,
      orderCustomerName: completedOrder.name,
      deletedAt: null,
      createdAt: readyAt,
    },
    ...state.financeEntries,
  ]

  return completedOrder
}

export const deleteDemoOrder = (orderId: string) => {
  const order =
    state.pendingOrders.find((item) => item.id === orderId) ??
    state.readyOrders.find((item) => item.id === orderId)
  if (!order) return null

  state.pendingOrders = state.pendingOrders.filter((item) => item.id !== orderId)
  state.readyOrders = state.readyOrders.filter((item) => item.id !== orderId)

  // El ingreso asociado permanece pero pierde la referencia a la orden eliminada
  state.financeEntries = state.financeEntries.map((entry) =>
    entry.orderId === orderId ? { ...entry, orderId: null } : entry,
  )

  return order
}

export const getDemoFinanceEntries = () => state.financeEntries

export const createDemoFinanceEntry = (data: {
  type: 'INCOME' | 'EXPENSE'
  amount: number
  description: string
  category?: string | null
  date: Date
}) => {
  const entry: DemoFinanceEntry = {
    id: createId('demo-finance'),
    type: data.type,
    amount: data.amount,
    description: data.description,
    category: data.category || null,
    date: data.date,
    orderId: null,
    orderCustomerName: null,
    deletedAt: null,
    createdAt: new Date(),
  }

  state.financeEntries = [entry, ...state.financeEntries]
  return entry
}

// Elimina el registro. Si esta asociado a una orden existente, se archiva (soft delete)
// para poder restaurarse desde la orden; en caso contrario se elimina definitivamente.
export const deleteDemoFinanceEntry = (id: string) => {
  const entry = state.financeEntries.find((item) => item.id === id)
  if (!entry) return null

  const orderStillExists =
    entry.orderId !== null &&
    (state.pendingOrders.some((order) => order.id === entry.orderId) ||
      state.readyOrders.some((order) => order.id === entry.orderId))

  if (orderStillExists) {
    state.financeEntries = state.financeEntries.map((item) =>
      item.id === id ? { ...item, deletedAt: new Date() } : item,
    )
    return { ...entry, archived: true }
  }

  state.financeEntries = state.financeEntries.filter((item) => item.id !== id)
  return { ...entry, archived: false }
}

export const restoreDemoFinanceEntry = (orderId: string) => {
  const entry = state.financeEntries.find((item) => item.orderId === orderId && item.deletedAt !== null)
  if (!entry) return null

  state.financeEntries = state.financeEntries.map((item) =>
    item.id === entry.id ? { ...item, deletedAt: null } : item,
  )
  return entry
}
