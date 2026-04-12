export interface User {
  id: number;
  username: string;
  profileId: number;
  freenight?: boolean | number | null;
  isFallback: number;
  isMonthlyExceeded: number;
  isDailyExceeded?: boolean;
  isMonthlyExceededComputed?: boolean;
  quotaResetDay: number;
  accountStatus: string;
  /** ISO 8601 — subscription / access expiry (RADIUS may move user to `expired` when past). */
  expiresAt?: string | null;
  /** Optional walled-garden framed IP for expired sessions (overrides RADIUS EXPIRY_FRAMED_IP). */
  expiryFramedIp?: string | null;
  macAddress: {
    macAddress: string;
  };
  password: {
    value: string;
  };
  profile: {
    id: number;
    profileName: string;
    dailyQuota: string;
    monthlyQuota: string;
  };
  userDetails: {
    fullName: string | null;
    address: string | null;
    phoneNumber: string | null;
    email: string | null;
  };
  isOnline: boolean;
  lastTimeActive?: string | null;
}

export type ExternalInvoice = {
    /** Database / API primary key */
    id: number;

    /** Account username this invoice belongs to */
    username: string;

    /** Customer’s full name */
    fullName: string;

    /** Contact e‑mail */
    email: string;

    /** Contact phone (E.164 or local) */
    phoneNumber: string;

    /** Customer’s billing address */
    address: string;

    /** Month being billed – ISO 8601 date string (“2025‑04‑01”) */
    billingMonth: string;

    /** Invoice amount in chosen currency (e.g. USD) */
    amount: number;

    /** Payment status */
    status: "paid" | "unpaid" | "pending";

    /** ISO date when invoice was generated */
    createdAt: string;

    /** ISO date when invoice was paid (null if unpaid) */
    paidAt: string | null;

    /** How payment was captured */
    paymentMethod?: "cash" | "pos" | "transfer" | "other" | "gateway" | null;

    /** Collector username for field collections */
    collectedBy?: string | null;

    /** Collected timestamp */
    collectedAt?: string | null;

    /** Cash is reconciled with ledger */
    cashReconciled?: boolean | 0 | 1 | "0" | "1" | null;

    /** Reconciliation actor */
    reconciledBy?: string | null;

    /** Reconciliation timestamp */
    reconciledAt?: string | null;

    /** Upstream provider, if relevant */
    provider?: string;

    /** Last invoice action marker */
    lastAction?: string | null;

    modifiedBy: string | null;
    modifiedAt?: string | null;
};

export type Expense = {
  id: number;
  title: string;
  category: string | null;
  amount: number;
  currency: string;
  expenseDate: string; // YYYY-MM-DD
  status: "paid" | "unpaid";
  notes: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export interface Nas {
  id: number;
  nasname: string;
  shortname: string;
  type: string;
  ports: number;
  secret: string;
  server: string;
  community: string;
  description: string;
  status: 'active' | 'down';
}

export type CableVisionInvoice = {
  id: number;
  accountId: number;
  profileId: number | null;
  amount: number;
  status: "paid" | "unpaid" | "pending";
  billingMonth: string; // YYYY-MM-01
  createdAt: string;
  paidAt: string | null;
  paymentMethod: "cash" | "pos" | "transfer" | "other" | null;
  collectedBy: string | null;
  collectedAt: string | null;
  cashReconciled: boolean;
  reconciledBy: string | null;
  reconciledAt: string | null;
};

export type CableVisionProfile = {
  id: number;
  accountId: number;
  profileIndex: number; // 1..5
  profileName: string;
  assignedTo: string | null;
  deviceId: string | null;
  monthlyFee: number;
  status: "active" | "inactive";
  currentInvoice?: CableVisionInvoice | null;
};

export type CableVisionAccount = {
  id: number;
  accountNumber: string;
  fullName: string;
  phoneNumber: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  status: "active" | "suspended" | "cancelled";
  createdAt: string;
  updatedAt: string;
  profiles?: CableVisionProfile[];
};

export interface UsersApiResponse {
  success: boolean;
  message: string;
  data: {
    totalUsers: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    users: User[];
  };
}

// ... existing types

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  password?: string;
  role: string;
  permissions?: string[];
  resellerId?: number | null;
  mustChangePassword?: boolean;
  isActive: number;
  createdAt: string;
  updatedAt: string;
  lastLogin: string | null;
}

export interface AuthUsersApiResponse {
  success: boolean;
  message: string;
  data: {
    users: AuthUser[];
    total: number;
    page: number;
    totalPages: number;
  };
}
