'use client'
import { getImagePath } from "@/src/utils"
import Image from "next/image"
import { useRef, useState } from "react"
import { TbPhotoPlus } from "react-icons/tb"
import { toast } from "react-toastify"

interface ImageUploadProps {
    image?: string | undefined
}

const ImageUpload = ({ image }: ImageUploadProps) => {
    const [imageUrl, setImageUrl] = useState('')
    const [uploading, setUploading] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    const handleFile = async (file: File | undefined) => {
        if (!file) return
        setUploading(true)
        try {
            const formData = new FormData()
            formData.append("file", file)
            const response = await fetch("/admin/media/api/upload", {
                method: "POST",
                body: formData,
            })
            const data = await response.json()
            if (!response.ok || !data.ok) {
                toast.error(data.error ?? "No se pudo subir la imagen.")
                return
            }
            setImageUrl(data.asset.url)
        } catch {
            toast.error("No se pudo subir la imagen.")
        } finally {
            setUploading(false)
        }
    }

    return (
        <>
            <div className="space-y-2">
                <label className="text-slate-800">Imágen del producto</label>
                <button
                    type="button"
                    aria-label="Subir imagen del producto"
                    disabled={uploading}
                    className="relative w-full cursor-pointer hover:opacity-80 transition border border-neutral-300 rounded-md flex flex-col justify-center items-center gap-4 text-neutral-600 bg-slate-100 min-h-56 disabled:cursor-not-allowed disabled:opacity-70"
                    onClick={() => inputRef.current?.click()}
                >
                    <TbPhotoPlus size={50} />
                    {uploading ? (
                        <p className="text-lg font-semibold">Subiendo...</p>
                    ) : (
                        !imageUrl && <p className="text-lg font-semibold">Agregar imágen</p>
                    )}
                    {imageUrl && (
                        <div className="absolute inset-0 size-full">
                            <Image
                                src={imageUrl}
                                alt="Imagen del producto subida"
                                style={{ objectFit: 'contain' }}
                                fill
                            />
                        </div>
                    )}
                </button>
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={(event) => handleFile(event.target.files?.[0])}
                />
            </div>

            {image && !imageUrl && (
                <div className="space-y-2">
                    <label>Imagen actual: </label>
                    <div className="relative size-64">
                        <Image
                            src={getImagePath(image)}
                            alt="Imagen del producto"
                            style={{ objectFit: 'contain' }}
                            fill
                        />
                    </div>
                </div>
            )}

            <input
                key={imageUrl || image || "empty"}
                type="hidden"
                name="image"
                // Cuando el valor cambia tiene que ser defaultValue y no value
                defaultValue={imageUrl ? imageUrl : image}
            />
        </>
    )
}

export default ImageUpload
