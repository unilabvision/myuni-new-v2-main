import React, { useState, useEffect } from "react";

export default function ThemeSwitcher() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Kullanıcı daha önce tema tercihi yapmışsa, tercihini yükle
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      localStorage.setItem("theme", "dark");
      document.documentElement.classList.add("dark");
    } else {
      localStorage.setItem("theme", "light");
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <div className="flex items-center justify-center space-x-2">
      <label htmlFor="theme-switcher" className="text-sm font-medium">
        Tema
      </label>
      <button
        id="theme-switcher"
        onClick={toggleTheme}
        className="flex items-center justify-center p-2 bg-gray-300 dark:bg-gray-700 rounded-full"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          className="w-5 h-5"
        >
          {isDarkMode ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 3v3m0 12v3m9-9h-3m-12 0H3"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5.121 19.879A9 9 0 1112 3a9 9 0 017.879 16.879M12 5a7 7 0 100 14 7 7 0 000-14z"
            />
          )}
        </svg>
      </button>
    </div>
  );
}
