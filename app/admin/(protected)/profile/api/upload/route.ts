import { NextRequest } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { isAdminAuthenticated } from "@/src/lib/admin-auth"

export const dynamic = "force-dynamic"

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "image/x-icon": "ico",
  "image/vnd.microsoft.icon": "ico",
}

const MAX_BYTES = 4 * 1024 * 1024 // 4MB

export const POST = async (request: NextRequest) => {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ ok: false, error: "No autorizado." }, { status: 403 })
  }

  const formData = await request.formData()
  const file = formData.get("file")
  // "logo" (por defecto) o "favicon": solo cambia el prefijo del nombre del archivo.
  const kind = formData.get("kind") === "favicon" ? "favicon" : "logo"

  if (!(file instanceof File)) {
    return Response.json({ ok: false, error: "No se recibio ningun archivo." }, { status: 400 })
  }

  const ext = EXT_BY_TYPE[file.type]
  if (!ext) {
    return Response.json(
      { ok: false, error: "Formato no valido. Usa JPG, PNG, WEBP, SVG o ICO." },
      { status: 400 },
    )
  }

  if (file.size > MAX_BYTES) {
    return Response.json({ ok: false, error: "La imagen supera el limite de 4MB." }, { status: 400 })
  }

  const bytes = Buffer.from(await file.arrayBuffer())
  const fileName = `${kind}_${Date.now()}.${ext}`

  const uploadDir = path.join(process.cwd(), "public", "uploads")
  await mkdir(uploadDir, { recursive: true })
  await writeFile(path.join(uploadDir, fileName), bytes)

  return Response.json({ ok: true, url: `/uploads/${fileName}` })
}
