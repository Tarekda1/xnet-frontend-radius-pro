import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { can, canAny } from "@/lib/permissions";
import { apiClient } from "@/api/client";

type CommandItem = {
  id: string;
  label: string;
  keywords?: string[];
  href?: string;
  action?: () => void;
  requiresAnyPerms?: string[];
  requiresPerm?: string;
  hint?: string;
};

export default function CommandPalette() {
  const nav = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const commands: CommandItem[] = useMemo(() => {
    const items: CommandItem[] = [
      { id: "nav.dashboard", label: "Go to Dashboard", href: "/dashboard", keywords: ["home"] },
      { id: "nav.liveSessions", label: "Go to Live Sessions", href: "/online-users", requiresAnyPerms: ["users.online.view", "reseller.users.view"] },
      { id: "nav.authFailures", label: "Go to Auth Failures", href: "/auth-failures", requiresAnyPerms: ["users.online.view", "reseller.users.view"] },
      { id: "nav.users", label: "Go to Users", href: "/users/list", requiresAnyPerms: ["users.view", "reseller.users.view"] },
      { id: "nav.profiles", label: "Go to Profiles", href: "/profiles/list", requiresPerm: "radius.profiles.view" },
      { id: "nav.nas", label: "Go to NAS", href: "/nas", requiresPerm: "radius.nas.view" },
      { id: "nav.access", label: "Go to Roles & Access", href: "/access", requiresPerm: "admin.access.manage" },
      { id: "nav.alerts", label: "Go to Alerts", href: "/alerts", requiresPerm: "admin.alerts.view" },
      { id: "nav.analytics", label: "Go to Analytics", href: "/analytics", requiresPerm: "admin.analytics.view" },
      { id: "nav.expenses", label: "Go to Expenses", href: "/expenses", requiresPerm: "admin.expenses.view" },
      { id: "nav.settings", label: "Go to Settings", href: "/settings" },
      { id: "nav.about", label: "Go to About", href: "/about" },
    ];

    return items.filter((c) => {
      if (c.requiresPerm && !can(user, c.requiresPerm)) return false;
      if (c.requiresAnyPerms && !canAny(user, c.requiresAnyPerms)) return false;
      return true;
    });
  }, [user]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => {
      const hay = [c.label, ...(c.keywords ?? [])].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [commands, query]);

  const canSearchUsers = canAny(user, ["users.view", "reseller.users.view"]);
  const userSearchQuery = query.trim();

  const userResultsQuery = useQuery({
    queryKey: ["commandPalette", "userSearch", userSearchQuery],
    queryFn: async () => {
      const resp = await apiClient.get("/radius/users/search", { params: { query: userSearchQuery } });
      const users = resp?.data?.data?.users ?? resp?.data?.data ?? [];
      return Array.isArray(users) ? users : [];
    },
    enabled: open && canSearchUsers && userSearchQuery.length >= 2,
    staleTime: 15_000,
  });

  const userMatches = useMemo(() => {
    const raw = (userResultsQuery.data ?? []) as any[];
    const names = raw
      .map((u) => String(u?.username ?? "").trim())
      .filter((u) => u.length > 0);
    return Array.from(new Set(names)).slice(0, 8);
  }, [userResultsQuery.data]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toLowerCase().includes("mac");
      const hotkey = isMac ? e.metaKey && e.key.toLowerCase() === "k" : e.ctrlKey && e.key.toLowerCase() === "k";
      if (hotkey) {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isAuthenticated]);

  // Close when route changes
  useEffect(() => {
    if (!open) return;
    setOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  if (!isAuthenticated) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-2">
            <span>Command Palette</span>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono">Ctrl+K</Badge>
              <Badge variant="secondary" className="text-xs">Search</Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command… (e.g. users, sessions, profiles)"
            autoFocus
          />

          <div className="max-h-[360px] overflow-auto rounded-md border">
            {open && canSearchUsers && userSearchQuery.length >= 2 ? (
              <div className="border-b bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                Searching users…
              </div>
            ) : null}

            {open && canSearchUsers && userMatches.length > 0 ? (
              <div className="border-b">
                <div className="px-3 py-2 text-xs font-medium text-muted-foreground">Users</div>
                <ul className="divide-y">
                  {userMatches.map((username) => (
                    <li key={`user:${username}`}>
                      <button
                        type="button"
                        className="w-full text-left p-3 hover:bg-accent/40 focus:bg-accent/40 outline-none"
                        onClick={() => {
                          setOpen(false);
                          setQuery("");
                          nav(`/users/${encodeURIComponent(username)}`);
                        }}
                      >
                        <div className="font-medium">{username}</div>
                        <div className="text-xs text-muted-foreground font-mono mt-1">/users/{encodeURIComponent(username)}</div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {filtered.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">No commands found.</div>
            ) : (
              <ul className="divide-y">
                {filtered.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      className="w-full text-left p-3 hover:bg-accent/40 focus:bg-accent/40 outline-none"
                      onClick={() => {
                        setOpen(false);
                        setQuery("");
                        if (c.action) c.action();
                        else if (c.href) nav(c.href);
                      }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-medium">{c.label}</div>
                        {c.hint ? <span className="text-xs text-muted-foreground">{c.hint}</span> : null}
                      </div>
                      {c.href ? <div className="text-xs text-muted-foreground font-mono mt-1">{c.href}</div> : null}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

