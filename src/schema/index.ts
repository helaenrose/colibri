import { z } from "zod"


export const OrderSchema = z.object({
    name: z.string().min(3, "Tu nombre es obligatorio"),
    total: z.number().min(1, "No hay productos en tu pedido"),
    order: z.array(z.object({
        id: z.string(),
        name: z.string(),
        price: z.number(),
        quantity: z.number(),
        subTotal: z.number()
    }))
})


export const OrderIdSchema = z.object({
    orderId: z.string().trim().min(1, { message: 'El id de la orden es obligatorio' })
})

export const SearchSchema = z.object({
    search: z.string().trim().min(3, "Escribe al menos 3 caracteres para buscar")
})

export const ProductSchema = z.object({
    name: z.string()
        .trim()
        .min(1, { message: 'El nombre del producto no puede ir vacio' }),
    price: z.coerce.number()
        .positive({ message: 'Precio no válido' }),
    categoryId: z.string()
        .trim()
        .min(1, { message: 'La categoría es obligatoria' }),
    image: z.string().min(1, "La imagen es obligatoria")
})

export const CategorySchema = z.object({
    name: z.string()
        .trim()
        .min(2, { message: 'El nombre de la categoria debe tener al menos 2 caracteres' })
})

export const BusinessProfileSchema = z.object({
    name: z.string()
        .trim()
        .min(2, { message: 'El nombre del negocio es obligatorio' }),
    phone: z.string().trim().optional().or(z.literal('')),
    email: z.string().trim().email({ message: 'Correo no valido' }).optional().or(z.literal('')),
    address: z.string().trim().optional().or(z.literal('')),
    image: z.string().trim().optional().or(z.literal(''))
})
