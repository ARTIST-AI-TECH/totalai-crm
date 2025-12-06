import './styles.css';
import type { Metadata, Viewport } from 'next';
import { Manrope, IBM_Plex_Mono } from 'next/font/google';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { SWRConfig } from 'swr';
import { ThemeProvider } from '@/components/theme-provider';
import { ColorThemeProvider } from '@/lib/theme-context';

export const metadata: Metadata = {
  title: 'FlowControl CRM',
  description: 'Plumbing CRM for managing work orders, scheduling, and invoicing.'
};

export const viewport: Viewport = {
  maximumScale: 1
};

const manrope = Manrope({ subsets: ['latin'], variable: '--font-sans' });
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-mono'
});

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const savedTheme = localStorage.getItem('color-theme');
                const themeTokens = {
                  default: { light: { '--primary': '240 5.9% 10%', '--primary-foreground': '0 0% 98%' }, dark: { '--primary': '0 0% 98%', '--primary-foreground': '240 5.9% 10%' } },
                  blue: { light: { '--primary': '221.2 83.2% 53.3%', '--primary-foreground': '210 40% 98%' }, dark: { '--primary': '217.2 91.2% 59.8%', '--primary-foreground': '240 5.9% 10%' } },
                  green: { light: { '--primary': '142.1 76.2% 36.3%', '--primary-foreground': '355.7 100% 97.3%' }, dark: { '--primary': '142.1 70.6% 45.3%', '--primary-foreground': '144.9 100% 6.7%' } },
                  orange: { light: { '--primary': '20.5 90.2% 48.2%', '--primary-foreground': '60 9.1% 97.8%' }, dark: { '--primary': '20.5 90.2% 48.2%', '--primary-foreground': '60 9.1% 97.8%' } },
                  red: { light: { '--primary': '0 72.2% 50.6%', '--primary-foreground': '0 85.7% 97.3%' }, dark: { '--primary': '0 72.2% 50.6%', '--primary-foreground': '0 85.7% 97.3%' } },
                  rose: { light: { '--primary': '346.8 77.2% 49.8%', '--primary-foreground': '355.7 100% 97.3%' }, dark: { '--primary': '346.8 77.2% 49.8%', '--primary-foreground': '355.7 100% 97.3%' } },
                  violet: {
                    light: {
                      '--primary': '262.1 83.3% 57.8%',
                      '--primary-foreground': '210 20% 98%',
                      '--primary-hover': '271 81% 56%',
                      '--primary-light': '270 100% 96%',
                      '--accent': '47 100% 60%',
                      '--accent-foreground': '222 47% 11%',
                      '--accent-hover': '43 96% 56%',
                      '--accent-light': '270 100% 98%',
                      '--success': '160 84% 39%',
                      '--success-light': '160 84% 95%',
                      '--warning': '43 96% 56%',
                      '--warning-light': '43 96% 95%',
                      '--info': '217 91% 60%',
                      '--info-light': '217 91% 95%'
                    },
                    dark: {
                      '--primary': '263.4 70% 50.4%',
                      '--primary-foreground': '210 20% 98%',
                      '--primary-hover': '258 85% 70%',
                      '--primary-light': '258 50% 20%',
                      '--accent': '47 100% 60%',
                      '--accent-foreground': '240 10% 15%',
                      '--accent-hover': '47 100% 55%',
                      '--accent-light': '47 50% 20%',
                      '--success': '142 76% 36%',
                      '--success-light': '142 50% 15%',
                      '--warning': '38 92% 50%',
                      '--warning-light': '38 50% 15%',
                      '--info': '217 91% 60%',
                      '--info-light': '217 50% 15%'
                    }
                  },
                  yellow: { light: { '--primary': '47.9 95.8% 53.1%', '--primary-foreground': '26 83.3% 14.1%' }, dark: { '--primary': '47.9 95.8% 53.1%', '--primary-foreground': '26 83.3% 14.1%' } }
                };
                
                const theme = (savedTheme && themeTokens[savedTheme]) ? savedTheme : 'violet';
                const tokens = themeTokens[theme];
                
                // Apply light tokens immediately
                Object.entries(tokens.light).forEach(([property, value]) => {
                  document.documentElement.style.setProperty(property, value);
                });
                
                // Add dark mode styles
                const darkCSS = Object.entries(tokens.dark).map(([property, value]) => property + ': ' + value + ';').join(' ');
                const style = document.createElement('style');
                style.id = 'initial-theme';
                style.textContent = '.dark { ' + darkCSS + ' }';
                document.head.appendChild(style);
              } catch (e) {
                console.warn('Failed to apply initial theme');
              }
            `,
          }}
        />
      </head>
      <body className={`min-h-[100dvh] ${manrope.variable} ${ibmPlexMono.variable}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <ColorThemeProvider>
            <SWRConfig
              value={{
                fallback: {
                  // We do NOT await here
                  // Only components that read this data will suspend
                  '/api/user': getUser(),
                  '/api/team': getTeamForUser()
                }
              }}
            >
              {children}
            </SWRConfig>
          </ColorThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
