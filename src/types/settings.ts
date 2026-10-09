export interface AppSettings {
  // Google AI Studio API Configuration
  geminiApiKey: string;
  selectedModel: 'gemini-2.5-flash' | 'gemini-3.1-flash-lite' | 'gemini-3.8-flash' | 'gemini-flash-latest';
  temperature: number; // 0.0 - 1.0
  maxTokens: number; // 512 - 8192
  enableGrounding: boolean;

  // Ingestion & Graph Configuration
  atlasMaxFiles: number;
  symbolExtractionDepth: 'standard' | 'deep' | 'all';
  excludeVendor: boolean;

  // UI & Customization
  accentColor: string; // '#d4ff59' | '#f59e0b' | '#10b981' | '#a855f7' | '#38bdf8' | '#fb7185'
  themeMode: 'dark' | 'midnight' | 'cyberpunk' | 'amoled' | 'solar';
  uiDensity: 'comfortable' | 'compact';
  animationsEnabled: boolean;
  hapticFeedback: boolean;

  // Persona Defaults
  defaultPersona: 'beginner' | 'developer' | 'architect';
  autoAnalyzePR: boolean;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  geminiApiKey: '',
  selectedModel: 'gemini-2.5-flash',
  temperature: 0.2,
  maxTokens: 2048,
  enableGrounding: true,

  atlasMaxFiles: 5000,
  symbolExtractionDepth: 'deep',
  excludeVendor: true,

  accentColor: '#d4ff59',
  themeMode: 'dark',
  uiDensity: 'comfortable',
  animationsEnabled: true,
  hapticFeedback: true,

  defaultPersona: 'architect',
  autoAnalyzePR: true,
};
