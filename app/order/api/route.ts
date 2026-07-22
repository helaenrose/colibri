import { prisma } from "@/src/lib/prisma"
import { OrderSchema } from "@/src/schema"
import { createDemoOrder } from "@/src/demo/demo-store"
import { withTimeout } from "@/src/lib/with-timeout"
import { isDemoFallbackEnabled } from "@/src/lib/demo-fallback"
import { Redis } from "@upstash/redis"
import { Ratelimit } from "@upstash/ratelimit"

export const dynamic = 'force-dynamic'

// Rate limiter: max 15 pedidos por IP cada 15 minutos.
// Se crea de forma lazy para no fallar en entornos sin las variables configuradas.
const getRateLimiter = (() => {
  let limiter: Ratelimit | null = null
  return () => {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      return null
    }
    if (!limiter) {
      limiter = new Ratelimit({
        redis: new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL,
          token: process.env.UPSTASH_REDIS_REST_TOKEN,
        }),
        limiter: Ratelimit.slidingWindow(15, '15 m'),
        prefix: 'rl:order',
      })
    }
    return limiter
  }
})()

// Verifica el token de Cloudflare Turnstile contra la API de Cloudflare.
// Devuelve true si el token es valido, false en caso contrario.
// Si la variable de entorno no esta configurada se omite la verificacion
// (util en entornos de desarrollo o demo).
const verifyTurnstile = async (token: string, ip: string): Promise<boolean> => {
  const secretKey = process.env.TURNSTILE_SECRET_KEY
  if (!secretKey) return true

  const formData = new FormData()
  formData.append('secret', secretKey)
  formData.append('response', token)
  formData.append('remoteip', ip)

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: formData,
  })

  const data = await res.json() as { success: boolean }
  return data.success === true
}

export const POST = async (request: Request) => {
  // Extraer IP del cliente (Cloudflare -> proxy -> fallback)
  const clientIp =
    request.headers.get('CF-Connecting-IP') ??
    request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ??
    '0.0.0.0'

  // Rate limiting: max 15 peticiones por IP cada 15 minutos.
  // Si Upstash no esta configurado se omite silenciosamente.
  const rateLimiter = getRateLimiter()
  if (rateLimiter) {
    const { success, limit, remaining, reset } = await rateLimiter.limit(clientIp)
    if (!success) {
      const retryAfterSecs = Math.ceil((reset - Date.now()) / 1000)
      return Response.json(
        { success: false, errors: [{ message: 'Demasiadas solicitudes. Intenta de nuevo en unos minutos.' }] },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfterSecs),
            'X-RateLimit-Limit': String(limit),
            'X-RateLimit-Remaining': String(remaining),
            'X-RateLimit-Reset': String(reset),
          },
        },
      )
    }
  }

  const payload = await request.json().catch(() => null)
  const result = OrderSchema.safeParse(payload)

  if (!result.success) {
    return Response.json({ success: false, errors: result.error.errors }, { status: 400 })
  }

  // Verificar Turnstile antes de procesar la orden.
  const turnstileToken = (payload as Record<string, unknown>)?.turnstileToken
  if (process.env.TURNSTILE_SECRET_KEY) {
    if (!turnstileToken || typeof turnstileToken !== 'string') {
      return Response.json(
        { success: false, errors: [{ message: 'Verificacion de seguridad requerida.' }] },
        { status: 400 },
      )
    }
    const valid = await verifyTurnstile(turnstileToken, clientIp).catch(() => false)
    if (!valid) {
      return Response.json(
        { success: false, errors: [{ message: 'La verificacion de seguridad fallo. Intenta de nuevo.' }] },
        { status: 403 },
      )
    }
  }

  try {
    await withTimeout(prisma.order.create({
      data: {
        name: result.data.name,
        phone: result.data.phone,
        email: result.data.email || null,
        deliveryType: result.data.deliveryType,
        address: result.data.deliveryType === "DELIVERY" ? (result.data.address || null) : null,
        receiptUrl: result.data.receiptUrl,
        receiptId: result.data.receiptId,
        total: result.data.total,
        orderProducts: {
          create: result.data.order.map((product) => ({
            product: {
              connect: { id: String(product.id) }
            },
            quantity: product.quantity
          }))
        }
      }
    }))

    return Response.json({ success: true })
  } catch (error) {
    if (isDemoFallbackEnabled) {
      createDemoOrder(result.data)
      return Response.json({ success: true, demo: true })
    }

    console.error('Error creating order', error)
    return Response.json(
      { success: false, errors: [{ message: 'No se pudo crear el pedido. Intenta de nuevo.' }] },
      { status: 500 },
    )
  }
}
