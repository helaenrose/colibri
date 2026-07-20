'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const className =
    'bg-amber-400 hover:bg-amber-500 active:scale-[0.99] duration-200 transition-all w-full lg:w-auto text-center py-3 px-10 font-semibold cursor-pointer rounded-md'

type GoBackButtonProps = {
    /**
     * Destino explícito al que volver. Si se provee, el botón navega ahí de
     * forma fiable (recomendado). Si se omite, cae en router.back(), que
     * depende del historial del navegador.
     */
    href?: string
    label?: string
}

const GoBackButton = ({ href, label = 'Volver' }: GoBackButtonProps) => {
    const router = useRouter()

    if (href) {
        return (
            <Link href={href} className={className}>
                {label}
            </Link>
        )
    }

    return (
        <button type="button" className={className} onClick={() => router.back()}>
            {label}
        </button>
    )
}

export default GoBackButton
