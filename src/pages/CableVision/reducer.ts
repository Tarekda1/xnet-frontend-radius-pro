export type CableVisionPageState = {
  expandedAccountId: number | null;
  isRefreshing: boolean;

  isCreateAccountOpen: boolean;
  createAccount: {
    accountNumber: string;
    fullName: string;
    phone: string;
    email: string;
  };

  isEditAccountOpen: boolean;
  editAccount: {
    accountId: number | null;
    accountNumber: string;
    fullName: string;
    phone: string;
    email: string;
  };

  isDeleteAccountOpen: boolean;
  deleteAccount: {
    accountId: number | null;
    accountNumber: string;
    fullName: string;
  };

  isAddProfileOpen: boolean;
  addProfile: {
    accountId: number | null;
    profileName: string;
    assignedTo: string;
    deviceId: string;
    monthlyFee: string;
  };

  isEditProfileOpen: boolean;
  editProfile: {
    profileId: number | null;
    profileName: string;
    assignedTo: string;
    deviceId: string;
    monthlyFee: string;
    status: "active" | "inactive";
  };

  isDeleteProfileOpen: boolean;
  deleteProfile: {
    profileId: number | null;
    profileName: string;
  };
};

export type CableVisionPageAction =
  | { type: "toggleExpanded"; accountId: number }
  | { type: "refreshStart" }
  | { type: "refreshStop" }
  | { type: "openCreateAccount" }
  | { type: "closeCreateAccount" }
  | { type: "setCreateAccountField"; field: keyof CableVisionPageState["createAccount"]; value: string }
  | {
      type: "openEditAccount";
      account: { accountId: number; accountNumber: string; fullName: string; phone: string | null; email: string | null };
    }
  | { type: "closeEditAccount" }
  | { type: "setEditAccountField"; field: Exclude<keyof CableVisionPageState["editAccount"], "accountId">; value: string }
  | { type: "openDeleteAccount"; account: { accountId: number; accountNumber: string; fullName: string } }
  | { type: "closeDeleteAccount" }
  | { type: "openAddProfile"; accountId: number }
  | { type: "closeAddProfile" }
  | { type: "setAddProfileField"; field: Exclude<keyof CableVisionPageState["addProfile"], "accountId">; value: string }
  | {
      type: "openEditProfile";
      profile: {
        profileId: number;
        profileName: string;
        assignedTo: string | null;
        deviceId: string | null;
        monthlyFee: number;
        status: "active" | "inactive";
      };
    }
  | { type: "closeEditProfile" }
  | { type: "setEditProfileField"; field: Exclude<keyof CableVisionPageState["editProfile"], "profileId">; value: string }
  | { type: "openDeleteProfile"; profile: { profileId: number; profileName: string } }
  | { type: "closeDeleteProfile" };

export const initialCableVisionPageState: CableVisionPageState = {
  expandedAccountId: null,
  isRefreshing: false,

  isCreateAccountOpen: false,
  createAccount: {
    accountNumber: "",
    fullName: "",
    phone: "",
    email: "",
  },

  isEditAccountOpen: false,
  editAccount: {
    accountId: null,
    accountNumber: "",
    fullName: "",
    phone: "",
    email: "",
  },

  isDeleteAccountOpen: false,
  deleteAccount: {
    accountId: null,
    accountNumber: "",
    fullName: "",
  },

  isAddProfileOpen: false,
  addProfile: {
    accountId: null,
    profileName: "",
    assignedTo: "",
    deviceId: "",
    monthlyFee: "0",
  },

  isEditProfileOpen: false,
  editProfile: {
    profileId: null,
    profileName: "",
    assignedTo: "",
    deviceId: "",
    monthlyFee: "0",
    status: "active",
  },

  isDeleteProfileOpen: false,
  deleteProfile: {
    profileId: null,
    profileName: "",
  },
};

export function cableVisionPageReducer(state: CableVisionPageState, action: CableVisionPageAction): CableVisionPageState {
  switch (action.type) {
    case "toggleExpanded": {
      return {
        ...state,
        expandedAccountId: state.expandedAccountId === action.accountId ? null : action.accountId,
      };
    }
    case "refreshStart": {
      return { ...state, isRefreshing: true };
    }
    case "refreshStop": {
      return { ...state, isRefreshing: false };
    }
    case "openCreateAccount": {
      return { ...state, isCreateAccountOpen: true };
    }
    case "closeCreateAccount": {
      return {
        ...state,
        isCreateAccountOpen: false,
        createAccount: { accountNumber: "", fullName: "", phone: "", email: "" },
      };
    }
    case "setCreateAccountField": {
      return { ...state, createAccount: { ...state.createAccount, [action.field]: action.value } };
    }
    case "openEditAccount": {
      return {
        ...state,
        isEditAccountOpen: true,
        editAccount: {
          accountId: action.account.accountId,
          accountNumber: action.account.accountNumber,
          fullName: action.account.fullName,
          phone: action.account.phone || "",
          email: action.account.email || "",
        },
      };
    }
    case "closeEditAccount": {
      return {
        ...state,
        isEditAccountOpen: false,
        editAccount: { accountId: null, accountNumber: "", fullName: "", phone: "", email: "" },
      };
    }
    case "setEditAccountField": {
      return { ...state, editAccount: { ...state.editAccount, [action.field]: action.value } };
    }
    case "openDeleteAccount": {
      return {
        ...state,
        isDeleteAccountOpen: true,
        deleteAccount: {
          accountId: action.account.accountId,
          accountNumber: action.account.accountNumber,
          fullName: action.account.fullName,
        },
      };
    }
    case "closeDeleteAccount": {
      return { ...state, isDeleteAccountOpen: false, deleteAccount: { accountId: null, accountNumber: "", fullName: "" } };
    }
    case "openAddProfile": {
      return {
        ...state,
        isAddProfileOpen: true,
        addProfile: {
          accountId: action.accountId,
          profileName: "",
          assignedTo: "",
          deviceId: "",
          monthlyFee: "0",
        },
      };
    }
    case "closeAddProfile": {
      return {
        ...state,
        isAddProfileOpen: false,
        addProfile: { accountId: null, profileName: "", assignedTo: "", deviceId: "", monthlyFee: "0" },
      };
    }
    case "setAddProfileField": {
      return { ...state, addProfile: { ...state.addProfile, [action.field]: action.value } };
    }
    case "openEditProfile": {
      return {
        ...state,
        isEditProfileOpen: true,
        editProfile: {
          profileId: action.profile.profileId,
          profileName: action.profile.profileName,
          assignedTo: action.profile.assignedTo || "",
          deviceId: action.profile.deviceId || "",
          monthlyFee: String(action.profile.monthlyFee ?? 0),
          status: action.profile.status || "active",
        },
      };
    }
    case "closeEditProfile": {
      return {
        ...state,
        isEditProfileOpen: false,
        editProfile: { profileId: null, profileName: "", assignedTo: "", deviceId: "", monthlyFee: "0", status: "active" },
      };
    }
    case "setEditProfileField": {
      // status is stored as string too; caller must pass "active"/"inactive"
      return { ...state, editProfile: { ...state.editProfile, [action.field]: action.value as any } };
    }
    case "openDeleteProfile": {
      return {
        ...state,
        isDeleteProfileOpen: true,
        deleteProfile: {
          profileId: action.profile.profileId,
          profileName: action.profile.profileName,
        },
      };
    }
    case "closeDeleteProfile": {
      return { ...state, isDeleteProfileOpen: false, deleteProfile: { profileId: null, profileName: "" } };
    }
    default:
      return state;
  }
}

