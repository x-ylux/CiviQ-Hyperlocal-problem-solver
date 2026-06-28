import React, { useState, useEffect } from "react";
import { Wifi, WifiOff } from "lucide-react";

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div
      className={`fixed top-18 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-full shadow-lg transition-all duration-300 ${
        isOnline
          ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
          : "bg-amber-50 border border-amber-200 text-amber-800 animate-pulse"
      }`}
    >
      {isOnline ? (
        <>
          <Wifi className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-semibold">Online Sync Active</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4 text-amber-600" />
          <span className="text-xs font-semibold">Offline Mode (Local Drafts)</span>
        </>
      )}
    </div>
  );
}
