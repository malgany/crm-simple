import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        className={cn(
          "flex h-11 w-full rounded-2xl border border-[var(--border)] bg-[var(--input-surface)] px-4 text-sm text-[var(--foreground)] outline-none transition-shadow placeholder:text-[var(--muted-foreground)] focus:border-transparent focus:ring-2 focus:ring-[var(--ring)]",
          className,
        )}
        ref={ref}
        type={type}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";

export { Input };
