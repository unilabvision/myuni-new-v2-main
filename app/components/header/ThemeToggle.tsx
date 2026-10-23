import { Moon, Sun } from "lucide-react";

interface ThemeToggleProps {
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
}

export default function ThemeToggle({ isDarkMode, setIsDarkMode }: ThemeToggleProps) {
  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem("theme", newMode ? "dark" : "light");
    document.documentElement.classList.toggle("dark", newMode);
  };

  return (
    <button
      className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 transition-colors duration-200 hover:bg-neutral-100 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#990000] dark:text-gray-300 dark:hover:bg-neutral-800 dark:hover:text-primary"
      onClick={toggleTheme}
      aria-label={isDarkMode ? "Aydınlık mod" : "Karanlık mod"}
    >
      {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
