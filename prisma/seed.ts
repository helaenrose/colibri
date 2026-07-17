import { categories } from "./data/categories";
import { products } from "./data/products";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    // Limpiar datos existentes respetando las relaciones
    await prisma.orderProducts.deleteMany();
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();

    // Crear el perfil del negocio por defecto si aun no existe
    const existingProfile = await prisma.businessProfile.findFirst();
    if (!existingProfile) {
        await prisma.businessProfile.create({
            data: {
                name: "Mi Tienda de Abarrotes",
                phone: "+52 000 000 0000",
                email: "contacto@mitienda.com",
                address: "Calle Principal 123, Centro",
            },
        });
    }

    // Crear categorías y mapear el id original (del archivo de datos) al id generado
    const categoryIdMap: Record<string, string> = {};

    for (const category of categories) {
        const created = await prisma.category.create({
            data: {
                name: category.name,
                slug: category.slug,
            },
        });
        categoryIdMap[category.id] = created.id;
    }

    // Crear productos conectándolos a la categoría correspondiente
    for (const product of products) {
        const categoryId = categoryIdMap[product.categoryId];
        if (!categoryId) {
            console.warn(`Categoría no encontrada para el producto ${product.name}`);
            continue;
        }

        await prisma.product.create({
            data: {
                name: product.name,
                price: product.price,
                image: product.image,
                stock: product.stock ?? 0,
                category: {
                    connect: { id: categoryId },
                },
            },
        });
    }
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (error) => {
        console.error(error);
        await prisma.$disconnect();
        process.exit(1);
    });
