import { useCallback, useReducer } from "react";
import type { DunningRunResponse } from "@/api/invoices";
import type { DateRange } from "react-day-picker";
import type { RowSelectionState, Updater } from "@tanstack/react-table";
import {
  createExternalInvoicesPageInitialState,
  externalInvoicesPageReducer,
  type DunningActionType,
} from "./externalInvoicesPageReducer";

export function useExternalInvoicesPageState(defaultPageSize: number) {
  const [pageState, dispatch] = useReducer(
    externalInvoicesPageReducer,
    createExternalInvoicesPageInitialState(defaultPageSize)
  );

  const setSearchTerm = useCallback((value: string) => dispatch({ type: "SET_SEARCH_TERM", payload: value }), []);
  const setSearchInput = useCallback((value: string) => dispatch({ type: "SET_SEARCH_INPUT", payload: value }), []);
  const setPageSize = useCallback((value: number) => dispatch({ type: "SET_PAGE_SIZE", payload: value }), []);
  const setCurrentPage = useCallback((value: number) => dispatch({ type: "SET_CURRENT_PAGE", payload: value }), []);
  const setIsConfirmBulkPaidOpen = useCallback((value: boolean) => dispatch({ type: "SET_CONFIRM_BULK_PAID_OPEN", payload: value }), []);
  const setIsConfirmBulkDeleteOpen = useCallback((value: boolean) => dispatch({ type: "SET_CONFIRM_BULK_DELETE_OPEN", payload: value }), []);
  const setIsExportingAll = useCallback((value: boolean) => dispatch({ type: "SET_EXPORTING_ALL", payload: value }), []);
  const setIsBulkPaidInProgress = useCallback((value: boolean) => dispatch({ type: "SET_BULK_PAID_IN_PROGRESS", payload: value }), []);
  const setIsDateFilterOpen = useCallback((value: boolean) => dispatch({ type: "SET_DATE_FILTER_OPEN", payload: value }), []);
  const setIsDunningOpen = useCallback((value: boolean) => dispatch({ type: "SET_DUNNING_OPEN", payload: value }), []);
  const setDunningGraceDays = useCallback((value: number) => dispatch({ type: "SET_DUNNING_GRACE_DAYS", payload: value }), []);
  const setDunningMaxCount = useCallback((value: number) => dispatch({ type: "SET_DUNNING_MAX_COUNT", payload: value }), []);
  const setDunningMinAmount = useCallback((value: number) => dispatch({ type: "SET_DUNNING_MIN_AMOUNT", payload: value }), []);
  const setDunningDryRun = useCallback((value: boolean) => dispatch({ type: "SET_DUNNING_DRY_RUN", payload: value }), []);
  const setDunningAsOfDate = useCallback((value: string) => dispatch({ type: "SET_DUNNING_AS_OF_DATE", payload: value }), []);
  const setDunningSecondReminderDay = useCallback((value: number) => dispatch({ type: "SET_DUNNING_SECOND_REMINDER_DAY", payload: value }), []);
  const setDunningThrottleDay = useCallback((value: number) => dispatch({ type: "SET_DUNNING_THROTTLE_DAY", payload: value }), []);
  const setDunningSuspendDay = useCallback((value: number) => dispatch({ type: "SET_DUNNING_SUSPEND_DAY", payload: value }), []);
  const setDunningThrottleProfileId = useCallback((value: number) => dispatch({ type: "SET_DUNNING_THROTTLE_PROFILE_ID", payload: value }), []);
  const setDunningLastRun = useCallback((value: DunningRunResponse | null) => dispatch({ type: "SET_DUNNING_LAST_RUN", payload: value }), []);
  const setDraftDateRange = useCallback((value: DateRange | undefined) => dispatch({ type: "SET_DRAFT_DATE_RANGE", payload: value }), []);
  const incrementRefreshKey = useCallback(() => dispatch({ type: "INCREMENT_REFRESH_KEY" }), []);
  const setRowSelection = useCallback((updater: Updater<RowSelectionState>) => {
    dispatch({ type: "UPDATE_ROW_SELECTION", payload: updater });
  }, []);
  const toggleDunningAction = useCallback((action: DunningActionType, checked: boolean) => {
    dispatch({ type: "TOGGLE_DUNNING_ACTION", payload: { action, checked } });
  }, []);

  return {
    ...pageState,
    setSearchTerm,
    setSearchInput,
    setPageSize,
    setCurrentPage,
    setIsConfirmBulkPaidOpen,
    setIsConfirmBulkDeleteOpen,
    setIsExportingAll,
    setIsBulkPaidInProgress,
    setIsDateFilterOpen,
    setIsDunningOpen,
    setDunningGraceDays,
    setDunningMaxCount,
    setDunningMinAmount,
    setDunningDryRun,
    setDunningAsOfDate,
    setDunningSecondReminderDay,
    setDunningThrottleDay,
    setDunningSuspendDay,
    setDunningThrottleProfileId,
    setDunningLastRun,
    setDraftDateRange,
    incrementRefreshKey,
    setRowSelection,
    toggleDunningAction,
  };
}
