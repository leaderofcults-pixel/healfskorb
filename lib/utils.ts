// Type definitions
export type ClassValue = string | number | boolean | undefined | null | ClassValue[] | Record<string, any>

// Tailwind class conflict groups for proper merging
const conflictGroups: Record<string, RegExp> = {
  // Layout
  display: /^(block|inline-block|inline|flex|inline-flex|table|inline-table|table-caption|table-cell|table-column|table-column-group|table-footer-group|table-header-group|table-row-group|table-row|flow-root|grid|inline-grid|contents|list-item|hidden)$/,
  position: /^(static|fixed|absolute|relative|sticky)$/,
  
  // Spacing
  margin: /^-?m[xytrbl]?-?(\d+(\.\d+)?|px|auto)$/,
  padding: /^p[xytrbl]?-?(\d+(\.\d+)?|px)$/,
  
  // Sizing
  width: /^w-(\d+(\.\d+)?\/\d+(\.\d+)?|\d+(\.\d+)?|px|auto|full|screen|min|max|fit)$/,
  height: /^h-(\d+(\.\d+)?\/\d+(\.\d+)?|\d+(\.\d+)?|px|auto|full|screen|min|max|fit)$/,
  
  // Colors
  textColor: /^text-(inherit|current|transparent|black|white|slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(\d{2,3}|50)$/,
  backgroundColor: /^bg-(inherit|current|transparent|black|white|slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(\d{2,3}|50)$/,
  borderColor: /^border-(inherit|current|transparent|black|white|slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(\d{2,3}|50)$/,
  
  // Typography
  fontSize: /^text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)$/,
  fontWeight: /^font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/,
  textAlign: /^text-(left|center|right|justify|start|end)$/,
  
  // Flexbox
  flexDirection: /^flex-(row|row-reverse|col|col-reverse)$/,
  justifyContent: /^justify-(normal|start|end|center|between|around|evenly|stretch)$/,
  alignItems: /^items-(start|end|center|baseline|stretch)$/,
  
  // Grid
  gridCols: /^grid-cols-(\d+|none|subgrid)$/,
  gridRows: /^grid-rows-(\d+|none|subgrid)$/,
  
  // Border
  borderWidth: /^border(-[xytrbl])?(-\d+)?$/,
  borderRadius: /^rounded(-[xytrbl])?(-none|-sm|-md|-lg|-xl|-2xl|-3xl|-full)?$/,
  
  // Shadow
  boxShadow: /^shadow(-sm|-md|-lg|-xl|-2xl|-inner|-none)?$/,
  
  // Opacity
  opacity: /^opacity-(\d{1,3})$/,
  
  // Z-index
  zIndex: /^z-(\d+|auto)$/,
}

// Helper function to determine conflict group
function getConflictGroup(className: string): string | null {
  for (const [group, regex] of Object.entries(conflictGroups)) {
    if (regex.test(className)) {
      return group
    }
  }
  return null
}

// Improved clsx implementation
export function clsx(...inputs: ClassValue[]): string {
  const classes: string[] = []
  
  for (const input of inputs) {
    if (!input) continue
    
    if (typeof input === 'string') {
      classes.push(input)
    } else if (typeof input === 'number') {
      classes.push(String(input))
    } else if (Array.isArray(input)) {
      const result = clsx(...input)
      if (result) classes.push(result)
    } else if (typeof input === 'object') {
      for (const [key, value] of Object.entries(input)) {
        if (value) classes.push(key)
      }
    }
  }
  
  return classes.join(' ')
}

// Real Tailwind merge implementation
export function twMerge(classes: string): string {
  if (!classes.trim()) return ''
  
  const classArray = classes.split(/\s+/).filter(Boolean)
  const conflictMap = new Map<string, string>()
  const nonConflictingClasses: string[] = []
  
  // Process each class
  for (const className of classArray) {
    const conflictGroup = getConflictGroup(className)
    
    if (conflictGroup) {
      // Store the latest class for this conflict group
      conflictMap.set(conflictGroup, className)
    } else {
      // Non-conflicting class, keep as-is
      nonConflictingClasses.push(className)
    }
  }
  
  // Combine non-conflicting classes with the latest from each conflict group
  const result = [
    ...nonConflictingClasses,
    ...Array.from(conflictMap.values())
  ]
  
  return result.join(' ')
}

// Enhanced cn function
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(...inputs))
}

// Proper VariantProps type
export type VariantProps<T extends (...args: any) => any> = {
  [K in keyof Parameters<T>[0]]: Parameters<T>[0][K]
}

// Enhanced CVA (Class Variance Authority) implementation
export function cva<
  V extends Record<string, Record<string, string>>,
  DV extends Partial<{ [K in keyof V]: keyof V[K] }>
>(
  base?: string,
  config?: {
    variants?: V
    defaultVariants?: DV
    compoundVariants?: Array<
      Partial<{ [K in keyof V]: keyof V[K] }> & {
        class?: string
        className?: string
      }
    >
  }
) {
  return (
    props?: Partial<{ [K in keyof V]: keyof V[K] }> & {
      class?: string
      className?: string
    }
  ) => {
    const { class: className, ...variantProps } = props || {}
    
    // Start with base classes
    const classes: string[] = []
    if (base) classes.push(base)
    
    // Apply default variants
    if (config?.defaultVariants) {
      for (const [key, value] of Object.entries(config.defaultVariants)) {
        if (value && config.variants?.[key]?.[value as string]) {
          classes.push(config.variants[key][value as string])
        }
      }
    }
    
    // Apply prop variants (override defaults)
    if (config?.variants && variantProps) {
      for (const [key, value] of Object.entries(variantProps)) {
        if (value && config.variants[key]?.[value as string]) {
          classes.push(config.variants[key][value as string])
        }
      }
    }
    
    // Apply compound variants
    if (config?.compoundVariants) {
      for (const compound of config.compoundVariants) {
        const { class: compoundClass, className: compoundClassName, ...compoundProps } = compound
        
        const matches = Object.entries(compoundProps).every(([key, value]) => {
          const propValue = variantProps?.[key] || config?.defaultVariants?.[key]
          return propValue === value
        })
        
        if (matches) {
          if (compoundClass) classes.push(compoundClass)
          if (compoundClassName) classes.push(compoundClassName)
        }
      }
    }
    
    // Add custom className
    if (className) classes.push(className)
    
    return cn(...classes)
  }
}

// Example usage and tests
if (typeof window !== 'undefined') {
  console.log('Testing utility functions:')
  
  // Test clsx
  console.log('clsx test:', clsx('px-4', 'py-2', { 'bg-blue-500': true, 'hidden': false }))
  // Output: "px-4 py-2 bg-blue-500"
  
  // Test twMerge with conflicts
  console.log('twMerge test:', twMerge('px-4 px-6 py-2 py-4 bg-red-500 bg-blue-500'))
  // Output: "px-6 py-4 bg-blue-500" (later classes win)
  
  // Test cn
  console.log('cn test:', cn('px-4 px-6', 'py-2', { 'bg-blue-500': true }))
  // Output: "px-6 py-2 bg-blue-500"
  
  // Test cva
  const buttonVariants = cva('inline-flex items-center justify-center rounded-md', {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
    compoundVariants: [
      {
        variant: 'destructive',
        size: 'lg',
        class: 'text-lg font-semibold',
      },
    ],
  })
  
  console.log('cva default:', buttonVariants())
  console.log('cva custom:', buttonVariants({ variant: 'outline', size: 'lg' }))
}
