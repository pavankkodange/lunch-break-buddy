import * as React from "react"

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={`rounded-xl border bg-card text-card-foreground shadow ${className}`} {...props} />
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props} />
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
    return <h3 className={`font-semibold leading-none tracking-tight ${className}`} {...props} />
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={`p-6 pt-0 ${className}`} {...props} />
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            className={`flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
            {...props}
        />
    )
}

export function Button({ className, variant, size, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string, size?: string }) {
    return (
        <button
            className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2 ${className}`}
            {...props}
        />
    )
}

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
    return (
        <label
            className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}
            {...props}
        />
    )
}
