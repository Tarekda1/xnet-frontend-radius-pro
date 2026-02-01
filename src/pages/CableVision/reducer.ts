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
};

export type CableVisionPageAction =
  | { type: "toggleExpanded"; accountId: number }
  | { type: "refreshStart" }
  | { type: "refreshStop" }
  | { type: "openCreateAccount" }
  | { type: "closeCreateAccount" }
  | { type: "setCreateAccountField"; field: keyof CableVisionPageState["createAccount"]; value: string }
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
  | { type: "setEditProfileField"; field: Exclude<keyof CableVisionPageState["editProfile"], "profileId">; value: string };

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
    default:
      return state;
  }
}

