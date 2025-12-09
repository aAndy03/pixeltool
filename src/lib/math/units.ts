import { create, all } from 'mathjs'

const math = create(all)

export type Unit = 'mm' | 'cm' | 'm' | 'km' | 'in' | 'ft' | 'yd' | 'mi'

// Standard Web PPI (Pixels Per Inch)
export const DEFAULT_PPI = 96

/**
 * Converts a real-world value to pixels based on the given PPI.
 * Formula: pixels = (value_in_mm / 25.4) * PPI
 * 
 * @param value The value to convert (can be a number or string like '10 cm')
 * @param unit The target unit if value is a number (default 'mm')
 * @param ppi The monitor's PPI (Pixels Per Inch), defaults to 96
 */
export function toPx(value: number | string, unit: Unit = 'mm', ppi: number = DEFAULT_PPI): number {
    let valueInMm: number

    if (typeof value === 'string') {
        try {
            // Use mathjs to convert string unit to mm
            valueInMm = math.unit(value).toNumber('mm')
        } catch (e) {
            console.error('Invalid unit string:', value)
            return 0
        }
    } else {
        // Convert number from given unit to mm
        // We handle common cases manually for speed, fallback to mathjs
        switch (unit) {
            case 'mm': valueInMm = value; break;
            case 'cm': valueInMm = value * 10; break;
            case 'm': valueInMm = value * 1000; break;
            case 'km': valueInMm = value * 1000000; break;
            case 'in': valueInMm = value * 25.4; break;
            default: valueInMm = math.unit(value, unit).toNumber('mm');
        }
    }

    // 1 inch = 25.4 mm
    // pixels = inches * ppi
    return (valueInMm / 25.4) * ppi
}

/**
 * Converts pixels back to a real-world unit.
 * 
 * @param px The pixel value
 * @param unit The target unit string
 * @param ppi The monitor's PPI
 */
export function fromPx(px: number, unit: Unit = 'mm', ppi: number = DEFAULT_PPI): number {
    const inches = px / ppi
    const mm = inches * 25.4

    // Convert mm to target unit
    switch (unit) {
        case 'mm': return mm;
        case 'cm': return mm / 10;
        case 'm': return mm / 1000;
        case 'km': return mm / 1000000;
        case 'in': return inches;
        default: return math.unit(mm, 'mm').toNumber(unit);
    }
}

/**
 * Formats a pixel value to a human-readable string in the best fitting unit.
 * e.g. 1000mm -> "1 m"
 */
export function formatPx(px: number, ppi: number = DEFAULT_PPI): string {
    const mm = fromPx(px, 'mm', ppi)

    if (mm >= 1000000) return `${(mm / 1000000).toFixed(2)} km`
    if (mm >= 1000) return `${(mm / 1000).toFixed(2)} m`
    if (mm >= 10) return `${(mm / 10).toFixed(2)} cm`
    return `${mm.toFixed(2)} mm`
}
