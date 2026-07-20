import { getBusinessProfile } from "@/src/lib/business-profile"

const InstructionsMarquee = async () => {
    const { instructionSteps } = await getBusinessProfile()
    const steps = instructionSteps.filter((s) => s.trim().length > 0)

    // Si no hay pasos configurados, no renderizamos la cinta
    if (steps.length === 0) return null

    // Duplicamos la lista para lograr un bucle continuo sin cortes
    const loop = [...steps, ...steps]

    return (
        <div
            className="marquee-group overflow-hidden border-y border-amber-300 bg-amber-400 text-slate-900"
            role="region"
            aria-label="Pasos para realizar tu pedido"
        >
            <div className="flex w-max animate-marquee items-center gap-0 py-2 will-change-transform">
                {loop.map((step, index) => (
                    <div key={index} className="flex items-center" aria-hidden={index >= steps.length}>
                        <span className="flex items-center gap-2 px-6 text-sm font-semibold tracking-tight sm:text-base">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-black text-amber-300">
                                {(index % steps.length) + 1}
                            </span>
                            {step}
                        </span>
                        <span className="text-slate-900/40" aria-hidden="true">
                            •
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default InstructionsMarquee
