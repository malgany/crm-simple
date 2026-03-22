"use client";

import type { LucideIcon } from "lucide-react";
import { LoaderCircle, LogOut, MoreHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type HeaderMenuItem = {
  icon: LucideIcon;
  label: string;
  onSelect: () => void;
};

type AppHeaderProps = {
  companyName: string | null;
  menuItems?: HeaderMenuItem[];
  roleLabel: string;
};

export function AppHeader({
  companyName,
  menuItems = [],
  roleLabel,
}: AppHeaderProps) {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const menuId = useId();
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const menuContentId = `${menuId}-content`;

  const closeMenu = (restoreFocus = false) => {
    setMenuOpen(false);

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
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
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
      className="surface-shadow flex items-center justify-between gap-4 rounded-[1.75rem] border border-white/60 px-5 py-4"
      style={{ background: "var(--header-surface)" }}
    >
      <p className="text-lg font-semibold uppercase tracking-[0.28em] text-[var(--primary)]">
        CRM
      </p>
      <div className="flex items-center gap-3">
        <p className="text-right text-sm font-medium text-[var(--muted-foreground)]">
          {companyName ? (
            <>
              {companyName} &middot; {roleLabel}
            </>
          ) : (
            roleLabel
          )}
        </p>
        <div className="relative" ref={menuRef}>
          <Button
            aria-controls={menuContentId}
            aria-expanded={menuOpen}
            aria-label="Menu"
            aria-haspopup="menu"
            className="h-10 rounded-full px-3 md:px-4"
            onClick={() => setMenuOpen((current) => !current)}
            ref={menuButtonRef}
            title="Menu"
            type="button"
            variant="outline"
          >
            <MoreHorizontal className="h-5 w-5" />
            <span className="hidden md:inline">Menu</span>
          </Button>
          {menuOpen ? (
            <div
              className="surface-shadow absolute right-0 top-[calc(100%+0.75rem)] z-20 w-72 rounded-[1.5rem] border border-white/70 p-3"
              id={menuContentId}
              role="menu"
              style={{ background: "var(--panel-surface)" }}
            >
              <div className="flex flex-col gap-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Button
                      className="w-full justify-start rounded-[1rem]"
                      key={item.label}
                      onClick={() => {
                        closeMenu();
                        item.onSelect();
                      }}
                      role="menuitem"
                      type="button"
                      variant="ghost"
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  );
                })}
                <Button
                  className="w-full justify-start rounded-[1rem]"
                  disabled={isSigningOut}
                  onClick={handleSignOut}
                  role="menuitem"
                  type="button"
                  variant="ghost"
                >
                  {isSigningOut ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="h-4 w-4" />
                  )}
                  Sair
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
