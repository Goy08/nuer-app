import * as React from "react"

import { cn } from "@/lib/utils"

type InputProps = React.ComponentProps<"input"> & {
  label?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, id, ...props }, ref) => {
    const generatedId = React.useId()
    const inputId = id ?? generatedId
    const field = (
      <input
        id={inputId}
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )

    if (!label) return field

    return (
      <div className="space-y-1.5">
        <label htmlFor={inputId} className="text-sm font-medium text-stone-700">
          {label}
        </label>
        {field}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
