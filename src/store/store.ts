import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { OrderItem } from '../types'
import { Product } from '@prisma/client'

export type DeliveryType = 'PICKUP' | 'DELIVERY'

export interface CustomerInfo {
    name: string
    phone: string
    email: string
    deliveryType: DeliveryType
    address: string
    receiptUrl: string
    receiptId: string
}

const emptyCustomer: CustomerInfo = {
    name: '',
    phone: '',
    email: '',
    deliveryType: 'PICKUP',
    address: '',
    receiptUrl: '',
    receiptId: '',
}

interface Store {
    order: OrderItem[]
    customer: CustomerInfo
    addToCart: (product: Product) => void
    increaseQuantity: (id: Product['id']) => void
    decreaseQuantity: (id: Product['id']) => void
    removeItemFromCart: (id: Product['id']) => void
    setCustomer: (partial: Partial<CustomerInfo>) => void
    cleanOrder: () => void
}

export const useStore = create<Store>()(
    persist(
        (set, get) => ({
            order: [],
            customer: emptyCustomer,
            addToCart: (product) => {

                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { categoryId, image, ...data } = product

                let order: OrderItem[]

                if (get().order.find(item => item.id === product.id)) {

                    order = get().order.map(item => item.id === product.id ? {
                        ...item,
                        quantity: item.quantity + 1,
                        subTotal: item.price * (item.quantity + 1)
                    } : item)
                } else {

                    order = [...get().order, {
                        ...data,
                        quantity: 1,
                        subTotal: 1 * product.price,
                    }]

                }

                set(() => ({
                    order
                }))
            },

            increaseQuantity: (id) => {
                set((state) => ({
                    order: state.order.map(item => item.id === id ? {
                        ...item,
                        quantity: item.quantity + 1,
                        subTotal: item.price * (item.quantity + 1)
                    } : item)
                }))
            },
            decreaseQuantity: (id) => {

                const order = get().order.map(item => item.id === id ? {
                    ...item,
                    quantity: item.quantity - 1,
                    subTotal: item.price * (item.quantity - 1)
                } : item)

                set(() => ({
                    order
                }))
            },
            removeItemFromCart: (id) => {
                set(() => ({
                    order: get().order.filter(item => item.id !== id)
                }))
            },
            setCustomer: (partial) => {
                set((state) => ({
                    customer: { ...state.customer, ...partial }
                }))
            },
            cleanOrder: () => {
                set(() => ({
                    order: [],
                    customer: emptyCustomer,
                }))
            }
        }),
        {
            name: 'colibri-carrito',
            storage: createJSONStorage(() => localStorage),
            // Solo persistimos datos, no las funciones.
            partialize: (state) => ({ order: state.order, customer: state.customer }),
        }
    )
)
