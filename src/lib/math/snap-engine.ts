export interface SnapResult {
    snapped: number
    guide?: number // The line position (e.g. grid line) we snapped to
}

export interface Point {
    x: number
    y: number
}

interface SnapState {
    x: number
    y: number
    guides: {
        x?: number // Vertical line at X
        y?: number // Horizontal line at Y
    }
}

export class SnapEngine {
    /**
     * Snap a value to the nearest grid step
     * @param value Current value (world unit)
     * @param step Grid step size (world unit)
     * @param threshold Max distance to snap (world unit)
     */
    static snapToGrid1D(value: number, step: number, threshold: number): SnapResult {
        const rounded = Math.round(value / step) * step
        const diff = Math.abs(value - rounded)

        if (diff <= threshold) {
            return { snapped: rounded, guide: rounded }
        }
        return { snapped: value }
    }

    /**
     * Calculate position with drift correction and grid snapping
     * @param initialPos Object's start world position
     * @param delta Movement delta (screen space projected to world space)
     * @param gridSpacing Active grid size
     * @param snapEnabled Is snap on?
     * @param threshold Snap magnetic radius
     */
    static calculateSnap(
        initialPos: Point,
        delta: Point,
        gridSpacing: number,
        snapEnabled: boolean,
        threshold: number = gridSpacing * 0.2
    ): SnapState {
        // Raw target position without snap
        const rawX = initialPos.x + delta.x
        const rawY = initialPos.y + delta.y

        if (!snapEnabled) {
            return {
                x: rawX,
                y: rawY,
                guides: {}
            }
        }

        // 1. Grid Snap
        const snapX = this.snapToGrid1D(rawX, gridSpacing, threshold / 2) // Stricter for grid
        const snapY = this.snapToGrid1D(rawY, gridSpacing, threshold / 2)

        // 2. 90-degree orthogonal snap (Shift key usually, but here we might want guides for it)
        // For now, grid snap implies orthogonal snap if based on 0,0 grid.

        return {
            x: snapX.snapped,
            y: snapY.snapped,
            guides: {
                x: snapX.guide,
                y: snapY.guide
            }
        }
    }
}
