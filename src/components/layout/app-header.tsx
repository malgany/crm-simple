"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ChevronLeft, ChevronRight, LoaderCircle, LogOut, Palette } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";
import { useTheme } from "@/components/theme/theme-provider";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

type HeaderMenuItem = {
  icon: LucideIcon;
  label: string;
  onSelect: () => void;
};

type AppHeaderProps = {
  accountEmail?: string | null;
  accountName?: string | null;
  className?: string;
  centerContent?: ReactNode;
  companyName: string | null;
  menuItems?: HeaderMenuItem[];
  roleLabel: string;
};

function getAvatarLabel(value: string | null | undefined) {
  const normalized = value?.trim() ?? "";

  if (!normalized) {
    return "??";
  }

  return normalized.slice(0, 2).toUpperCase();
}

export function AppHeader({
  accountEmail,
  accountName,
  className,
  centerContent,
  companyName,
  menuItems = [],
  roleLabel,
}: AppHeaderProps) {
  const router = useRouter();
  const { boardBackground, boardBackgroundOptions, setBoardBackground } = useTheme();
  const supabase = createBrowserSupabaseClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const [backgroundMenuOpen, setBackgroundMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const menuId = useId();
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const menuContentId = `${menuId}-content`;
  const avatarLabel = getAvatarLabel(accountName || roleLabel);
  const summaryLabel = roleLabel;

  const closeMenu = (restoreFocus = false) => {
    setMenuOpen(false);
    setBackgroundMenuOpen(false);

    if (restoreFocus) {
      requestAnimationFrame(() => menuButtonRef.current?.focus());
    }
  };

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
        setBackgroundMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setBackgroundMenuOpen(false);
        requestAnimationFrame(() => menuButtonRef.current?.focus());
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  const handleSignOut = async () => {
    closeMenu();
    setIsSigningOut(true);
    const { error } = await supabase.auth.signOut();
    setIsSigningOut(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    router.replace("/login");
    router.refresh();
  };

  return (
    <header
      className={cn(
        "surface-shadow flex min-h-12 flex-wrap items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] px-4 py-3 md:flex-nowrap md:justify-between md:py-0",
        className,
      )}
      style={{ background: "var(--header-surface)" }}
    >
      <Link
        className="shrink-0 cursor-pointer text-sm font-semibold uppercase tracking-[0.28em] text-[var(--primary)] transition-opacity hover:opacity-80 md:text-base"
        href="/"
      >
        Simple CRM
      </Link>
      <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-3 md:flex-nowrap">
        {centerContent ? (
          <div className="order-3 basis-full md:order-none md:basis-auto md:px-0">
            {centerContent}
          </div>
        ) : null}
        <p className="text-right text-xs font-medium text-[var(--muted-foreground)] md:text-sm">
          {summaryLabel}
        </p>
        <div className="relative" ref={menuRef}>
          <button
            aria-controls={menuContentId}
            aria-expanded={menuOpen}
            aria-label="Conta"
            aria-haspopup="menu"
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[var(--border)] bg-[var(--input-surface)] text-xs font-semibold tracking-[0.08em] text-[var(--foreground)] transition-[background-color,border-color,color] hover:bg-[var(--subtle-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            onClick={() =>
              setMenuOpen((current) => {
                const nextOpen = !current;

                if (!nextOpen) {
                  setBackgroundMenuOpen(false);
                }

                return nextOpen;
              })
            }
            ref={menuButtonRef}
            title="Conta"
            type="button"
          >
            {avatarLabel}
          </button>
          {menuOpen ? (
            <div
              className="surface-shadow absolute right-0 top-[calc(100%+0.5rem)] z-20 w-80 rounded-[0.9rem] border border-[var(--border)] p-0"
              id={menuContentId}
              role="menu"
              style={{ background: "var(--panel-surface)" }}
            >
              <div className="border-b border-[var(--border)] px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                  Conta
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[var(--primary)] text-sm font-semibold text-[var(--primary-foreground)]">
                    {avatarLabel}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--foreground)]">
                      {accountName ?? roleLabel}
                    </p>
                    <p className="truncate text-sm text-[var(--muted-foreground)]">
                      {accountEmail ?? companyName ?? roleLabel}
                    </p>
                  </div>
                </div>
              </div>
              <div className="px-2 py-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const menuItemButton = (
                    <button
                      className="flex w-full cursor-pointer items-center gap-3 rounded-[0.65rem] px-3 py-2.5 text-left text-sm font-medium text-[var(--foreground)] transition-[background-color,color] hover:bg-[var(--subtle-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                      key={item.label}
                      onClick={() => {
                        closeMenu();
                        item.onSelect();
                      }}
                      role="menuitem"
                      type="button"
                    >
                      <Icon className="h-4 w-4 text-[var(--muted-foreground)]" />
                      {item.label}
                    </button>
                  );

                  if (item.label !== "Alternar tema") {
                    return menuItemButton;
                  }

                  return (
                    <div className="relative" key={item.label}>
                      {menuItemButton}
                      <button
                        aria-expanded={backgroundMenuOpen}
                        aria-haspopup="menu"
                        className="flex w-full cursor-pointer items-center justify-between rounded-[0.65rem] px-3 py-2.5 text-left text-sm font-medium text-[var(--foreground)] transition-[background-color,color] hover:bg-[var(--subtle-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                        onClick={() => setBackgroundMenuOpen((current) => !current)}
                        role="menuitem"
                        type="button"
                      >
                        <span className="flex items-center gap-3">
                          <Palette className="h-4 w-4 text-[var(--muted-foreground)]" />
                          Background
                        </span>
                        <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)]" />
                      </button>
                      {backgroundMenuOpen ? (
                        <div
                          className="surface-shadow absolute right-[calc(100%+0.5rem)] top-[3rem] z-30 w-56 rounded-[0.9rem] border border-[var(--border)]"
                          role="menu"
                          style={{ background: "var(--panel-surface)" }}
                        >
                          <div className="border-b border-[var(--border)] px-4 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                              Background
                            </p>
                          </div>
                          <div className="grid grid-cols-3 gap-3 p-4">
                            {boardBackgroundOptions.map((option) => (
                              <button
                                aria-label={option.label}
                                className={cn(
                                  "h-11 w-11 cursor-pointer rounded-[0.7rem] border border-white/12 transition-[transform,border-color,box-shadow] hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
                                  boardBackground === option.id &&
                                  "border-white/40 ring-2 ring-[#669DF1]",
                                )}
                                key={option.id}
                                onClick={() => {
                                  setBoardBackground(option.id);
                                  setBackgroundMenuOpen(false);
                                }}
                                role="menuitem"
                                style={{ background: option.preview }}
                                title={option.label}
                                type="button"
                              />
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-[var(--border)] px-2 py-2">
                <button
                  className="flex w-full cursor-pointer items-center gap-3 rounded-[0.65rem] px-3 py-2.5 text-left text-sm font-medium text-[var(--foreground)] transition-[background-color,color] hover:bg-[var(--subtle-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                  disabled={isSigningOut}
                  onClick={handleSignOut}
                  role="menuitem"
                  type="button"
                >
                  {isSigningOut ? (
                    <LoaderCircle className="h-4 w-4 animate-spin text-[var(--muted-foreground)]" />
                  ) : (
                    <LogOut className="h-4 w-4 text-[var(--muted-foreground)]" />
                  )}
                  Fazer logout
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
