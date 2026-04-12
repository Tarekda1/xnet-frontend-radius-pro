"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { applyTheme, getThemeIsDark } from "@/lib/theme";
import { cn } from "@/lib/utils";

type Props = {
  /** @deprecated Layout is handled by the button; pass only `className` for margin/size tweaks. */
  className?: string;
  /** Compact icon-only (e.g. mobile). */
  compact?: boolean;
};

const DarkModeToggle: React.FC<Props> = ({ className, compact }) => {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(getThemeIsDark());
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    applyTheme(next);
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn(
        "h-9 shrink-0 gap-2 border-border/90 bg-background/90 px-3 text-muted-foreground shadow-sm",
        "backdrop-blur-sm transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        "dark:border-border/60 dark:bg-card/80 dark:hover:bg-accent",
        compact ? "w-9 px-0" : undefined,
        className
      )}
      onClick={toggle}
      aria-pressed={dark}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {dark ? <Sun className="h-4 w-4 shrink-0 text-amber-500" /> : <Moon className="h-4 w-4 shrink-0 text-indigo-500" />}
      {!compact ? (
        <span className="hidden text-xs font-medium sm:inline">{dark ? "Light" : "Dark"}</span>
      ) : null}
    </Button>
  );
};

export default DarkModeToggle;
