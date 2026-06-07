import type { Metadata } from 'next';
import { Outfit, DM_Sans, JetBrains_Mono } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from '@/components/ErrorBoundary';
import { CustomLoader } from '@/components/ui/CustomLoader';
import { ThemeProvider } from '@/components/ThemeProvider';
import './globals.css';

const fontDisplay = Outfit({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700'],
});

const fontBody = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '700'],
});

const fontMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  title: 'AXIOM — AI Excel Visualizer',
  description: 'Upload. Analyze. Understand. The AI-powered Excel visualization tool.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fontDisplay.variable} ${fontBody.variable} ${fontMono.variable}`}>
      <body style={{ backgroundColor: 'var(--bg-space)' }}>
        <ThemeProvider>
          <ErrorBoundary>
            {children}
            <CustomLoader />
          </ErrorBoundary>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'var(--bg-card)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-primary)',
                backdropFilter: 'blur(24px)',
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
