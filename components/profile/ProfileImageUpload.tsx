'use client'

import Image from "next/image"
import { useRef, useState } from "react"
import { TbPhotoPlus } from "react-icons/tb"
import { toast } from "react-toastify"

interface ProfileImageUploadProps {
    image?: string | null
    onChange: (url: string) => void
}

const isRenderableSrc = (value: string) =>
    value.startsWith('/') || value.startsWith('http')

const ProfileImageUpload = ({ image, onChange }: ProfileImageUploadProps) => {
    const inputRef = useRef<HTMLInputElement>(null)
    const [currentImage, setCurrentImage] = useState(image ?? '')
    const [uploading, setUploading] = useState(false)

    const handleFile = async (file: File) => {
        setUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)

            const response = await fetch('/admin/profile/api/upload', {
                method: 'POST',
                body: formData,
            })
            const result = await response.json()

            if (!response.ok || !result.ok) {
                toast.error(result.error ?? 'No se pudo subir la imagen.')
                return
            }

            setCurrentImage(result.url)
            onChange(result.url)
            toast.success('Imagen cargada')
        } catch {
            toast.error('Ocurrio un error al subir la imagen.')
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="space-y-2">
            <span className="text-sm font-semibold text-slate-800">Imagen del negocio</span>

            <input
                ref={inputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) handleFile(file)
                    event.target.value = ''
                }}
            />

            <button
                type="button"
                aria-label="Subir imagen del negocio desde tu equipo"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                className="relative flex min-h-48 w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-md border border-dashed border-neutral-300 bg-slate-100 text-neutral-600 transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60"
            >
                {uploading ? (
                    <p className="text-base font-semibold">Subiendo...</p>
                ) : currentImage && isRenderableSrc(currentImage) ? (
                    <div className="absolute inset-0 size-full">
                        <Image
                            src={currentImage}
                            alt="Imagen del negocio"
                            fill
                            unoptimized={currentImage.startsWith('http') && !currentImage.includes('res.cloudinary.com')}
                            style={{ objectFit: 'contain' }}
                            sizes="(max-width: 768px) 100vw, 400px"
                        />
                    </div>
                ) : (
                    <>
                        <TbPhotoPlus size={46} />
                        <p className="text-base font-semibold">Subir desde tu equipo</p>
                        <p className="text-xs text-neutral-500">JPG, PNG o WEBP (max 4MB)</p>
                    </>
                )}
            </button>

            {currentImage && isRenderableSrc(currentImage) ? (
                <button
                    type="button"
                    onClick={() => {
                        setCurrentImage('')
                        onChange('')
                    }}
                    className="text-xs font-semibold text-red-600 hover:text-red-700"
                >
                    Quitar imagen
                </button>
            ) : null}
        </div>
    )
}

export default ProfileImageUpload
