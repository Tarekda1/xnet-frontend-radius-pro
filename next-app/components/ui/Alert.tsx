import React, { useMemo, useReducer } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface AlertProps {
  type: 'success' | 'error' | 'info';
  message: string;
  onClose?: () => void;
}

export type FupAccountRow = {
  username: string;
  fullName?: string | null;
  profileName?: string | null;
};

type QuotaTableProps = {
  title: string;
  label: string;
  rows: FupAccountRow[];
  totalUsers?: number;
};

function QuotaTable({ title, label, rows, totalUsers }: QuotaTableProps) {
  const total = Array.isArray(rows) ? rows.length : 0;
  const pct =
    typeof totalUsers === "number" && totalUsers > 0
      ? Math.round((total / totalUsers) * 100)
      : null;

  return (
    <div className="space-y-2">
      <div className="font-semibold">{title}</div>
      <div className="text-sm">
        {total} account{total === 1 ? "" : "s"} exceeded in <span className="font-mono">{label}</span>
        {pct !== null ? <> ({pct}%)</> : null}.
      </div>

      {total > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-orange-200">
                <th className="py-2 text-left font-medium">Username</th>
                <th className="py-2 text-left font-medium">Name</th>
                <th className="py-2 text-left font-medium">Profile</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.username} className="border-b border-orange-200/60">
                  <td className="py-2 font-mono">{a.username}</td>
                  <td className="py-2">{a.fullName || "—"}</td>
                  <td className="py-2">{a.profileName || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-sm text-orange-700/80">No exceeded accounts found.</div>
      )}
    </div>
  );
}

export type QuotaExceededAlertProps = {
  /** YYYY-MM (or any label you want to display) */
  monthLabel: string;
  /** YYYY-MM-DD (or any label you want to display) */
  dayLabel: string;
  /** Monthly quota exceeded accounts */
  monthlyAccounts: FupAccountRow[];
  /** Daily quota exceeded accounts */
  dailyAccounts: FupAccountRow[];
  /** Optional: total users to compute percentage */
  totalUsers?: number;
  onClose?: () => void;
  className?: string;
  /** Show a small UI to toggle between monthly/daily/both and filter by username */
  showControls?: boolean;
};

type QuotaAlertState = {
  view: "both" | "monthly" | "daily";
  query: string;
};

type QuotaAlertAction =
  | { type: "setView"; view: QuotaAlertState["view"] }
  | { type: "setQuery"; query: string }
  | { type: "reset" };

const initialQuotaAlertState: QuotaAlertState = { view: "both", query: "" };

function quotaAlertReducer(state: QuotaAlertState, action: QuotaAlertAction): QuotaAlertState {
  switch (action.type) {
    case "setView":
      return { ...state, view: action.view };
    case "setQuery":
      return { ...state, query: action.query };
    case "reset":
      return initialQuotaAlertState;
    default:
      return state;
  }
}

/**
 * Alert panel to show BOTH:
 * - monthly quota exceeded accounts
 * - daily quota exceeded accounts
 */
export const QuotaExceededAlert: React.FC<QuotaExceededAlertProps> = ({
  monthLabel,
  dayLabel,
  monthlyAccounts,
  dailyAccounts,
  totalUsers,
  onClose,
  className,
  showControls = true,
}) => {
  const [state, dispatch] = useReducer(quotaAlertReducer, initialQuotaAlertState);

  const query = state.query.trim().toLowerCase();
  const filterRows = (rows: FupAccountRow[]) => {
    if (!query) return rows;
    return rows.filter((r) => {
      const u = String(r.username || "").toLowerCase();
      const n = String(r.fullName || "").toLowerCase();
      const p = String(r.profileName || "").toLowerCase();
      return u.includes(query) || n.includes(query) || p.includes(query);
    });
  };

  const monthlyFiltered = useMemo(() => filterRows(monthlyAccounts || []), [monthlyAccounts, query]);
  const dailyFiltered = useMemo(() => filterRows(dailyAccounts || []), [dailyAccounts, query]);

  return (
    <div
      className={[
        "border-l-4 p-4 bg-orange-100 border-orange-400 text-orange-800 relative",
        className || "",
      ].join(" ")}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1 space-y-4">
          {showControls ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className={`rounded border px-2 py-1 text-sm ${state.view === "both" ? "bg-card/85" : "bg-transparent"}`}
                  onClick={() => dispatch({ type: "setView", view: "both" })}
                >
                  Both
                </button>
                <button
                  type="button"
                  className={`text-sm px-2 py-1 rounded border ${state.view === "monthly" ? "bg-card/90" : "bg-transparent"}`}
                  onClick={() => dispatch({ type: "setView", view: "monthly" })}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  className={`rounded border px-2 py-1 text-sm ${state.view === "daily" ? "bg-card/85" : "bg-transparent"}`}
                  onClick={() => dispatch({ type: "setView", view: "daily" })}
                >
                  Daily
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  value={state.query}
                  onChange={(e) => dispatch({ type: "setQuery", query: e.target.value })}
                  placeholder="Filter…"
                  className="h-8 rounded border border-orange-200 bg-card/90 px-2 text-sm outline-none dark:border-orange-900/60"
                />
                {state.query.trim().length ? (
                  <button type="button" className="text-sm underline" onClick={() => dispatch({ type: "setQuery", query: "" })}>
                    Clear
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}

          {state.view !== "daily" ? (
            <QuotaTable title="Monthly quota exceeded" label={monthLabel} rows={monthlyFiltered} totalUsers={totalUsers} />
          ) : null}
          {state.view !== "monthly" ? (
            <div className={state.view === "both" ? "border-t border-orange-200/70 pt-4" : ""}>
              <QuotaTable title="Daily quota exceeded" label={dayLabel} rows={dailyFiltered} totalUsers={totalUsers} />
            </div>
          ) : null}
        </div>
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-0 right-0 mt-4 mr-4 text-orange-700/60 hover:text-orange-900"
          aria-label="Close"
        >
          <span className="text-2xl">&times;</span>
        </button>
      )}
    </div>
  );
};

export type QuotaExceededSummaryAlertProps = {
  monthLabel: string;
  dayLabel: string;
  monthlyCount: number;
  dailyCount: number;
  totalUsers?: number;
  onClose?: () => void;
  className?: string;
  detailHref?: string;
};

/**
 * Summary-only version (numbers only, no tables).
 * Useful for Dashboard.
 */
export const QuotaExceededSummaryAlert: React.FC<QuotaExceededSummaryAlertProps> = ({
  monthLabel,
  dayLabel,
  monthlyCount,
  dailyCount,
  totalUsers,
  onClose,
  className,
  detailHref,
}) => {
  const m = Number.isFinite(monthlyCount) ? monthlyCount : 0;
  const d = Number.isFinite(dailyCount) ? dailyCount : 0;

  const pct = (n: number) =>
    typeof totalUsers === "number" && totalUsers > 0 ? Math.round((n / totalUsers) * 100) : null;

  const mp = pct(m);
  const dp = pct(d);

  return (
    <div
      className={[
        "relative overflow-hidden rounded-xl border border-amber-200/80 bg-gradient-to-r from-amber-50 via-orange-50/90 to-amber-50 p-4 shadow-sm dark:border-amber-900/50 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-amber-950/40",
        className || "",
      ].join(" ")}
      role="alert"
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-amber-400/10 blur-2xl" />
      <div className="relative flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <div className="font-semibold text-amber-950 dark:text-amber-100">Quota exceeded</div>
            <p className="mt-0.5 text-sm text-amber-800/80 dark:text-amber-200/70">
              Users over their daily or monthly data limits.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg border border-amber-200/70 bg-background/70 p-3 backdrop-blur-sm dark:border-amber-900/40">
              <div className="text-xs font-medium text-muted-foreground">Monthly ({monthLabel})</div>
              <div className="mt-1 text-2xl font-bold tabular-nums text-foreground">
                {m}
                {mp !== null ? <span className="ml-2 text-sm font-medium text-muted-foreground">({mp}%)</span> : null}
              </div>
            </div>
            <div className="rounded-lg border border-amber-200/70 bg-background/70 p-3 backdrop-blur-sm dark:border-amber-900/40">
              <div className="text-xs font-medium text-muted-foreground">Daily ({dayLabel})</div>
              <div className="mt-1 text-2xl font-bold tabular-nums text-foreground">
                {d}
                {dp !== null ? <span className="ml-2 text-sm font-medium text-muted-foreground">({dp}%)</span> : null}
              </div>
            </div>
          </div>
          {detailHref ? (
            <a
              href={detailHref}
              className="inline-flex text-sm font-medium text-amber-800 underline-offset-4 hover:underline dark:text-amber-200"
            >
              View affected users
            </a>
          ) : null}
        </div>
      </div>

      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-md p-1 text-amber-700/60 transition-colors hover:bg-amber-500/10 hover:text-amber-900 dark:text-amber-300/70 dark:hover:text-amber-100"
          aria-label="Dismiss quota alert"
        >
          <span className="text-xl leading-none">&times;</span>
        </button>
      ) : null}
    </div>
  );
};

export type FupAccountsAlertProps = {
  /** YYYY-MM (or any label you want to display) */
  monthLabel: string;
  /** Users/accounts that are currently FUP exceeded for the given month */
  accounts: FupAccountRow[];
  /** Optional: total users to compute percentage */
  totalUsers?: number;
  onClose?: () => void;
  className?: string;
};

/**
 * Specialized alert panel to show FUP-exceeded accounts with simple stats.
 * Kept in this file so existing UI "Alert" stays reusable.
 */
export const FupAccountsAlert: React.FC<FupAccountsAlertProps> = ({
  monthLabel,
  accounts,
  totalUsers,
  onClose,
  className,
}) => {
  // Backward-compatible wrapper (FUP ~= monthly quota exceeded)
  return (
    <QuotaExceededAlert
      monthLabel={monthLabel}
      dayLabel={monthLabel}
      monthlyAccounts={accounts}
      dailyAccounts={[]}
      totalUsers={totalUsers}
      onClose={onClose}
      className={className}
      showControls={false}
    />
  );
};

const Alert: React.FC<AlertProps> = ({ type, message, onClose }) => {
  const alertClasses = {
    success: 'bg-green-100 border-green-400 text-green-700',
    error: 'bg-red-100 border-red-400 text-red-700',
    info: 'bg-blue-100 border-blue-400 text-blue-700',
  };

  const iconMap = {
    success: <CheckCircle className="h-5 w-5" />,
    error: <XCircle className="h-5 w-5" />,
    info: <AlertCircle className="h-5 w-5" />,
  };

  return (
    <div className={`border-l-4 p-4 ${alertClasses[type]} relative`} role="alert">
      <div className="flex items-center">
        <div className="mr-3">
          {iconMap[type]}
        </div>
        <p>{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-0 right-0 mt-4 mr-4 text-muted-foreground hover:text-foreground"
          aria-label="Close"
        >
          <span className="text-2xl">&times;</span>
        </button>
      )}
    </div>
  );
};

export default Alert;