// Automatic theme detection based on system preferences

function setTheme(themeName) {
  // Remove any existing theme classes
  document.documentElement.className = "";

  // Add the specified theme class
  if (themeName !== "default") {
    document.documentElement.classList.add(themeName);
  }
}

// Function to check system preference and apply theme
function applySystemTheme() {
  // Check if user prefers dark mode
  const prefersDarkMode = window.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches;

  // Apply appropriate theme
  if (prefersDarkMode) {
    setTheme("dark-theme");
    console.log("Applied dark theme based on system preference");
  } else {
    setTheme("default");
    console.log("Applied light theme based on system preference");
  }
}

// Initialize theme on page load
document.addEventListener("DOMContentLoaded", function () {
  // Always use system preference - removed saved preference logic
  applySystemTheme();

  // Listen for system theme changes
  const darkModeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

  // Modern browsers support addEventListener on mediaQueryList
  try {
    darkModeMediaQuery.addEventListener("change", (e) => {
      if (e.matches) {
        setTheme("dark-theme");
      } else {
        setTheme("default");
      }
    });
  } catch (e) {
    // Fallback for older browsers that don't support addEventListener on mediaQueryList
    darkModeMediaQuery.addListener((e) => {
      if (e.matches) {
        setTheme("dark-theme");
      } else {
        setTheme("default");
      }
    });
  }
});
