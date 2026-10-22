import type * as Native from './reminders';

export type { ReminderText } from './reminders';

/** Browsers cannot schedule a daily local notification; the setting is hidden on web. */
export const remindersSupported = false;

export const requestReminderPermission: typeof Native.requestReminderPermission = async () => false;
export const reminderPermitted: typeof Native.reminderPermitted = async () => false;
export const scheduleReminder: typeof Native.scheduleReminder = async () => {};
export const cancelReminder: typeof Native.cancelReminder = async () => {};
