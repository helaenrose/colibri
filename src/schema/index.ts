import { z } from "zod"


export const OrderSchema = z.object({
    name: z.string().trim().min(3, "Tu nombre es obligatorio"),
    phone: z.string().trim().min(6, "Tu celular es obligatorio"),
    email: z.string().trim().email({ message: "Correo no valido" }).optional().or(z.literal('')),
    deliveryType: z.enum(["PICKUP", "DELIVERY"], { message: "Selecciona un tipo de entrega" }),
    address: z.string().trim().optional().or(z.literal('')),
    receiptUrl: z.string().trim().url({ message: "El comprobante de pago es obligatorio" }),
    receiptId: z.string().trim().min(1, { message: "El comprobante de pago es obligatorio" }),
    total: z.number().min(1, "No hay productos en tu pedido"),
    order: z.array(z.object({
        id: z.string(),
        name: z.string(),
        price: z.number(),
        quantity: z.number(),
        subTotal: z.number()
    }))
}).superRefine((data, ctx) => {
    if (data.deliveryType === "DELIVERY" && (!data.address || data.address.trim().length < 5)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["address"],
            message: "La direccion es obligatoria para envio a domicilio"
        })
    }
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
    stock: z.coerce.number()
        .int({ message: 'El inventario debe ser un numero entero' })
        .min(0, { message: 'El inventario no puede ser negativo' }),
    categoryId: z.string()
        .trim()
        .min(1, { message: 'La categoría es obligatoria' }),
    image: z.string().min(1, "La imagen es obligatoria"),
    supplier: z.string().trim().max(120, { message: 'El proveedor es demasiado largo (max 120 caracteres)' }).optional().or(z.literal('')),
})

export const CategoryLevelEnum = z.enum(['DEPARTMENT', 'CATEGORY', 'SUBCATEGORY'])

export const CategorySchema = z.object({
    name: z.string()
        .trim()
        .min(2, { message: 'El nombre debe tener al menos 2 caracteres' }),
    level: CategoryLevelEnum,
    parentId: z.string().trim().optional().or(z.literal('')),
    code: z.string().trim().optional().or(z.literal('')),
    image: z.string().trim().optional().or(z.literal('')),
}).superRefine((data, ctx) => {
    // Departamento no tiene padre; categoria y subcategoria si
    if (data.level !== 'DEPARTMENT' && (!data.parentId || data.parentId.trim() === '')) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['parentId'],
            message: 'Debes seleccionar la categoria padre',
        })
    }
    // El codigo es obligatorio unicamente en subcategorias
    if (data.level === 'SUBCATEGORY' && (!data.code || data.code.trim() === '')) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['code'],
            message: 'El codigo de subcategoria es obligatorio',
        })
    }
})

export const CategoryImportRowSchema = z.object({
    department: z.string().trim().min(1, { message: 'El departamento es obligatorio' }),
    category: z.string().trim().min(1, { message: 'La categoria es obligatoria' }),
    subcategory: z.string().trim().min(1, { message: 'La subcategoria es obligatoria' }),
    code: z.string().trim().min(1, { message: 'El codigo de subcategoria es obligatorio' }),
})

export const BankAccountSchema = z.object({
    bankName: z.string().trim().min(2, { message: 'El nombre del banco es obligatorio' }),
    ownerName: z.string().trim().min(2, { message: 'El nombre del titular es obligatorio' }),
    idNumber: z.string().trim().min(3, { message: 'La cedula es obligatoria' }),
    accountType: z.string().trim().min(2, { message: 'El tipo de cuenta es obligatorio' }),
    email: z.string().trim().email({ message: 'Correo no valido' }).optional().or(z.literal(''))
})

export const BankAccountIdSchema = z.object({
    id: z.string().trim().min(1, { message: 'El id de la cuenta es obligatorio' })
})

export const BusinessProfileSchema = z.object({
    name: z.string()
        .trim()
        .min(2, { message: 'El nombre del negocio es obligatorio' }),
    tagline: z.string().trim().max(280, { message: 'El texto es demasiado largo (max 280 caracteres)' }).optional().or(z.literal('')),
    phone: z.string().trim().optional().or(z.literal('')),
    email: z.string().trim().email({ message: 'Correo no valido' }).optional().or(z.literal('')),
    address: z.string().trim().optional().or(z.literal('')),
    image: z.string().trim().optional().or(z.literal('')),
    googleReviewsUrl: z.string().trim().url({ message: 'La URL de resenas no es valida' }).optional().or(z.literal(''))
})
