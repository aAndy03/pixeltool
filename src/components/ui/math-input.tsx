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
            // Fix: Use parseFloat to standard formatting to remove insigificant zeros (e.g. 300.00 -> 300)
            // without trimming significant integer zeros (e.g. 300 -> 3)
            setStrValue(parseFloat(Number(value).toFixed(decimals)).toString())
        }
    }, [value, decimals, isFocused])

    const evaluate = () => {
        if (!strValue) {
            onChange(0)
            return
        }

        try {
            // Safe evaluation: allow numbers, basic operators, and %
            // 1. Validate characters
            if (!/^[0-9\.\+\-\*\/\(\)\s%]+$/.test(strValue)) {
                // Illegal chars, revert
                setStrValue(parseFloat(Number(value).toFixed(decimals)).toString())
                return
            }

            // 2. Handle percentages (e.g. 50% -> 0.5, 100+50% -> 100 + 0.5... context matters but simple /100 replace is start)
            // We'll replace N% with (N/100)
            const parsedStr = strValue.replace(/([0-9\.]+)(%)/g, '($1/100)')

            // 3. Evaluate
            // eslint-disable-next-line no-new-func
            const result = new Function('return ' + parsedStr)()

            if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
                onChange(result)
                setStrValue(parseFloat(Number(result).toFixed(decimals)).toString())
            } else {
                // Reset on NaN
                setStrValue(parseFloat(Number(value).toFixed(decimals)).toString())
            }
        } catch (e) {
            // Parse error, reset
            setStrValue(parseFloat(Number(value).toFixed(decimals)).toString())
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
