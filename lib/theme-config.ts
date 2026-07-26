export interface ThemeConfig {
  name: string;
  label: string;
  cssFile: string;
  previewColors: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export const THEME_CONFIGS: ThemeConfig[] = [
  {
    name: 'default',
    label: 'Default',
    cssFile: '/themes/default.css',
    previewColors: {
      primary: 'hsl(240 5.9% 10%)',
      secondary: 'hsl(240 4.8% 95.9%)',
      accent: 'hsl(240 4.8% 95.9%)',
    },
  },
  {
    name: 'blue',
    label: 'Blue',
    cssFile: '/themes/blue.css',
    previewColors: {
      primary: 'hsl(221.2 83.2% 53.3%)',
      secondary: 'hsl(210 40% 96.1%)',
      accent: 'hsl(210 40% 96.1%)',
    },
  },
  {
    name: 'green',
    label: 'Green',
    cssFile: '/themes/green.css',
    previewColors: {
      primary: 'hsl(142.1 76.2% 36.3%)',
      secondary: 'hsl(210 40% 96.1%)',
      accent: 'hsl(210 40% 96.1%)',
    },
  },
  {
    name: 'orange',
    label: 'Orange',
    cssFile: '/themes/orange.css',
    previewColors: {
      primary: 'hsl(20.5 90.2% 48.2%)',
      secondary: 'hsl(60 4.8% 95.9%)',
      accent: 'hsl(60 4.8% 95.9%)',
    },
  },
  {
    name: 'red',
    label: 'Red',
    cssFile: '/themes/red.css',
    previewColors: {
      primary: 'hsl(0 72.2% 50.6%)',
      secondary: 'hsl(0 4.8% 95.9%)',
      accent: 'hsl(0 4.8% 95.9%)',
    },
  },
  {
    name: 'rose',
    label: 'Rose',
    cssFile: '/themes/rose.css',
    previewColors: {
      primary: 'hsl(346.8 77.2% 49.8%)',
      secondary: 'hsl(355 4.8% 95.9%)',
      accent: 'hsl(355 4.8% 95.9%)',
    },
  },
  {
    name: 'violet',
    label: 'Violet',
    cssFile: '/themes/violet.css',
    previewColors: {
      primary: 'hsl(262.1 83.3% 57.8%)',
      secondary: 'hsl(270 4.8% 95.9%)',
      accent: 'hsl(270 4.8% 95.9%)',
    },
  },
  {
    name: 'yellow',
    label: 'Yellow',
    cssFile: '/themes/yellow.css',
    previewColors: {
      primary: 'hsl(47.9 95.8% 53.1%)',
      secondary: 'hsl(60 4.8% 95.9%)',
      accent: 'hsl(60 4.8% 95.9%)',
    },
  },
];

export const DEFAULT_THEME = 'violet';