/**
 * Theme Configuration
 * RGB values for all 9 brand color presets
 */

export interface ThemeColors {
  50: string;
  100: string;
  500: string;
  600: string;
  700: string;
}

export interface Theme {
  id: string;
  name: string;
  colors: ThemeColors;
  colorClass: string;
  ringClass: string;
}

export const THEMES: Record<string, Theme> = {
  // Cool Tones
  blue: {
    id: 'blue',
    name: '科技蓝',
    colors: {
      50: '239 246 255',
      100: '219 234 254',
      500: '59 130 246',
      600: '37 99 235',
      700: '29 78 216',
    },
    colorClass: 'bg-blue-600',
    ringClass: 'ring-blue-600',
  },
  indigo: {
    id: 'indigo',
    name: '深邃靛',
    colors: {
      50: '238 242 255',
      100: '224 231 255',
      500: '99 102 241',
      600: '79 70 229',
      700: '67 56 202',
    },
    colorClass: 'bg-indigo-600',
    ringClass: 'ring-indigo-600',
  },
  violet: {
    id: 'violet',
    name: '极光紫',
    colors: {
      50: '245 243 255',
      100: '237 233 254',
      500: '139 92 246',
      600: '124 58 237',
      700: '109 40 217',
    },
    colorClass: 'bg-violet-600',
    ringClass: 'ring-violet-600',
  },

  // Warm/Vibrant Tones
  fuchsia: {
    id: 'fuchsia',
    name: '霓虹粉',
    colors: {
      50: '253 244 255',
      100: '250 232 255',
      500: '217 70 239',
      600: '192 38 211',
      700: '162 28 175',
    },
    colorClass: 'bg-fuchsia-500',
    ringClass: 'ring-fuchsia-500',
  },
  rose: {
    id: 'rose',
    name: '珊瑚红',
    colors: {
      50: '255 241 242',
      100: '255 228 229',
      500: '244 63 94',
      600: '225 29 72',
      700: '190 18 60',
    },
    colorClass: 'bg-rose-500',
    ringClass: 'ring-rose-500',
  },
  orange: {
    id: 'orange',
    name: '活力橙',
    colors: {
      50: '255 247 237',
      100: '255 237 213',
      500: '249 115 22',
      600: '234 88 12',
      700: '194 65 12',
    },
    colorClass: 'bg-orange-500',
    ringClass: 'ring-orange-500',
  },

  // Nature/Neutral Tones
  amber: {
    id: 'amber',
    name: '琥珀金',
    colors: {
      50: '255 251 235',
      100: '254 243 199',
      500: '245 158 11',
      600: '217 119 6',
      700: '180 83 9',
    },
    colorClass: 'bg-amber-500',
    ringClass: 'ring-amber-500',
  },
  emerald: {
    id: 'emerald',
    name: '翡翠绿',
    colors: {
      50: '236 253 245',
      100: '209 250 229',
      500: '16 185 129',
      600: '5 150 105',
      700: '4 120 87',
    },
    colorClass: 'bg-emerald-500',
    ringClass: 'ring-emerald-500',
  },
  slate: {
    id: 'slate',
    name: '极简灰',
    colors: {
      50: '248 250 252',
      100: '241 245 249',
      500: '100 116 139',
      600: '71 85 105',
      700: '51 65 85',
    },
    colorClass: 'bg-slate-600',
    ringClass: 'ring-slate-600',
  },
};

/**
 * Get theme colors for a specific theme
 */
export function getThemeColors(themeId: string): ThemeColors {
  return THEMES[themeId]?.colors || THEMES.blue.colors;
}

/**
 * Get all available themes
 */
export function getAllThemes(): Theme[] {
  return Object.values(THEMES);
}
