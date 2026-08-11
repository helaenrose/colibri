export type FinancePeriod = 'day' | 'week' | 'month' | 'year'

export const financePeriodLabels: Record<FinancePeriod, string> = {
    day: 'Hoy',
    week: 'Esta semana',
    month: 'Este mes',
    year: 'Este año',
}

export const isFinancePeriod = (value: unknown): value is FinancePeriod =>
    value === 'day' || value === 'week' || value === 'month' || value === 'year'

// Resuelve el rango [from, to] anclado a "ahora" segun el periodo solicitado.
// La semana inicia en lunes.
export const resolveFinancePeriodRange = (period: FinancePeriod, now: Date = new Date()) => {
    const from = new Date(now)
    const to = new Date(now)

    switch (period) {
        case 'day': {
            from.setHours(0, 0, 0, 0)
            to.setHours(23, 59, 59, 999)
            break
        }
        case 'week': {
            const day = from.getDay()
            // getDay(): 0 = domingo ... 6 = sabado. Se calcula el desplazamiento al lunes.
            const diffToMonday = day === 0 ? -6 : 1 - day
            from.setDate(from.getDate() + diffToMonday)
            from.setHours(0, 0, 0, 0)

            to.setTime(from.getTime())
            to.setDate(to.getDate() + 6)
            to.setHours(23, 59, 59, 999)
            break
        }
        case 'month': {
            from.setDate(1)
            from.setHours(0, 0, 0, 0)

            to.setMonth(to.getMonth() + 1, 0)
            to.setHours(23, 59, 59, 999)
            break
        }
        case 'year': {
            from.setMonth(0, 1)
            from.setHours(0, 0, 0, 0)

            to.setMonth(11, 31)
            to.setHours(23, 59, 59, 999)
            break
        }
    }

    return { from, to }
}
