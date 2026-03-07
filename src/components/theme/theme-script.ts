/**
 * Runs before React hydrates to avoid theme flash. Must stay in sync with ThemeProvider.
 */
export function themeInitScript() {
  return `
(function() {
  var key = "233plug-theme";
  var stored = localStorage.getItem(key);
  var theme = stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
  var effective = theme === "system"
    ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    : theme;
  document.documentElement.classList.add(effective);
})();
`.trim();
}
