import { useEffect } from "react";

const useInactivityTimeout = (handleLogout, onTimeoutCallback, timeout = 1200000) => {
    useEffect(() => {
        let timeoutId;

        const resetTimeout = () => {
            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                handleLogout();
                onTimeoutCallback(); // Invoke the callback to handle navigation
            }, timeout);
        };

        const handleActivity = () => resetTimeout();

        window.addEventListener("mousemove", handleActivity);
        window.addEventListener("keydown", handleActivity);

        resetTimeout();

        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener("mousemove", handleActivity);
            window.removeEventListener("keydown", handleActivity);
        };
    }, [handleLogout, onTimeoutCallback, timeout]);
};

export default useInactivityTimeout;
