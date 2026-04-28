import { Platform } from 'react-native';

export const Colors = {
  background: '#F9F7F7',
  backgroundElement: '#DBE2EF',
  primary: '#3F72AF',
  text: '#112D4E',
  textSecondary: '#3F72AF',
  border: '#DBE2EF',
  white: '#FFFFFF',
} as const;

export type ThemeColor = keyof typeof Colors;

export const Fonts = Platform.select({
  ios: {
    sans: 'System',
    serif: 'Georgia',
    rounded: 'Arial Rounded MT Bold',
    mono: 'Courier',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 34, android: 16 }) ?? 0;
export const MaxContentWidth = 800;
