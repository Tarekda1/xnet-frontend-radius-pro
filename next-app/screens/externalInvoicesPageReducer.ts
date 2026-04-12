import type { DunningRunResponse } from "@/api/invoices";
import type { RowSelectionState, Updater } from "@tanstack/react-table";
import type { DateRange } from "react-day-picker";

export type DunningActionType = "remind" | "throttle" | "suspend";

export type ExternalInvoicesPageState = {
  searchTerm: string;
  searchInput: string;
  refreshKey: number;
  rowSelection: RowSelectionState;
  pageSize: number;
  currentPage: number;
  isConfirmBulkPaidOpen: boolean;
  isConfirmBulkDeleteOpen: boolean;
  isExportingAll: boolean;
  isBulkPaidInProgress: boolean;
  isDateFilterOpen: boolean;
  isDunningOpen: boolean;
  dunningGraceDays: number;
  dunningMaxCount: number;
  dunningMinAmount: number;
  dunningDryRun: boolean;
  dunningActionFilter: DunningActionType[];
  dunningAsOfDate: string;
  dunningSecondReminderDay: number;
  dunningThrottleDay: number;
  dunningSuspendDay: number;
  dunningThrottleProfileId: number;
  dunningLastRun: DunningRunResponse | null;
  draftDateRange: DateRange | undefined;
};

export type ExternalInvoicesPageAction =
  | { type: "SET_SEARCH_TERM"; payload: string }
  | { type: "SET_SEARCH_INPUT"; payload: string }
  | { type: "INCREMENT_REFRESH_KEY" }
  | { type: "UPDATE_ROW_SELECTION"; payload: Updater<RowSelectionState> }
  | { type: "SET_PAGE_SIZE"; payload: number }
  | { type: "SET_CURRENT_PAGE"; payload: number }
  | { type: "SET_CONFIRM_BULK_PAID_OPEN"; payload: boolean }
  | { type: "SET_CONFIRM_BULK_DELETE_OPEN"; payload: boolean }
  | { type: "SET_EXPORTING_ALL"; payload: boolean }
  | { type: "SET_BULK_PAID_IN_PROGRESS"; payload: boolean }
  | { type: "SET_DATE_FILTER_OPEN"; payload: boolean }
  | { type: "SET_DUNNING_OPEN"; payload: boolean }
  | { type: "SET_DUNNING_GRACE_DAYS"; payload: number }
  | { type: "SET_DUNNING_MAX_COUNT"; payload: number }
  | { type: "SET_DUNNING_MIN_AMOUNT"; payload: number }
  | { type: "SET_DUNNING_DRY_RUN"; payload: boolean }
  | { type: "SET_DUNNING_ACTION_FILTER"; payload: DunningActionType[] }
  | { type: "TOGGLE_DUNNING_ACTION"; payload: { action: DunningActionType; checked: boolean } }
  | { type: "SET_DUNNING_AS_OF_DATE"; payload: string }
  | { type: "SET_DUNNING_SECOND_REMINDER_DAY"; payload: number }
  | { type: "SET_DUNNING_THROTTLE_DAY"; payload: number }
  | { type: "SET_DUNNING_SUSPEND_DAY"; payload: number }
  | { type: "SET_DUNNING_THROTTLE_PROFILE_ID"; payload: number }
  | { type: "SET_DUNNING_LAST_RUN"; payload: DunningRunResponse | null }
  | { type: "SET_DRAFT_DATE_RANGE"; payload: DateRange | undefined };

export const createExternalInvoicesPageInitialState = (defaultPageSize: number): ExternalInvoicesPageState => ({
  searchTerm: "",
  searchInput: "",
  refreshKey: 0,
  rowSelection: {},
  pageSize: defaultPageSize,
  currentPage: 1,
  isConfirmBulkPaidOpen: false,
  isConfirmBulkDeleteOpen: false,
  isExportingAll: false,
  isBulkPaidInProgress: false,
  isDateFilterOpen: false,
  isDunningOpen: false,
  dunningGraceDays: 7,
  dunningMaxCount: 100,
  dunningMinAmount: 0,
  dunningDryRun: true,
  dunningActionFilter: ["remind", "throttle", "suspend"],
  dunningAsOfDate: "",
  dunningSecondReminderDay: 3,
  dunningThrottleDay: 7,
  dunningSuspendDay: 14,
  dunningThrottleProfileId: 0,
  dunningLastRun: null,
  draftDateRange: undefined,
});

export function externalInvoicesPageReducer(
  state: ExternalInvoicesPageState,
  action: ExternalInvoicesPageAction
): ExternalInvoicesPageState {
  switch (action.type) {
    case "SET_SEARCH_TERM":
      return { ...state, searchTerm: action.payload };
    case "SET_SEARCH_INPUT":
      return { ...state, searchInput: action.payload };
    case "INCREMENT_REFRESH_KEY":
      return { ...state, refreshKey: state.refreshKey + 1 };
    case "UPDATE_ROW_SELECTION":
      return {
        ...state,
        rowSelection:
          typeof action.payload === "function"
            ? action.payload(state.rowSelection)
            : action.payload,
      };
    case "SET_PAGE_SIZE":
      return { ...state, pageSize: action.payload };
    case "SET_CURRENT_PAGE":
      return { ...state, currentPage: action.payload };
    case "SET_CONFIRM_BULK_PAID_OPEN":
      return { ...state, isConfirmBulkPaidOpen: action.payload };
    case "SET_CONFIRM_BULK_DELETE_OPEN":
      return { ...state, isConfirmBulkDeleteOpen: action.payload };
    case "SET_EXPORTING_ALL":
      return { ...state, isExportingAll: action.payload };
    case "SET_BULK_PAID_IN_PROGRESS":
      return { ...state, isBulkPaidInProgress: action.payload };
    case "SET_DATE_FILTER_OPEN":
      return { ...state, isDateFilterOpen: action.payload };
    case "SET_DUNNING_OPEN":
      return { ...state, isDunningOpen: action.payload };
    case "SET_DUNNING_GRACE_DAYS":
      return { ...state, dunningGraceDays: action.payload };
    case "SET_DUNNING_MAX_COUNT":
      return { ...state, dunningMaxCount: action.payload };
    case "SET_DUNNING_MIN_AMOUNT":
      return { ...state, dunningMinAmount: action.payload };
    case "SET_DUNNING_DRY_RUN":
      return { ...state, dunningDryRun: action.payload };
    case "SET_DUNNING_ACTION_FILTER":
      return { ...state, dunningActionFilter: action.payload };
    case "TOGGLE_DUNNING_ACTION": {
      const { action: dunningAction, checked } = action.payload;
      if (checked) {
        return {
          ...state,
          dunningActionFilter: Array.from(new Set([...state.dunningActionFilter, dunningAction])),
        };
      }
      return {
        ...state,
        dunningActionFilter: state.dunningActionFilter.filter((a) => a !== dunningAction),
      };
    }
    case "SET_DUNNING_AS_OF_DATE":
      return { ...state, dunningAsOfDate: action.payload };
    case "SET_DUNNING_SECOND_REMINDER_DAY":
      return { ...state, dunningSecondReminderDay: action.payload };
    case "SET_DUNNING_THROTTLE_DAY":
      return { ...state, dunningThrottleDay: action.payload };
    case "SET_DUNNING_SUSPEND_DAY":
      return { ...state, dunningSuspendDay: action.payload };
    case "SET_DUNNING_THROTTLE_PROFILE_ID":
      return { ...state, dunningThrottleProfileId: action.payload };
    case "SET_DUNNING_LAST_RUN":
      return { ...state, dunningLastRun: action.payload };
    case "SET_DRAFT_DATE_RANGE":
      return { ...state, draftDateRange: action.payload };
    default:
      return state;
  }
}
