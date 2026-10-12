import { useState } from "react";
import { FaBell, FaBellSlash } from "react-icons/fa";
import { useAuth } from "../../context/auth";
import ToastHandler from "./ToastHandler";
import {
  disableNotifications,
  enableNotifications,
  notificationPermission,
  notificationsAvailable,
  notificationsEnabled,
} from "../../services/notifications";

export default function NotificationToggle() {
  const { user } = useAuth();
  const [enabled, setEnabled] = useState(() => notificationsEnabled(user));
  const [busy, setBusy] = useState(false);
  const available = notificationsAvailable();

  async function toggle() {
    if (busy) return;
    setBusy(true);
    try {
      if (enabled) {
        await disableNotifications(user);
        setEnabled(false);
        ToastHandler.success("Sales reminders turned off.");
      } else {
        await enableNotifications(user);
        setEnabled(true);
        ToastHandler.success("Sales reminders turned on.");
      }
    } catch (error) {
      ToastHandler.error(error.message || "Could not update notifications.");
    } finally {
      setBusy(false);
    }
  }

  const blocked = notificationPermission() === "denied";
  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy || !available || blocked}
      className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm text-indigo-100/75 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
      title={
        !available
          ? "Add VITE_FIREBASE_VAPID_KEY to enable notifications"
          : blocked
            ? "Notifications are blocked in this browser's settings"
            : undefined
      }
    >
      {enabled ? <FaBellSlash aria-hidden="true" /> : <FaBell aria-hidden="true" />}
      {busy
        ? "Updating reminders…"
        : enabled
          ? "Turn off reminders"
          : "Turn on reminders"}
    </button>
  );
}
