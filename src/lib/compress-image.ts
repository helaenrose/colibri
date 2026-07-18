// Comprime y redimensiona una imagen en el navegador antes de subirla.
// Evita el limite de tamano del body de las funciones serverless y acelera la subida.
// Devuelve un nuevo File (JPEG) mas liviano, o el original si algo falla.

const readAsDataURL = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(reader.error ?? new Error("No se pudo leer el archivo"))
        reader.readAsDataURL(file)
    })

const loadImage = (src: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = () => reject(new Error("No se pudo procesar la imagen"))
        img.src = src
    })

const withNewExtension = (name: string) => {
    const base = name.replace(/\.[^./\\]+$/, "")
    return `${base || "comprobante"}.jpg`
}

type CompressOptions = {
    maxDimension?: number
    quality?: number
}

export const compressImage = async (
    file: File,
    { maxDimension = 1600, quality = 0.82 }: CompressOptions = {},
): Promise<File> => {
    // Solo procesamos imagenes de mapa de bits soportadas por canvas.
    if (!file.type.startsWith("image/")) return file

    try {
        const dataUrl = await readAsDataURL(file)
        const img = await loadImage(dataUrl)

        let { width, height } = img
        if (!width || !height) return file

        if (width > maxDimension || height > maxDimension) {
            const scale = Math.min(maxDimension / width, maxDimension / height)
            width = Math.round(width * scale)
            height = Math.round(height * scale)
        }

        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")
        if (!ctx) return file

        // Aplanamos la transparencia sobre blanco (los PNG con alfa se veran bien en JPEG).
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(0, 0, width, height)
        ctx.drawImage(img, 0, 0, width, height)

        const blob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob(resolve, "image/jpeg", quality),
        )
        if (!blob) return file

        // Si por alguna razon el resultado no es mas liviano, conservamos el original.
        if (blob.size >= file.size) return file

        return new File([blob], withNewExtension(file.name), { type: "image/jpeg" })
    } catch {
        // Ante cualquier error de procesamiento, subimos el archivo original.
        return file
    }
}
