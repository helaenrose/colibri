import { auth } from "../src/lib/auth"
import { prisma } from "../src/lib/prisma"

/**
 * Crea (o reutiliza) el usuario administrador inicial.
 * Credenciales por defecto, sobreescribibles con variables de entorno:
 *   ADMIN_EMAIL     (default: admin@colibri.com)
 *   ADMIN_PASSWORD  (default: admin1234)
 *   ADMIN_NAME      (default: Administrador)
 */
async function main() {
    const email = (process.env.ADMIN_EMAIL ?? "admin@colibri.com").toLowerCase().trim()
    const password = process.env.ADMIN_PASSWORD ?? "admin1234"
    const name = process.env.ADMIN_NAME ?? "Administrador"

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
        console.log(`El administrador ya existe: ${email}`)
        return
    }

    const ctx = await auth.$context
    const hash = await ctx.password.hash(password)

    const user = await ctx.internalAdapter.createUser({
        email,
        name,
        emailVerified: true,
    })

    await ctx.internalAdapter.createAccount({
        userId: user.id,
        providerId: "credential",
        accountId: user.id,
        password: hash,
    })

    console.log("Administrador creado correctamente:")
    console.log(`  Correo:   ${email}`)
    console.log(`  Password: ${password}`)
}

main()
    .catch((error) => {
        console.error("Error creando el administrador:", error)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
