import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { nextCookies } from "better-auth/next-js"
import { prisma } from "@/src/lib/prisma"

function getBaseURL() {
    if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL
    if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
        return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
    if (process.env.V0_RUNTIME_URL) return process.env.V0_RUNTIME_URL
    return "http://localhost:3000"
}

const trustedOrigins = [
    process.env.BETTER_AUTH_URL,
    process.env.V0_RUNTIME_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : undefined,
    "http://localhost:3000",
].filter(Boolean) as string[]

export const auth = betterAuth({
    baseURL: getBaseURL(),
    trustedOrigins,
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: true,
        // Solo el administrador se crea desde el seed; no exponemos registro público.
        disableSignUp: true,
    },
    advanced:
        process.env.NODE_ENV === "development"
            ? {
                  defaultCookieAttributes: {
                      sameSite: "none",
                      secure: true,
                  },
              }
            : undefined,
    plugins: [nextCookies()],
})
