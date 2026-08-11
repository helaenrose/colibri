import Heading from "@/components/ui/Heading"

export type AppliedFilter = { label: string; value: string }

interface Props {
    title: string
    description: string
    filters?: AppliedFilter[]
}

// Encabezado minimalista del panel principal del catalogo: solo el nombre de la
// categoria/seccion, su descripcion y los filtros activos (si hay alguno). El
// selector de categorias, las subcategorias y el buscador viven en el menu
// lateral (ver CatalogSidebarDrawer), por lo que aqui no se repiten.
const CatalogHeader = ({ title, description, filters = [] }: Props) => {
    return (
        <section className="rounded-3xl border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.2),_transparent_45%),linear-gradient(145deg,_#ffffff,_#f8fafc)] p-4 shadow-sm sm:p-6 md:p-8">
            <Heading>{title}</Heading>
            <p className="-mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">{description}</p>

            {filters.length > 0 ? (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Filtros aplicados</span>
                    {filters.map((filter) => (
                        <span
                            key={filter.label}
                            className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800"
                        >
                            <span className="text-amber-600/80">{filter.label}:</span>
                            {filter.value}
                        </span>
                    ))}
                </div>
            ) : null}
        </section>
    )
}

export default CatalogHeader
