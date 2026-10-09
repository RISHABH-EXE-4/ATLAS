/**
 * Dynamic Atlas Theme Engine
 * Manages full UI visual transformation across accent colors and surface modes.
 */

export interface AccentOption {
  id: string;
  label: string;
  hex: string;
  hoverHex: string;
  darkHex: string;
  rgb: string;
  textContrast: '#000000' | '#ffffff';
  tagline: string;
  bgPreview: string;
}

export interface ThemeModeOption {
  id: 'dark' | 'solar' | 'midnight' | 'cyberpunk' | 'amoled';
  label: string;
  tagline: string;
  bgApp: string;
  bgSurface: string;
  bgCard: string;
  border: string;
}

export interface CompleteTheme {
  id: string;
  name: string;
  tagline: string;
  accentHex: string;
  modeId: 'dark' | 'solar' | 'midnight' | 'cyberpunk' | 'amoled';
  badge: string;
  emoji: string;
  accentRgb: string;
  bgApp: string;
  bgSurface: string;
  bgCard: string;
  border: string;
  description: string;
}

export const COMPLETE_THEMES: CompleteTheme[] = [
  {
    id: 'solar-amber',
    name: 'Solar Amber',
    tagline: 'Warm golden solar radiance with rich warm cosmic obsidian surfaces',
    accentHex: '#f59e0b',
    modeId: 'solar',
    badge: 'Solar Glow',
    emoji: '☀️',
    accentRgb: '245, 158, 11',
    bgApp: '#0c0a06',
    bgSurface: '#181309',
    bgCard: '#221b0e',
    border: '#382b14',
    description: 'Golden radiant energy: amber buttons, golden telemetry, and warm solar ambient surfaces.',
  },
  {
    id: 'neon-lime',
    name: 'Neon Tactical Lime',
    tagline: 'ATLAS signature fluorescent tactical lime on deep space obsidian',
    accentHex: '#d4ff59',
    modeId: 'dark',
    badge: 'ATLAS Default',
    emoji: '⚡',
    accentRgb: '212, 255, 89',
    bgApp: '#090a0f',
    bgSurface: '#14151e',
    bgCard: '#1a1d2b',
    border: '#232635',
    description: 'The iconic high-visibility engineering aesthetic with fluorescent neon lime and deep space dark panels.',
  },
  {
    id: 'cyber-emerald',
    name: 'Cyber Emerald',
    tagline: 'Matrix security terminal green with deep emerald atmospheric undertones',
    accentHex: '#10b981',
    modeId: 'cyberpunk',
    badge: 'Matrix Cyber',
    emoji: '💎',
    accentRgb: '16, 185, 129',
    bgApp: '#050907',
    bgSurface: '#0c1510',
    bgCard: '#111d17',
    border: '#1a2b20',
    description: 'Cybersecurity operations look: crisp emerald telemetry, green matrix glows, and deep jade darkness.',
  },
  {
    id: 'electric-violet',
    name: 'Electric Violet',
    tagline: 'Synthwave deep electric purple with interstellar atmospheric glow',
    accentHex: '#a855f7',
    modeId: 'dark',
    badge: 'Synthwave',
    emoji: '🔮',
    accentRgb: '168, 85, 247',
    bgApp: '#090611',
    bgSurface: '#140c24',
    bgCard: '#1c1133',
    border: '#2e1c54',
    description: 'Futuristic synthwave vibes: vibrant violet buttons, cosmic purple accents, and void dark surfaces.',
  },
  {
    id: 'hyper-blue',
    name: 'Hyper Blue',
    tagline: 'Aerodynamic deep oceanic cyan with crisp nocturnal indigo atmosphere',
    accentHex: '#38bdf8',
    modeId: 'midnight',
    badge: 'Deep Ocean',
    emoji: '🌌',
    accentRgb: '56, 189, 248',
    bgApp: '#070b18',
    bgSurface: '#0e1428',
    bgCard: '#131b34',
    border: '#1d2843',
    description: 'Crisp aeronautical precision: hyper cyan highlights with rich midnight oceanic depth.',
  },
  {
    id: 'rose-quartz',
    name: 'Rose Quartz',
    tagline: 'Laser ruby neo-coral with velvety burgundy obsidian depths',
    accentHex: '#fb7185',
    modeId: 'dark',
    badge: 'Laser Ruby',
    emoji: '🌹',
    accentRgb: '251, 113, 133',
    bgApp: '#0e0608',
    bgSurface: '#1c0d12',
    bgCard: '#28131a',
    border: '#3f1c29',
    description: 'Radiant neo-coral brilliance: vivid rose highlights and luxury velvety dark ruby card backgrounds.',
  },
  {
    id: 'amoled-stealth',
    name: 'Pure AMOLED Stealth',
    tagline: 'Zero-luminance pitch black for razor OLED contrast and focus',
    accentHex: '#f59e0b',
    modeId: 'amoled',
    badge: 'OLED Zero',
    emoji: '🖤',
    accentRgb: '245, 158, 11',
    bgApp: '#000000',
    bgSurface: '#0c0c0c',
    bgCard: '#141414',
    border: '#222222',
    description: 'Zero pixel luminance on OLED displays: pitch black void with razor-sharp borders and solar accents.',
  },
];

export const ACCENT_PRESETS: AccentOption[] = [
  {
    id: 'amber',
    label: 'Solar Amber',
    hex: '#f59e0b',
    hoverHex: '#d97706',
    darkHex: '#b45309',
    rgb: '245, 158, 11',
    textContrast: '#000000',
    tagline: 'Warm golden radiance & solar energy',
    bgPreview: 'bg-amber-500',
  },
  {
    id: 'lime',
    label: 'Neon Lime',
    hex: '#d4ff59',
    hoverHex: '#b8ea34',
    darkHex: '#84cc16',
    rgb: '212, 255, 89',
    textContrast: '#000000',
    tagline: 'Atlas original fluorescent tactical lime',
    bgPreview: 'bg-[#d4ff59]',
  },
  {
    id: 'emerald',
    label: 'Cyber Emerald',
    hex: '#10b981',
    hoverHex: '#059669',
    darkHex: '#047857',
    rgb: '16, 185, 129',
    textContrast: '#ffffff',
    tagline: 'High-contrast security and matrix green',
    bgPreview: 'bg-emerald-500',
  },
  {
    id: 'violet',
    label: 'Electric Violet',
    hex: '#a855f7',
    hoverHex: '#9333ea',
    darkHex: '#7e22ce',
    rgb: '168, 85, 247',
    textContrast: '#ffffff',
    tagline: 'Synthwave deep electric purple',
    bgPreview: 'bg-purple-500',
  },
  {
    id: 'blue',
    label: 'Hyper Blue',
    hex: '#38bdf8',
    hoverHex: '#0284c7',
    darkHex: '#0369a1',
    rgb: '56, 189, 248',
    textContrast: '#000000',
    tagline: 'Crisp aerodynamic hyper cyan',
    bgPreview: 'bg-sky-400',
  },
  {
    id: 'rose',
    label: 'Rose Quartz',
    hex: '#fb7185',
    hoverHex: '#f43f5e',
    darkHex: '#be123c',
    rgb: '251, 113, 133',
    textContrast: '#ffffff',
    tagline: 'Radiant neo-coral & laser ruby glow',
    bgPreview: 'bg-rose-400',
  },
];

export const THEME_MODE_PRESETS: ThemeModeOption[] = [
  {
    id: 'solar',
    label: 'Solar Amber Atmosphere',
    tagline: 'Warm golden atmospheric obsidian with rich bronze surface tones',
    bgApp: '#0c0a06',
    bgSurface: '#181309',
    bgCard: '#221b0e',
    border: '#382b14',
  },
  {
    id: 'dark',
    label: 'Deep Space Dark (Default)',
    tagline: 'Refined obsidian with deep slate panels',
    bgApp: '#090a0f',
    bgSurface: '#14151e',
    bgCard: '#1a1d2b',
    border: '#232635',
  },
  {
    id: 'midnight',
    label: 'Midnight Indigo',
    tagline: 'Nocturnal deep navy with atmospheric indigo glow',
    bgApp: '#070b18',
    bgSurface: '#0e1428',
    bgCard: '#131b34',
    border: '#1d2843',
  },
  {
    id: 'cyberpunk',
    label: 'Cyberpunk Matrix',
    tagline: 'Dark neon techno with subtle emerald undertones',
    bgApp: '#050807',
    bgSurface: '#0c130f',
    bgCard: '#111d17',
    border: '#1a2b20',
  },
  {
    id: 'amoled',
    label: 'Pure AMOLED Black',
    tagline: 'Zero-luminance pitch black for maximum OLED contrast',
    bgApp: '#000000',
    bgSurface: '#0c0c0c',
    bgCard: '#141414',
    border: '#222222',
  },
];

/**
 * Converts a hex string into an rgb string "r, g, b"
 */
function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return `${r}, ${g}, ${b}`;
  }
  const r = parseInt(clean.substring(0, 2), 16) || 212;
  const g = parseInt(clean.substring(2, 4), 16) || 255;
  const b = parseInt(clean.substring(4, 6), 16) || 89;
  return `${r}, ${g}, ${b}`;
}

/**
 * Injects dynamic theme custom properties onto the document root.
 */
export function applyThemeToDocument(accentHex: string, modeId: string = 'dark'): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const body = document.body;

  // 1. Resolve accent details
  const matchedAccent =
    ACCENT_PRESETS.find((a) => a.hex.toLowerCase() === accentHex.toLowerCase()) ||
    ACCENT_PRESETS[0];

  const rgb = matchedAccent ? matchedAccent.rgb : hexToRgb(accentHex);
  const contrast = matchedAccent ? matchedAccent.textContrast : '#000000';
  const hoverHex = matchedAccent ? matchedAccent.hoverHex : accentHex;
  const darkHex = matchedAccent ? matchedAccent.darkHex : accentHex;

  // 2. Resolve surface mode
  const matchedMode =
    THEME_MODE_PRESETS.find((m) => m.id === modeId) || THEME_MODE_PRESETS[0];

  // 3. Inject CSS custom properties
  root.style.setProperty('--theme-accent', accentHex);
  root.style.setProperty('--theme-accent-hover', hoverHex);
  root.style.setProperty('--theme-accent-dark', darkHex);
  root.style.setProperty('--theme-accent-rgb', rgb);
  root.style.setProperty('--theme-accent-contrast', contrast);
  root.style.setProperty('--theme-accent-glow', `0 0 22px rgba(${rgb}, 0.45)`);
  root.style.setProperty('--theme-accent-glow-sm', `0 0 12px rgba(${rgb}, 0.3)`);
  root.style.setProperty('--theme-accent-light', `rgba(${rgb}, 0.15)`);
  root.style.setProperty('--theme-accent-border', `rgba(${rgb}, 0.35)`);

  // Background and surface properties
  root.style.setProperty('--theme-bg-app', matchedMode.bgApp);
  root.style.setProperty('--theme-bg-surface', matchedMode.bgSurface);
  root.style.setProperty('--theme-bg-card', matchedMode.bgCard);
  root.style.setProperty('--theme-border', matchedMode.border);

  // Set DOM data attributes for CSS selectors
  root.setAttribute('data-accent-color', accentHex);
  root.setAttribute('data-theme-mode', modeId);
  root.setAttribute('data-has-accent', 'true');

  if (body) {
    body.style.backgroundColor = matchedMode.bgApp;
  }
}
