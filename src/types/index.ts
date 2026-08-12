import { Order, OrderProducts, Product } from "@prisma/client";


export type OrderItem = Pick<Product, 'id' | 'name' | 'price'> & {
    quantity: number
    subTotal: number
}

export type OrderWithProducts = Order & {
    orderProducts: (OrderProducts & {
        product: Product
    })[]
    // true cuando esta orden completada no tiene un ingreso activo en Finanzas: ya sea porque
    // fue archivado (eliminado desde Finanzas) o porque nunca se creo (ordenes completadas
    // antes de existir este modulo). Permite ofrecer la opcion de recuperarlo/generarlo.
    missingFinanceEntry?: boolean
}
