import type { Metadata, Viewport } from "next";
import { Heebo } from "next/font/google";
import AuthProvider from "../components/AuthProvider";
import { ToasterProvider } from "../components/ToasterProvider";
import "./globals.css";

const heebo = Heebo({ subsets: ["hebrew", "latin"] });

export const metadata: Metadata = {
  title: "מערכת לניהול הוצאות | Expense Management",
  description: "מערכת מודרנית וקלה לניהול ההוצאות שלך",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1.0,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark')
                } else {
                  document.documentElement.classList.remove('dark')
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className={`${heebo.className} bg-background text-foreground min-h-screen flex flex-col`}>
        <AuthProvider>
          <ToasterProvider />
          <main className="flex-grow w-full">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
