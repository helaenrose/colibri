'use client'

import { CldUploadWidget } from "next-cloudinary"
import Image from "next/image"
import { useState } from "react"
import { TbPhotoPlus } from "react-icons/tb"

interface ProfileImageUploadProps {
    image?: string | null
    onChange: (url: string) => void
}

const ProfileImageUpload = ({ image, onChange }: ProfileImageUploadProps) => {

    const [imageUrl, setImageUrl] = useState('')
    const currentImage = imageUrl || (image && image.startsWith('http') ? image : '')

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
