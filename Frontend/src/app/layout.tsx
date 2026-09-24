import type { Metadata } from 'next';
import './globals.css';
import "flatpickr/dist/flatpickr.css";
import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/context/ToastContext';

export const metadata: Metadata = {
  title: {
    default: "FIRE ALARM INTEGRATION SYSTEM",
    template: "%s | FIRE ALARM INTEGRATION SYSTEM",
  },
  description: "FIRE ALARM INTEGRATION SYSTEM for RSCM",
  icons: {
    apple: "/rscm-fais-icon.svg?v=rscm-fais-1",
    icon: "/rscm-fais-icon.svg?v=rscm-fais-1",
    shortcut: "/rscm-fais-icon.svg?v=rscm-fais-1",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-outfit dark:bg-gray-900">
        <ThemeProvider>
          <ToastProvider>
            <SidebarProvider>{children}</SidebarProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
