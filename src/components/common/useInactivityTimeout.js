import { useEffect } from "react";
export default function useInactivityTimeout(
  logout,
  enabled,
  timeout = 1200000,
) {
  useEffect(() => {
    if (!enabled) return;
    let lastActivity = Date.now();
    const recordActivity = () => {
      lastActivity = Date.now();
    };
    const events = [
      "pointerdown",
      "pointermove",
      "keydown",
      "touchstart",
      "scroll",
    ];
    events.forEach((event) =>
      window.addEventListener(event, recordActivity, { passive: true }),
    );
    const interval = window.setInterval(() => {
      if (Date.now() - lastActivity >= timeout) {
        lastActivity = Date.now();
        void logout();
      }
    }, 1000);
    return () => {
      window.clearInterval(interval);
      events.forEach((event) =>
        window.removeEventListener(event, recordActivity),
      );
    };
  }, [logout, enabled, timeout]);
}
