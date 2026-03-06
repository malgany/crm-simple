"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-2xl border text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      size: {
        default: "h-11 px-4 py-2",
        icon: "h-10 w-10",
        lg: "h-12 px-5 py-3",
        sm: "h-9 px-3 py-2 text-xs",
      },
      variant: {
        default:
          "border-transparent bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[#0f4f53]",
        danger:
          "border-transparent bg-[var(--danger)] text-white hover:bg-[#a12f27]",
        ghost:
          "border-transparent bg-transparent text-[var(--foreground)] hover:bg-slate-900/5",
        outline:
          "border-[var(--border)] bg-white/80 text-[var(--foreground)] hover:bg-white",
        secondary:
          "border-transparent bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-[#dce8dd]",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ asChild = false, className, size, variant, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(buttonVariants({ className, size, variant }))}
        ref={ref}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";

export { Button, buttonVariants };
