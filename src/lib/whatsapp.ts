// Construye una URL de WhatsApp para Ecuador a partir del telefono del perfil.
// Regla: se elimina todo lo que no sea digito, se quita el 0 inicial (formato local)
// y se antepone el codigo de pais 593.
// Ejemplo: "0978776425" -> "https://wa.me/593978776425"
export const buildWhatsappUrl = (phone: string | null | undefined): string | null => {
    if (!phone) return null

    let digits = phone.replace(/\D+/g, "")
    if (digits.length === 0) return null

    // Si ya viene con el codigo de pais, lo respetamos
    if (digits.startsWith("593")) {
        return `https://wa.me/${digits}`
    }

    // Quita un unico 0 inicial (formato local ecuatoriano)
    if (digits.startsWith("0")) {
        digits = digits.slice(1)
    }

    return `https://wa.me/593${digits}`
}
