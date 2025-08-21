import { useTheme } from '../contexts/ThemeContext';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return '☀️';
      case 'dark':
        return '🌙';
      default:
        return '💻';
    }
  };

  const cycleTheme = () => {
    const themes = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={cycleTheme}
        className="theme-toggle border rounded-xl px-3 py-2 bg-white dark:bg-gray-800 text-sm dark:text-white hover:shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105"
        title={`Current theme: ${theme}. Click to cycle through themes.`}
      >
        <span className="flex items-center gap-2">
          <span className="transition-transform duration-300 ease-in-out">
            {getThemeIcon()}
          </span>
          <span className="capitalize">{theme}</span>
        </span>
      </button>
    </div>
  );
}
