import React from "react"
import { cn } from "../../lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'outline' | 'ghost' | 'danger' | 'success';
    size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'default', size = 'md', ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={cn(
                    "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
                    {
                        'bg-gray-900 text-white hover:bg-gray-800': variant === 'default',
                        'border border-gray-300 bg-transparent hover:bg-gray-100 text-gray-900': variant === 'outline',
                        'bg-transparent hover:bg-gray-100 text-gray-900': variant === 'ghost',
                        'bg-red-600 text-white hover:bg-red-700': variant === 'danger',
                        'bg-green-600 text-white hover:bg-green-700': variant === 'success',
                        'h-9 px-3 text-sm': size === 'sm',
                        'h-10 py-2 px-4': size === 'md',
                        'h-11 px-8 text-lg': size === 'lg',
                    },
                    className
                )}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"
