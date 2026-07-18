import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'

const ADMIN_LOGIN_PATH = '/admin/login'
const ADMIN_DEFAULT_PATH = '/admin/products'

export const proxy = (request: NextRequest) => {
  if (!request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.next()
  }

  // Chequeo optimista de la cookie de sesión (compatible con edge).
  // La validación real (Better Auth o acceso de emergencia) ocurre en el layout y en las acciones.
  const sessionCookie = getSessionCookie(request)
  const emergencyCookie = request.cookies.get('admin_emergency')?.value
  const isAuthenticated = Boolean(sessionCookie) || Boolean(emergencyCookie)

  if (request.nextUrl.pathname.startsWith(ADMIN_LOGIN_PATH)) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL(ADMIN_DEFAULT_PATH, request.url))
    }
    return NextResponse.next()
  }

  if (!isAuthenticated) {
    const loginUrl = new URL(ADMIN_LOGIN_PATH, request.url)
    loginUrl.searchParams.set('next', `${request.nextUrl.pathname}${request.nextUrl.search}`)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
