'use client'

import { CldUploadWidget } from "next-cloudinary"
import Image from "next/image"
import { useState } from "react"
import { TbPhotoPlus } from "react-icons/tb"

interface ProfileImageUploadProps {
    image?: string | null
    onChange: (url: string) => void
}

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME

const ProfileImageUpload = ({ image, onChange }: ProfileImageUploadProps) => {

    const [imageUrl, setImageUrl] = useState(image && image.startsWith('http') ? image : '')
    const currentImage = imageUrl

    const preview = currentImage ? (
        <div className="relative mt-3 h-40 w-full overflow-hidden rounded-md border border-slate-200 bg-slate-100">
            <Image
                src={currentImage}
                alt="Imagen del negocio"
                fill
                style={{ objectFit: 'contain' }}
                sizes="(max-width: 768px) 100vw, 400px"
            />
        </div>
    ) : null

    // Si Cloudinary no esta configurado, permitimos pegar una URL de imagen.
    if (!cloudName) {
        return (
            <div className="space-y-2">
                <label htmlFor="image-url" className="text-sm font-semibold text-slate-800">Imagen del negocio (URL)</label>
                <input
                    id="image-url"
                    type="url"
                    inputMode="url"
                    placeholder="https://..."
                    value={currentImage}
                    onChange={(event) => {
                        const value = event.target.value.trim()
                        setImageUrl(value)
                        onChange(value)
                    }}
                    className="block w-full rounded-md border border-slate-200 bg-slate-100 p-3 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                {preview}
            </div>
        )
    }

    return (
        <CldUploadWidget
            onSuccess={(result, { widget }) => {
                if (result.event === 'success') {
                    widget.close()
                    // @ts-expect-error Cloudinary is not typed
                    const url = result.info?.secure_url as string
                    setImageUrl(url)
                    onChange(url)
                }
            }}
            uploadPreset="tezclw0v"
            options={{ maxFiles: 1 }}
        >
            {({ open }) => (
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-800">Imagen del negocio</label>
                    <button
                        type="button"
                        aria-label="Subir imagen del negocio"
                        onClick={() => open()}
                        className="relative flex min-h-48 w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-md border border-neutral-300 bg-slate-100 text-neutral-600 transition hover:opacity-80"
                    >
                        <TbPhotoPlus size={46} />
                        {!currentImage && <p className="text-base font-semibold">Agregar imagen</p>}
                        {currentImage && (
                            <div className="absolute inset-0 size-full">
                                <Image
                                    src={currentImage}
                                    alt="Imagen del negocio"
                                    fill
                                    style={{ objectFit: 'contain' }}
                                    sizes="(max-width: 768px) 100vw, 400px"
                                />
                            </div>
                        )}
                    </button>
                </div>
            )}
        </CldUploadWidget>
    )
}

export default ProfileImageUpload
