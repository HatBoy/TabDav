/**
 * Theme Composable
 * Vue 3 composable for theme management
 */

import { ref } from 'vue';
import { THEMES, getThemeColors } from './themeConfig';
import { applyTheme, saveTheme, loadTheme, onThemeChange } from './themeService';

// Global state (shared across all components that use useTheme)
const currentTheme = ref<string>('blue');
const isInitialized = ref(false);

/**
 * Apply a theme by ID (standalone function)
 */
async function applyThemeById(themeId: string): Promise<void> {
  const theme = THEMES[themeId];
  if (!theme) {
    return;
  }

  // Apply theme colors to CSS variables
  applyTheme(theme.colors);
  currentTheme.value = themeId;

  // Save to storage
  try {
    await saveTheme(themeId);
  } catch (error) {
    // Theme save failed silently
  }
}

/**
 * Initialize theme from storage (standalone function)
 */
export async function initTheme(): Promise<void> {
  if (isInitialized.value) return;

  try {
    const savedTheme = await loadTheme();
    await applyThemeById(savedTheme);
  } catch (error) {
    // Fall back to default theme
    await applyThemeById('blue');
  } finally {
    isInitialized.value = true;
  }
}

/**
 * Setup theme auto-sync across extension pages (standalone function)
 * Call this once in your app's root component
 */
export function setupThemeSync() {
  // Listen for theme changes from other parts of the extension
  const unsubscribe = onThemeChange(async (newThemeId) => {
    await applyThemeById(newThemeId);
  });

  // Cleanup on unmount
  return unsubscribe;
}

/**
 * Set theme by ID (standalone function)
 */
export async function setTheme(themeId: string): Promise<void> {
  await applyThemeById(themeId);
}

/**
 * Get current theme (standalone function)
 */
export function getCurrentTheme(): string {
  return currentTheme.value;
}

/**
 * Theme composable for Vue components
 * @returns Theme state and methods
 */
export function useTheme() {
  /**
   * Get current theme colors
   */
  const getCurrentColors = () => {
    return getThemeColors(currentTheme.value);
  };

  /**
   * Check if a specific theme is active
   */
  const isThemeActive = (themeId: string): boolean => {
    return currentTheme.value === themeId;
  };

  return {
    currentTheme,
    isInitialized,
    setTheme,
    initTheme,
    getCurrentColors,
    isThemeActive,
    allThemes: THEMES,
  };
}

/**
 * Get or create the global theme state (legacy support)
 */
export function getGlobalThemeState() {
  return useTheme();
}
