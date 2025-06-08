export interface User {
  id: number;
  username: string;
  profileId: number;
  isFallback: number;
  isMonthlyExceeded: number;
  quotaResetDay: number;
  accountStatus: string;
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

    /** Upstream provider, if relevant */
    provider?: string;

    modifiedBy: string | null;
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
