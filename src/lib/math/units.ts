import { create, all } from 'mathjs'

const math = create(all)

export type Unit = 'mm' | 'cm' | 'm' | 'km' | 'in' | 'ft' | 'yd' | 'mi'
export type DisplayUnit = 'mm' | 'cm' | 'm' | 'in' | 'px'

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
export function toPx(value: number | string, unit: Unit | 'px' = 'mm', ppi: number = DEFAULT_PPI): number {
    // Handle px passthrough - value is already in pixels
    if (unit === 'px') return value as number

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
export function fromPx(px: number, unit: Unit | 'px' = 'mm', ppi: number = DEFAULT_PPI): number {
    // Handle px passthrough - return pixels as-is
    if (unit === 'px') return px

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

/**
 * Converts a value from one unit to another.
 * Supports all display units including px.
 */
export function convertValue(value: number, fromUnit: DisplayUnit, toUnit: DisplayUnit, ppi: number = DEFAULT_PPI): number {
    if (fromUnit === toUnit) return value

    // Convert to pixels first
    const px = toPx(value, fromUnit, ppi)
    // Then convert to target unit
    return fromPx(px, toUnit, ppi)
}

// Common aspect ratios for matching
const COMMON_RATIOS = [
    { w: 1, h: 1, name: '1:1' },
    { w: 4, h: 3, name: '4:3' },
    { w: 3, h: 2, name: '3:2' },
    { w: 16, h: 9, name: '16:9' },
    { w: 16, h: 10, name: '16:10' },
    { w: 21, h: 9, name: '21:9' },
    { w: 5, h: 4, name: '5:4' },
    { w: 2, h: 3, name: '2:3' },
    { w: 3, h: 4, name: '3:4' },
    { w: 9, h: 16, name: '9:16' },
]

/**
 * Formats width and height as a simplified aspect ratio string.
 * Attempts to match common ratios first, otherwise simplifies with GCD.
 */
export function formatAspectRatio(width: number, height: number): string {
    if (height === 0) return '∞:1'
    if (width === 0) return '0:1'

    const ratio = width / height
    const tolerance = 0.02 // 2% tolerance for matching

    // Try to match common ratios
    for (const common of COMMON_RATIOS) {
        const commonRatio = common.w / common.h
        if (Math.abs(ratio - commonRatio) < tolerance) {
            return common.name
        }
    }

    // GCD-based simplification for non-standard ratios
    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b)

    // Round to avoid floating point issues
    const w = Math.round(width)
    const h = Math.round(height)
    const divisor = gcd(w, h)

    const simplifiedW = w / divisor
    const simplifiedH = h / divisor

    // If numbers are too large, show decimal ratio
    if (simplifiedW > 100 || simplifiedH > 100) {
        return `${ratio.toFixed(2)}:1`
    }

    return `${simplifiedW}:${simplifiedH}`
}
