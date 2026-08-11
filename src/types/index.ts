import { Order, OrderProducts, Product } from "@prisma/client";


export type OrderItem = Pick<Product, 'id' | 'name' | 'price'> & {
    quantity: number
    subTotal: number
}

export type OrderWithProducts = Order & {
    orderProducts: (OrderProducts & {
        product: Product
    })[]
    // true cuando el ingreso financiero de esta orden fue archivado (eliminado desde Finanzas)
    // y puede restaurarse. undefined/false en el resto de los casos.
    hasArchivedFinanceEntry?: boolean
}
