import { NextRequest } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { isAdminAuthenticated } from "@/src/lib/admin-auth"

export const dynamic = "force-dynamic"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_BYTES = 4 * 1024 * 1024 // 4MB

export const POST = async (request: NextRequest) => {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ ok: false, error: "No autorizado." }, { status: 403 })
  }

  const formData = await request.formData()
  const file = formData.get("file")

  if (!(file instanceof File)) {
    return Response.json({ ok: false, error: "No se recibio ningun archivo." }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return Response.json({ ok: false, error: "Formato no valido. Usa JPG, PNG o WEBP." }, { status: 400 })
  }

  if (file.size > MAX_BYTES) {
    return Response.json({ ok: false, error: "La imagen supera el limite de 4MB." }, { status: 400 })
  }

  const bytes = Buffer.from(await file.arrayBuffer())
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg"
  const fileName = `logo_${Date.now()}.${ext}`

  const uploadDir = path.join(process.cwd(), "public", "uploads")
  await mkdir(uploadDir, { recursive: true })
  await writeFile(path.join(uploadDir, fileName), bytes)

  return Response.json({ ok: true, url: `/uploads/${fileName}` })
}
