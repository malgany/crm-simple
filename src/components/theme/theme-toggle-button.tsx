"use client";

import { Moon, Sun } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useTheme } from "@/components/theme/theme-provider";

type ThemeToggleButtonProps = Omit<ButtonProps, "children" | "onClick"> & {
  compactLabel?: boolean;
};

export function ThemeToggleButton({
  className,
  compactLabel = false,
  size,
  variant = "outline",
  ...props
}: ThemeToggleButtonProps) {
  const { isMounted, theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const Icon = isDark ? Moon : Sun;
  const label = compactLabel
    ? isMounted
      ? `Tema ${isDark ? "escuro" : "claro"}`
      : "Tema"
    : "Alternar tema";

  return (
    <Button
      className={className}
      onClick={toggleTheme}
      size={size}
      type="button"
      variant={variant}
      {...props}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Button>
  );
}
