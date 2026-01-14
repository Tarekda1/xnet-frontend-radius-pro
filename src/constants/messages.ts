export const MESSAGES = {
  common: {
    saved: "Saved successfully.",
    saveFailed: "Save failed.",
    loaded: "Loaded successfully.",
    loadFailed: "Load failed.",
    deleted: "Deleted successfully.",
    deleteFailed: "Delete failed.",
    updated: "Updated successfully.",
    updateFailed: "Update failed.",
    created: "Created successfully.",
    createFailed: "Create failed.",
    actionFailed: "Action failed.",
  },

  validation: {
    titleRequired: "Title is required.",
    amountRequired: "Amount is required.",
    expenseDateRequired: "Expense date is required.",
    confirmDeleteExpense: "Delete this expense?",
    invalidUserId: "Enter a numeric userId.",
  },

  invoices: {
    external: {
      updated: "External invoice updated successfully.",
      paid: "External invoice marked as paid.",
      unpaid: "External invoice marked as unpaid.",
      reminderSent: "Reminder sent.",
    },
    monthlyGenerated: "Monthly invoices generation started.",
    paid: "Invoice marked as paid.",
  },

  externalInvoices: {
    viewSavedTitle: "View saved",
    markingPaidTitle: "Marking invoices as paid",
    exportedTitle: "Exported",
    deletedTitle: "Deleted",
    deleteFailedTitle: "Delete failed",
    partialDeleteTitle: "Some deletions failed",
  },

  invoiceUpload: {
    invalidFileTitle: "Invalid file type",
    invalidFileDescription: "Please upload an Excel file (.xlsx or .xls).",
    billingMonthRequiredTitle: "Select billing month",
    billingMonthRequiredDescription: "Please choose the billing month before uploading.",
    uploadSuccessTitle: "Upload successful",
    uploadSuccessDescription: "Your invoice has been uploaded successfully.",
    uploadFailedTitle: "Upload failed",
  },

  users: {
    refreshedTitle: "Users refreshed",
    refreshedDescription: "The users list has been updated.",
    exportSuccessTitle: "Export successful",
    exportEmptyTitle: "No data to export",
    exportEmptyDescription: "There are no users to export.",
    deleted: "User deleted successfully.",
    macReset: "MAC address reset successfully.",
  },

  onlineUsers: {
    refreshedTitle: "Users refreshed",
    refreshedDescription: "The online users list has been updated.",
    statusUpdatedTitle: "User status updated",
  },

  authUsers: {
    created: "Auth user created.",
    updated: "Auth user updated.",
    deleted: "Auth user deleted.",
  },

  profiles: {
    created: "Profile created.",
    updated: "Profile updated.",
    deleted: "Profile deleted.",
  },

  expenses: {
    created: "Expense created.",
    updated: "Expense updated.",
    deleted: "Expense deleted.",
  },

  alerts: {
    ruleCreated: "Alert rule created.",
    ruleUpdated: "Alert rule updated.",
    ruleDeleted: "Alert rule deleted.",
    acknowledged: "Alert acknowledged.",
    resolved: "Alert resolved.",
    settingsUpdated: "Alert settings updated.",
  },
} as const;

