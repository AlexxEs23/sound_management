"use client";

import { useState, useEffect } from "react";
import { Atom } from "react-loading-indicators";

export default function SmartLoader() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  useEffect(() => {
    // deteksi preferensi sistem/browser
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    // update kalau user ubah mode
    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Atom
        color={isDarkMode ? "#32cd32" : "#000"} // 🧠 otomatis switch warna
        size="medium"
        text=""
        textColor=""
      />
    </div>
  );
}
