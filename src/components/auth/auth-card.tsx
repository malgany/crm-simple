import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AuthCardProps = {
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function AuthCard({
  eyebrow,
  title,
  description,
  children,
  footer,
  className,
  contentClassName,
}: AuthCardProps) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="grid-pattern pointer-events-none absolute inset-0 opacity-60" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,rgba(20,94,99,0.18),transparent_60%)]" />
      <div
        className={cn(
          "surface-shadow relative w-full max-w-md rounded-[2rem] border border-white/60 bg-white/95 p-6 md:p-8",
          className,
        )}
      >
        <div className="mb-6 space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">
            {eyebrow}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            {title}
          </h1>
          {description ? (
            <p className="text-sm leading-6 text-slate-600">{description}</p>
          ) : null}
        </div>
        <div className={cn("space-y-6", contentClassName)}>{children}</div>
        {footer ? (
          <div className="mt-6 border-t border-[var(--border)] pt-4 text-sm text-slate-600">
            {footer}
          </div>
        ) : null}
      </div>
    </main>
  );
}
