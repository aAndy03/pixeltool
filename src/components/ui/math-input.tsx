'use client'

import React, { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface MathInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
    value: number
    decimals?: number
    onChange: (value: number) => void
}

export function MathInput({ value, onChange, decimals = 2, className, ...props }: MathInputProps) {
    const [strValue, setStrValue] = useState('')
    const [isFocused, setIsFocused] = useState(false)

    // Sync from prop when not focused
    useEffect(() => {
        if (!isFocused) {
            setStrValue(Number(value).toFixed(decimals).replace(/\.?0+$/, '')) // Trim trailing zeros
        }
    }, [value, decimals, isFocused])

    const evaluate = () => {
        if (!strValue) {
            onChange(0)
            return
        }

        try {
            // Safe evaluation: allow only numbers and basic operators
            // 1. Validate characters
            if (!/^[0-9\.\+\-\*\/\(\)\s]+$/.test(strValue)) {
                // Illegal chars, revert
                setStrValue(Number(value).toFixed(decimals))
                return
            }

            // 2. Evaluate
            // eslint-disable-next-line no-new-func
            const result = new Function('return ' + strValue)()

            if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
                onChange(result)
                // Update display immediately (optional, or wait for useEffect)
                setStrValue(Number(result).toFixed(decimals).replace(/\.?0+$/, ''))
            } else {
                // Reset on NaN
                setStrValue(Number(value).toFixed(decimals))
            }
        } catch (e) {
            // Parse error, reset
            setStrValue(Number(value).toFixed(decimals))
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.currentTarget.blur() // Triggers onBlur -> evaluate
        }
        props.onKeyDown?.(e)
    }

    return (
        <Input
            {...props}
            type="text" // Always text to allow math chars
            value={strValue}
            onChange={(e) => setStrValue(e.target.value)}
            onFocus={(e) => {
                setIsFocused(true)
                e.target.select()
                props.onFocus?.(e)
            }}
            onBlur={(e) => {
                setIsFocused(false)
                evaluate()
                props.onBlur?.(e)
            }}
            onKeyDown={handleKeyDown}
            className={cn("font-mono", className)}
        />
    )
}
