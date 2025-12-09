'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useProjectStore } from '@/lib/store/project-store'
import { DisplayUnit, convertValue, fromPx, toPx, DEFAULT_PPI } from '@/lib/math/units'

interface MeasurementContextValue {
    dpi: number
    displayUnit: DisplayUnit
    setDpi: (dpi: number) => void
    setDisplayUnit: (unit: DisplayUnit) => void
    convert: (value: number, from: DisplayUnit, to?: DisplayUnit) => number
    formatDimension: (valuePx: number, decimals?: number) => string
    pxToUnit: (px: number, unit?: DisplayUnit) => number
    unitToPx: (value: number, unit?: DisplayUnit) => number
}

const MeasurementContext = createContext<MeasurementContextValue | null>(null)

export function MeasurementProvider({ children }: { children: ReactNode }) {
    const { currentProject, updateProject } = useProjectStore()

    const dpi = currentProject?.settings?.dpi ?? DEFAULT_PPI
    const displayUnit: DisplayUnit = currentProject?.settings?.displayUnit ?? 'mm'

    const setDpi = (newDpi: number) => {
        if (currentProject) {
            updateProject(currentProject.id, {
                settings: { ...currentProject.settings, dpi: newDpi }
            })
        }
    }

    const setDisplayUnit = (unit: DisplayUnit) => {
        if (currentProject) {
            updateProject(currentProject.id, {
                settings: { ...currentProject.settings, displayUnit: unit }
            })
        }
    }

    const convert = (value: number, from: DisplayUnit, to?: DisplayUnit) => {
        return convertValue(value, from, to ?? displayUnit, dpi)
    }

    const formatDimension = (valuePx: number, decimals: number = 2) => {
        const val = fromPx(valuePx, displayUnit, dpi)
        return `${val.toFixed(decimals)} ${displayUnit}`
    }

    const pxToUnit = (px: number, unit?: DisplayUnit) => {
        return fromPx(px, unit ?? displayUnit, dpi)
    }

    const unitToPx = (value: number, unit?: DisplayUnit) => {
        return toPx(value, unit ?? displayUnit, dpi)
    }

    return (
        <MeasurementContext.Provider value={{
            dpi,
            displayUnit,
            setDpi,
            setDisplayUnit,
            convert,
            formatDimension,
            pxToUnit,
            unitToPx
        }}>
            {children}
        </MeasurementContext.Provider>
    )
}

export const useMeasurement = () => {
    const ctx = useContext(MeasurementContext)
    if (!ctx) throw new Error('useMeasurement must be used within MeasurementProvider')
    return ctx
}

/**
 * Standalone hook for components that may not be wrapped in MeasurementProvider.
 * Falls back to defaults if context is not available.
 */
export const useMeasurementSafe = () => {
    const ctx = useContext(MeasurementContext)

    const defaults: MeasurementContextValue = {
        dpi: DEFAULT_PPI,
        displayUnit: 'mm',
        setDpi: () => { },
        setDisplayUnit: () => { },
        convert: (value, from, to) => convertValue(value, from, to ?? 'mm', DEFAULT_PPI),
        formatDimension: (valuePx, decimals = 2) => `${fromPx(valuePx, 'mm', DEFAULT_PPI).toFixed(decimals)} mm`,
        pxToUnit: (px, unit) => fromPx(px, unit ?? 'mm', DEFAULT_PPI),
        unitToPx: (value, unit) => toPx(value, unit ?? 'mm', DEFAULT_PPI)
    }

    return ctx ?? defaults
}
