'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils/cn'
import { ChevronDown, Check } from 'lucide-react'

// ===== Simple Select (original) =====
export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  options: SelectOption[]
  error?: string
  label?: string
  helperText?: string
  placeholder?: string
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, error, label, helperText, placeholder, id, ...props }, ref) => {
    const selectId = id || React.useId()

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            id={selectId}
            className={cn(
              'flex h-10 w-full appearance-none rounded-md border bg-white px-3 py-2 pr-10 text-sm transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'dark:bg-zinc-950 dark:focus-visible:ring-zinc-300',
              error
                ? 'border-red-500 focus-visible:ring-red-500'
                : 'border-zinc-200 dark:border-zinc-800',
              className
            )}
            ref={ref}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-500">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{helperText}</p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'

// ===== Custom Select Components (Radix-like API) =====

interface SelectContextValue {
  value: string
  onValueChange: (value: string) => void
  open: boolean
  setOpen: (open: boolean) => void
  triggerRef: React.MutableRefObject<HTMLButtonElement | null>
}

const SelectContext = React.createContext<SelectContextValue | null>(null)

function useSelectContext() {
  const context = React.useContext(SelectContext)
  if (!context) {
    throw new Error('Select components must be used within a SelectRoot')
  }
  return context
}

// SelectRoot
interface SelectRootProps {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
}

export function SelectRoot({ value: controlledValue, defaultValue = '', onValueChange, children }: SelectRootProps) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue)
  const [open, setOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLButtonElement | null>(null)

  const isControlled = controlledValue !== undefined
  const value = isControlled ? controlledValue : uncontrolledValue

  const handleValueChange = React.useCallback((newValue: string) => {
    if (!isControlled) {
      setUncontrolledValue(newValue)
    }
    onValueChange?.(newValue)
    setOpen(false)
  }, [isControlled, onValueChange])

  return (
    <SelectContext.Provider value={{ value, onValueChange: handleValueChange, open, setOpen, triggerRef }}>
      <div className="relative">{children}</div>
    </SelectContext.Provider>
  )
}

// SelectTrigger
interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode
}

export const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const { open, setOpen, triggerRef } = useSelectContext()

    const setRefs = React.useCallback(
      (node: HTMLButtonElement | null) => {
        // Set both refs
        triggerRef.current = node
        if (typeof ref === 'function') {
          ref(node)
        } else if (ref) {
          ref.current = node
        }
      },
      [ref, triggerRef]
    )

    return (
      <button
        ref={setRefs}
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'dark:border-zinc-800 dark:bg-zinc-950',
          className
        )}
        {...props}
      >
        {children}
        <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
      </button>
    )
  }
)
SelectTrigger.displayName = 'SelectTrigger'

// SelectValue
interface SelectValueProps {
  placeholder?: string
}

export function SelectValue({ placeholder }: SelectValueProps) {
  const { value } = useSelectContext()
  return <span className={cn(!value && 'text-zinc-500')}>{value || placeholder}</span>
}

// SelectContent
interface SelectContentProps {
  children: React.ReactNode
  className?: string
}

export function SelectContent({ children, className }: SelectContentProps) {
  const { open, setOpen, triggerRef } = useSelectContext()
  const contentRef = React.useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = React.useState(false)
  const [position, setPosition] = React.useState({ top: 0, left: 0, width: 0 })

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Actualizar posición cuando se abre
  React.useEffect(() => {
    if (open && mounted && triggerRef.current) {
      const updatePosition = () => {
        if (!triggerRef.current) return

        const rect = triggerRef.current.getBoundingClientRect()
        setPosition({
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
          width: rect.width,
        })
      }

      // Actualizar inmediatamente y en el próximo frame
      updatePosition()
      requestAnimationFrame(updatePosition)

      // Escuchar eventos
      const handleScroll = () => updatePosition()
      const handleResize = () => updatePosition()

      window.addEventListener('scroll', handleScroll, true)
      window.addEventListener('resize', handleResize)

      return () => {
        window.removeEventListener('scroll', handleScroll, true)
        window.removeEventListener('resize', handleResize)
      }
    }
  }, [open, mounted, triggerRef])

  // Cerrar al hacer click afuera
  React.useEffect(() => {
    if (!open) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node

      if (
        contentRef.current &&
        !contentRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setOpen(false)
      }
    }

    // Pequeño delay para evitar que el click que abre el select lo cierre inmediatamente
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 0)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open, setOpen, triggerRef])

  if (!open || !mounted) return null

  const content = (
    <div
      ref={contentRef}
      className={cn(
        'fixed z-[9999] max-h-60 overflow-auto rounded-md border border-zinc-200 bg-white py-1 shadow-lg',
        'dark:border-zinc-800 dark:bg-zinc-950',
        className
      )}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: `${position.width}px`,
      }}
    >
      {children}
    </div>
  )

  return createPortal(content, document.body)
}

// SelectItem
interface SelectItemProps {
  value: string
  children: React.ReactNode
  disabled?: boolean
  className?: string
}

export function SelectItem({ value, children, disabled, className }: SelectItemProps) {
  const { value: selectedValue, onValueChange } = useSelectContext()
  const isSelected = selectedValue === value

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => !disabled && onValueChange(value)}
      className={cn(
        'relative flex w-full cursor-pointer items-center px-3 py-2 text-sm',
        'hover:bg-zinc-100 dark:hover:bg-zinc-800',
        isSelected && 'bg-zinc-100 dark:bg-zinc-800',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
    >
      <span className="flex-1 text-left">{children}</span>
      {isSelected && <Check className="h-4 w-4 text-zinc-900 dark:text-zinc-50" />}
    </button>
  )
}

// SelectGroup
interface SelectGroupProps {
  children: React.ReactNode
}

export function SelectGroup({ children }: SelectGroupProps) {
  return <div className="py-1">{children}</div>
}

// SelectLabel
interface SelectLabelProps {
  children: React.ReactNode
  className?: string
}

export function SelectLabel({ children, className }: SelectLabelProps) {
  return (
    <div className={cn('px-3 py-1.5 text-xs font-semibold text-zinc-500', className)}>
      {children}
    </div>
  )
}

// SelectSeparator
export function SelectSeparator() {
  return <div className="my-1 h-px bg-zinc-200 dark:bg-zinc-800" />
}
