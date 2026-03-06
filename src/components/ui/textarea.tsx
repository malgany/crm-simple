import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-28 w-full rounded-3xl border border-[var(--border)] bg-white/95 px-4 py-3 text-sm text-[var(--foreground)] outline-none transition-shadow placeholder:text-slate-400 focus:border-transparent focus:ring-2 focus:ring-[var(--ring)]",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});

Textarea.displayName = "Textarea";

export { Textarea };
