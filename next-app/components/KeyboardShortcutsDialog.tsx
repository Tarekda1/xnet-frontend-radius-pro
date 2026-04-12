import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

function isTypingTarget(target: EventTarget | null) {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return Boolean(target.isContentEditable);
}

export const SHORTCUTS_OPEN_EVENT = "xnet:open-keyboard-shortcuts";

export default function KeyboardShortcutsDialog() {
  const { t } = useTranslation("common");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "?" || e.ctrlKey || e.metaKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;
      e.preventDefault();
      setOpen(true);
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(SHORTCUTS_OPEN_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(SHORTCUTS_OPEN_EVENT, onOpen);
    };
  }, []);

  const isMac = typeof navigator !== "undefined" && navigator.platform.toLowerCase().includes("mac");
  const mod = isMac ? "⌘" : "Ctrl";

  const rows: { label: string; keys: string }[] = [
    { label: t("shortcut_palette"), keys: `${mod} K` },
    { label: t("shortcut_help"), keys: "?" },
    { label: t("shortcut_close"), keys: "Esc" },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("shortcuts_title")}</DialogTitle>
          <DialogDescription>{t("shortcuts_subtitle")}</DialogDescription>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">{t("shortcuts_hint")}</p>
        <ul className="mt-2 divide-y rounded-md border">
          {rows.map((r) => (
            <li key={r.label} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
              <span>{r.label}</span>
              <Badge variant="outline" className="font-mono text-[11px]">
                {r.keys}
              </Badge>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
